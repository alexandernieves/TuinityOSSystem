import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ShipmentQueryDto } from './dto/shipment-query.dto';
import { UpdateTrafficDocsDto } from './dto/update-shipment.dto';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TrafficService {
  private readonly logger = new Logger(TrafficService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create a shipment by grouping selected sales (invoices).
   * This prepares the structure for DMC, BL, and Packing Lists.
   */
  async create(createDto: CreateShipmentDto, tenantId: string, userId: string) {
    const { saleIds, ...shipmentData } = createDto;

    if (!saleIds || saleIds.length === 0) {
      throw new BadRequestException(
        'At least one sales order is required to create a shipment.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Validate Sales
      const sales = await tx.sale.findMany({
        where: {
          id: { in: saleIds },
          tenantId,
          status: { in: ['COMPLETED', 'APPROVED_ORDER', 'PACKING'] }, // Ensure sales are ready
        },
        include: { items: { include: { product: true } } },
      });

      if (sales.length !== saleIds.length) {
        const foundIds = sales.map((s) => s.id);
        const missingIds = saleIds.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `Sales not found or not eligible: ${missingIds.join(', ')}`,
        );
      }

      // 2. Generate Shipment Number
      const count = await tx.shipment.count({ where: { tenantId } });
      const shipmentNumber = `SH-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

      // 3. Prepare Shipment Items (Snapshots for Traffic Docs)
      const shipmentItemsData: any[] = [];
      for (const sale of sales) {
        for (const item of sale.items) {
          // Calculate remaining quantity to pack if partially shipped?
          // For MVP simplicity, we assume full shipment of selected sales for now.
          // Future: check item.quantityPacked

          shipmentItemsData.push({
            tenantId,
            saleItemId: item.id,
            productId: item.productId,
            quantity: new Prisma.Decimal(item.quantity),
            tariffCode: item.product.codigoArancelario,
            weight: item.product.weight
              ? new Prisma.Decimal(item.product.weight).mul(
                  new Prisma.Decimal(item.quantity),
                )
              : null,
            volume: item.product.volume
              ? new Prisma.Decimal(item.product.volume).mul(
                  new Prisma.Decimal(item.quantity),
                )
              : null,
          });
        }
      }

      // 4. Create Shipment
      const shipment = await tx.shipment.create({
        data: {
          tenantId,
          shipmentNumber,
          status: 'DRAFT', // Starts as Draft
          ...shipmentData,
          createdBy: userId,
          items: {
            create: shipmentItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // 5. Update Sales Status to PACKING
      await tx.sale.updateMany({
        where: { id: { in: saleIds } },
        data: { status: 'PACKING' },
      });

      return shipment;
    });
  }

  /**
   * Find all shipments with filters
   */
  async findAll(query: ShipmentQueryDto, tenantId: string) {
    const {
      page,
      limit,
      status,
      shipmentNumber,
      dmcNumber,
      destination,
      startDate,
      endDate,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ShipmentWhereInput = {
      tenantId,
      ...(status ? { status } : {}),
      ...(shipmentNumber
        ? { shipmentNumber: { contains: shipmentNumber, mode: 'insensitive' } }
        : {}),
      ...(dmcNumber
        ? { dmcNumber: { contains: dmcNumber, mode: 'insensitive' } }
        : {}),
      ...(destination
        ? { destination: { contains: destination, mode: 'insensitive' } }
        : {}),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { items: true } },
        },
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats(tenantId: string) {
    const stats = await this.prisma.shipment.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
    });

    // Map to a more friendly object
    const result = {
      DRAFT: 0,
      PACKED: 0,
      DISPATCHED: 0,
      IN_TRANSIT: 0,
      ARRIVED: 0,
      DELIVERED: 0,
      TOTAL: 0,
    };

    stats.forEach((s) => {
      (result as any)[s.status] = s._count;
      result.TOTAL += s._count;
    });

    return result;
  }

  /**
   * Get single shipment details
   */
  async findOne(id: string, tenantId: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, tenantId },
      include: {
        events: { orderBy: { eventDate: 'desc' } },
        items: {
          include: {
            product: { select: { description: true, codigoArancelario: true } },
            saleItem: {
              include: {
                sale: { select: { orderNumber: true, quoteNumber: true } },
              },
            },
          },
        },
      } as any,
    });

    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);
    return shipment;
  }

  /**
   * Update Regulatory Docs (DMC, BL, etc.)
   */
  async updateDocs(
    id: string,
    updateDto: UpdateTrafficDocsDto,
    tenantId: string,
    userId: string,
  ) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, tenantId },
    });
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: {
        ...updateDto,
        dispatchDate: updateDto.dispatchDate
          ? new Date(updateDto.dispatchDate)
          : undefined,
        etd: (updateDto as any).etd
          ? new Date((updateDto as any).etd)
          : undefined,
        eta: (updateDto as any).eta
          ? new Date((updateDto as any).eta)
          : undefined,
        actualArrival: (updateDto as any).actualArrival
          ? new Date((updateDto as any).actualArrival)
          : undefined,
        updatedAt: new Date(),
      } as any,
    });

    return updated;
  }

  async addEvent(
    shipmentId: string,
    dto: any,
    tenantId: string,
    userId: string,
  ) {
    return (this.prisma as any).shipmentEvent.create({
      data: {
        ...dto,
        shipmentId,
        tenantId,
        createdBy: userId,
      },
    });
  }

  async updateStatus(
    id: string,
    status: string,
    tenantId: string,
    userId: string,
  ) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, tenantId },
    });
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: { status },
    });

    // Auto-log event
    await this.addEvent(
      id,
      {
        status,
        description: `Estado actualizado a ${status}`,
      },
      tenantId,
      userId,
    );

    return updated;
  }

  /**
   * Generate Packing List Data (Grouped by Tariff Code)
   * Requirement: Ariel needs packing list grouped by category/tariff code.
   */
  async getPackingList(id: string, tenantId: string) {
    const shipment: any = await this.findOne(id, tenantId);

    // Group items by Tariff Code
    const groupedByTariff: Record<string, any[]> = {};

    for (const item of shipment.items) {
      const code = item.tariffCode || 'NO-CODE';
      if (!groupedByTariff[code]) {
        groupedByTariff[code] = [];
      }
      groupedByTariff[code].push({
        description: item.product.description,
        quantity: item.quantity,
        weight: item.weight,
        volume: item.volume,
        saleOrder: item.saleItem.sale.orderNumber,
      });
    }

    return {
      shipmentNumber: shipment.shipmentNumber,
      destination: shipment.destination,
      carrier: shipment.carrierName,
      booking: shipment.bookingNumber,
      container: shipment.containerNumber,
      seal: shipment.sealNumber,
      groupedItems: groupedByTariff,
      totalItems: shipment.items.length,
      generatedAt: new Date(),
    };
  }

  /**
   * Mark shipment as Dispatched
   * Changes status and finalizes related Sales if fully shipped.
   */
  async dispatch(id: string, tenantId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.findFirst({
        where: { id, tenantId },
        include: { items: { include: { saleItem: true } } },
      });

      if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);
      if (shipment.status === 'DISPATCHED')
        throw new BadRequestException('Shipment already dispatched');

      // Update Shipment Status
      const updatedShipment = await tx.shipment.update({
        where: { id },
        data: {
          status: 'DISPATCHED',
          dispatchDate: new Date(),
        },
      });

      // Update Sales Status based on items?
      // Collect unique sale IDs
      const saleIds = [
        ...new Set(shipment.items.map((i) => i.saleItem.saleId)),
      ];

      // For MVP, we assume if dispatched via traffic, the Order is Fulfilled/Start Shipping.
      // We can mark them as PARTIAL or COMPLETED depending on logic.
      // Let's mark as 'PARTIAL' (Shipped) for now, 'COMPLETED' is for Invoice+Paid+Shipped usually.
      await tx.sale.updateMany({
        where: { id: { in: saleIds }, tenantId },
        data: { status: 'PARTIAL' }, // Using PARTIAL to denote Shipped/In-Transit phase before final completion
      });

      // Phase 4: Logistics Notification
      await this.notificationsService.create(tenantId, {
        type: 'SUCCESS',
        title: 'Cargamento Despachado',
        message: `El cargamento ${shipment.shipmentNumber} con destino a ${shipment.destination || 'N/A'} ha sido despachado satisfactoriamente.`,
        link: `/dashboard/trafico/${shipment.id}`,
      });

      return updatedShipment;
    });
  }

  async generateDmcPdf(id: string, tenantId: string): Promise<Buffer> {
    const shipment: any = await this.findOne(id, tenantId);

    const PdfPrinter = require('pdfmake');
    const fonts = {
      Roboto: {
        normal: 'node_modules/pdfmake/build/vfs_fonts.js',
        bold: 'node_modules/pdfmake/build/vfs_fonts.js',
      },
    };

    const printer = new PdfPrinter(fonts);

    // Group items by Tariff Code for the PDF
    const groupedByTariff: Record<string, any[]> = {};
    shipment.items.forEach((item: any) => {
      const code = item.tariffCode || 'OTRO / OTROS';
      if (!groupedByTariff[code]) groupedByTariff[code] = [];
      groupedByTariff[code].push(item);
    });

    const docDefinition: any = {
      content: [
        {
          text: 'DECLARACIÓN DE MERCANCÍAS DE CARGA (DMC)',
          style: 'header',
          alignment: 'center',
        },
        { text: '\n' },
        {
          columns: [
            { text: `Shipment: ${shipment.shipmentNumber}`, bold: true },
            {
              text: `DMC: ${shipment.dmcNumber || 'PND'}`,
              bold: true,
              alignment: 'right',
            },
          ],
        },
        { text: `Destino: ${shipment.destination || 'N/A'}` },
        { text: `Naviera/Transporte: ${shipment.carrierName || 'N/A'}` },
        {
          text: `Contenedor: ${shipment.containerNumber || 'N/A'} | Sello: ${shipment.sealNumber || 'N/A'}`,
        },
        { text: '\n' },
        ...Object.entries(groupedByTariff).flatMap(([code, items]) => [
          {
            text: `PARTIDA ARANCELARIA: ${code}`,
            style: 'categoryHeader',
            margin: [0, 10, 0, 5],
          },
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto'],
              body: [
                [
                  { text: 'Descripción del Producto', style: 'tableHeader' },
                  {
                    text: 'Cant (Cajas)',
                    style: 'tableHeader',
                    alignment: 'center',
                  },
                  {
                    text: 'Peso (KG)',
                    style: 'tableHeader',
                    alignment: 'right',
                  },
                ],
                ...items.map((item: any) => [
                  item.product.description,
                  { text: item.quantity.toString(), alignment: 'center' },
                  {
                    text: item.weight ? item.weight.toString() : '0.00',
                    alignment: 'right',
                  },
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
          },
        ]),
      ],
      styles: {
        header: { fontSize: 16, bold: true, color: '#1E293B' },
        categoryHeader: {
          fontSize: 10,
          bold: true,
          color: '#2563EB',
          background: '#EFF6FF',
        },
        tableHeader: { fontSize: 9, bold: true, color: '#475569' },
      },
      defaultStyle: { fontSize: 9 },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }

  async generateBlPdf(id: string, tenantId: string): Promise<Buffer> {
    const shipment: any = await this.findOne(id, tenantId);

    const PdfPrinter = require('pdfmake');
    const fonts = {
      Roboto: {
        normal: 'node_modules/pdfmake/build/vfs_fonts.js',
        bold: 'node_modules/pdfmake/build/vfs_fonts.js',
      },
    };

    const printer = new PdfPrinter(fonts);

    // Group items for BL PDF
    const groupedByTariff: Record<string, any[]> = {};
    shipment.items.forEach((item: any) => {
      const code = item.tariffCode || 'OTRO';
      if (!groupedByTariff[code]) groupedByTariff[code] = [];
      groupedByTariff[code].push(item);
    });

    const docDefinition: any = {
      content: [
        { text: 'BILL OF LADING (BL)', style: 'header', alignment: 'center' },
        { text: '\n' },
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'SHIPPER:', style: 'label' },
                { text: 'EVOLUTION ZONA LIBRE', bold: true },
                { text: 'ZONA LIBRE DE COLON, PANAMA', fontSize: 8 },
                { text: '\n' },
                { text: 'CARRIER:', style: 'label' },
                { text: shipment.carrierName || 'TO BE ADVISED', bold: true },
              ],
            },
            {
              width: '50%',
              stack: [
                { text: 'BL NUMBER:', style: 'label', alignment: 'right' },
                {
                  text: shipment.blNumber || 'PENDING',
                  bold: true,
                  alignment: 'right',
                  fontSize: 14,
                },
                { text: '\n' },
                { text: 'DESTINATION:', style: 'label', alignment: 'right' },
                {
                  text: shipment.destination || 'N/A',
                  bold: true,
                  alignment: 'right',
                },
              ],
            },
          ],
        },
        { text: '\n' },
        {
          table: {
            widths: ['*', 'auto', 'auto'],
            body: [
              [
                { text: 'CARGO DESCRIPTION', style: 'tableHeader' },
                { text: 'QUANTITY', style: 'tableHeader', alignment: 'center' },
                {
                  text: 'WEIGHT (KG)',
                  style: 'tableHeader',
                  alignment: 'right',
                },
              ],
              ...Object.entries(groupedByTariff).flatMap(([code, items]) => [
                [
                  {
                    text: `TARIFF CODE: ${code}`,
                    bold: true,
                    colSpan: 3,
                    fillColor: '#F1F5F9',
                  },
                  {},
                  {},
                ],
                ...items.map((item: any) => [
                  item.product.description,
                  { text: item.quantity.toString(), alignment: 'center' },
                  {
                    text: item.weight ? item.weight.toString() : '0.00',
                    alignment: 'right',
                  },
                ]),
              ]),
            ],
          },
        },
        { text: '\n\n' },
        {
          text: 'FREIGHT PREPAID',
          alignment: 'center',
          bold: true,
          fontSize: 12,
        },
      ],
      styles: {
        header: { fontSize: 20, bold: true },
        label: { fontSize: 8, color: '#64748B', bold: true },
        tableHeader: {
          fontSize: 9,
          bold: true,
          background: '#1E293B',
          color: 'white',
        },
      },
      defaultStyle: { fontSize: 9 },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }

  async generateFreeSalePdf(id: string, tenantId: string): Promise<Buffer> {
    const shipment: any = await this.findOne(id, tenantId);

    const PdfPrinter = require('pdfmake');
    const fonts = {
      Roboto: {
        normal: 'node_modules/pdfmake/build/vfs_fonts.js',
        bold: 'node_modules/pdfmake/build/vfs_fonts.js',
      },
    };

    const printer = new PdfPrinter(fonts);

    const docDefinition: any = {
      content: [
        {
          text: 'CERTIFICADO DE LIBRE VENTA',
          style: 'header',
          alignment: 'center',
        },
        {
          text: '(FREE SALE CERTIFICATE)',
          style: 'subheader',
          alignment: 'center',
        },
        { text: '\n\n' },
        {
          text: [
            'Por medio de la presente se certifica que las mercancías detalladas a continuación, ',
            'amparadas bajo el despacho ',
            { text: shipment.shipmentNumber, bold: true },
            ', son de libre venta ',
            'y consumo en la República de Panamá y son exportadas a través de la Zona Libre de Colón.',
          ],
          alignment: 'justify',
        },
        { text: '\n' },
        {
          text: [
            'This is to certify that the following goods related to shipment ',
            { text: shipment.shipmentNumber, bold: true },
            ' ',
            'are sold freely and consumed in the Republic of Panama and are exported through the Colon Free Zone.',
          ],
          alignment: 'justify',
          italics: true,
        },
        { text: '\n\n' },
        { text: 'Detalle de Mercancía (Goods Detail):', style: 'subheader' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto'],
            body: [
              ['Description', 'Tariff Code', 'Quantity'],
              ...shipment.items.map((item: any) => [
                item.product.description,
                item.tariffCode || 'N/A',
                item.quantity.toString(),
              ]),
            ],
          },
        },
        { text: '\n\n\n\n' },
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 150,
                      y2: 0,
                      lineWidth: 1,
                    },
                  ],
                },
                {
                  text: 'Firma Autorizada',
                  alignment: 'left',
                  margin: [0, 5, 0, 0],
                },
                {
                  text: 'Authorized Signature',
                  italics: true,
                  alignment: 'left',
                },
              ],
            },
            {
              width: 'auto',
              text: `Fecha (Date): ${new Date().toLocaleDateString()}`,
              alignment: 'right',
            },
          ],
        },
      ],
      styles: {
        header: { fontSize: 18, bold: true },
        subheader: { fontSize: 12, bold: true },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }
}
