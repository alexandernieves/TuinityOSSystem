"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TrafficService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrafficService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
let TrafficService = TrafficService_1 = class TrafficService {
    prisma;
    notificationsService;
    logger = new common_1.Logger(TrafficService_1.name);
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async create(createDto, tenantId, userId) {
        const { saleIds, ...shipmentData } = createDto;
        if (!saleIds || saleIds.length === 0) {
            throw new common_1.BadRequestException('At least one sales order is required to create a shipment.');
        }
        return this.prisma.$transaction(async (tx) => {
            const sales = await tx.sale.findMany({
                where: {
                    id: { in: saleIds },
                    tenantId,
                    status: { in: ['COMPLETED', 'APPROVED_ORDER', 'PACKING'] },
                },
                include: { items: { include: { product: true } } },
            });
            if (sales.length !== saleIds.length) {
                const foundIds = sales.map((s) => s.id);
                const missingIds = saleIds.filter((id) => !foundIds.includes(id));
                throw new common_1.NotFoundException(`Sales not found or not eligible: ${missingIds.join(', ')}`);
            }
            const count = await tx.shipment.count({ where: { tenantId } });
            const shipmentNumber = `SH-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;
            const shipmentItemsData = [];
            for (const sale of sales) {
                for (const item of sale.items) {
                    shipmentItemsData.push({
                        tenantId,
                        saleItemId: item.id,
                        productId: item.productId,
                        quantity: new client_1.Prisma.Decimal(item.quantity),
                        tariffCode: item.product.codigoArancelario,
                        weight: item.product.weight
                            ? new client_1.Prisma.Decimal(item.product.weight).mul(new client_1.Prisma.Decimal(item.quantity))
                            : null,
                        volume: item.product.volume
                            ? new client_1.Prisma.Decimal(item.product.volume).mul(new client_1.Prisma.Decimal(item.quantity))
                            : null,
                    });
                }
            }
            const shipment = await tx.shipment.create({
                data: {
                    tenantId,
                    shipmentNumber,
                    status: 'DRAFT',
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
            await tx.sale.updateMany({
                where: { id: { in: saleIds } },
                data: { status: 'PACKING' },
            });
            return shipment;
        });
    }
    async findAll(query, tenantId) {
        const { page, limit, status, shipmentNumber, dmcNumber, destination, startDate, endDate, } = query;
        const skip = (page - 1) * limit;
        const where = {
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
    async getStats(tenantId) {
        const stats = await this.prisma.shipment.groupBy({
            by: ['status'],
            where: { tenantId },
            _count: true,
        });
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
            result[s.status] = s._count;
            result.TOTAL += s._count;
        });
        return result;
    }
    async findOne(id, tenantId) {
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
            },
        });
        if (!shipment)
            throw new common_1.NotFoundException(`Shipment ${id} not found`);
        return shipment;
    }
    async updateDocs(id, updateDto, tenantId, userId) {
        const shipment = await this.prisma.shipment.findFirst({
            where: { id, tenantId },
        });
        if (!shipment)
            throw new common_1.NotFoundException(`Shipment ${id} not found`);
        const updated = await this.prisma.shipment.update({
            where: { id },
            data: {
                ...updateDto,
                dispatchDate: updateDto.dispatchDate
                    ? new Date(updateDto.dispatchDate)
                    : undefined,
                etd: updateDto.etd
                    ? new Date(updateDto.etd)
                    : undefined,
                eta: updateDto.eta
                    ? new Date(updateDto.eta)
                    : undefined,
                actualArrival: updateDto.actualArrival
                    ? new Date(updateDto.actualArrival)
                    : undefined,
                updatedAt: new Date(),
            },
        });
        return updated;
    }
    async addEvent(shipmentId, dto, tenantId, userId) {
        return this.prisma.shipmentEvent.create({
            data: {
                ...dto,
                shipmentId,
                tenantId,
                createdBy: userId,
            },
        });
    }
    async updateStatus(id, status, tenantId, userId) {
        const shipment = await this.prisma.shipment.findFirst({
            where: { id, tenantId },
        });
        if (!shipment)
            throw new common_1.NotFoundException(`Shipment ${id} not found`);
        const updated = await this.prisma.shipment.update({
            where: { id },
            data: { status },
        });
        await this.addEvent(id, {
            status,
            description: `Estado actualizado a ${status}`,
        }, tenantId, userId);
        return updated;
    }
    async getPackingList(id, tenantId) {
        const shipment = await this.findOne(id, tenantId);
        const groupedByTariff = {};
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
    async dispatch(id, tenantId, userId) {
        return this.prisma.$transaction(async (tx) => {
            const shipment = await tx.shipment.findFirst({
                where: { id, tenantId },
                include: { items: { include: { saleItem: true } } },
            });
            if (!shipment)
                throw new common_1.NotFoundException(`Shipment ${id} not found`);
            if (shipment.status === 'DISPATCHED')
                throw new common_1.BadRequestException('Shipment already dispatched');
            const updatedShipment = await tx.shipment.update({
                where: { id },
                data: {
                    status: 'DISPATCHED',
                    dispatchDate: new Date(),
                },
            });
            const saleIds = [
                ...new Set(shipment.items.map((i) => i.saleItem.saleId)),
            ];
            await tx.sale.updateMany({
                where: { id: { in: saleIds }, tenantId },
                data: { status: 'PARTIAL' },
            });
            await this.notificationsService.create(tenantId, {
                type: 'SUCCESS',
                title: 'Cargamento Despachado',
                message: `El cargamento ${shipment.shipmentNumber} con destino a ${shipment.destination || 'N/A'} ha sido despachado satisfactoriamente.`,
                link: `/dashboard/trafico/${shipment.id}`,
            });
            return updatedShipment;
        });
    }
    async generateDmcPdf(id, tenantId) {
        const shipment = await this.findOne(id, tenantId);
        const PdfPrinter = require('pdfmake');
        const fonts = {
            Roboto: {
                normal: 'node_modules/pdfmake/build/vfs_fonts.js',
                bold: 'node_modules/pdfmake/build/vfs_fonts.js',
            },
        };
        const printer = new PdfPrinter(fonts);
        const groupedByTariff = {};
        shipment.items.forEach((item) => {
            const code = item.tariffCode || 'OTRO / OTROS';
            if (!groupedByTariff[code])
                groupedByTariff[code] = [];
            groupedByTariff[code].push(item);
        });
        const docDefinition = {
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
                                ...items.map((item) => [
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
            const chunks = [];
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
            pdfDoc.end();
        });
    }
    async generateBlPdf(id, tenantId) {
        const shipment = await this.findOne(id, tenantId);
        const PdfPrinter = require('pdfmake');
        const fonts = {
            Roboto: {
                normal: 'node_modules/pdfmake/build/vfs_fonts.js',
                bold: 'node_modules/pdfmake/build/vfs_fonts.js',
            },
        };
        const printer = new PdfPrinter(fonts);
        const groupedByTariff = {};
        shipment.items.forEach((item) => {
            const code = item.tariffCode || 'OTRO';
            if (!groupedByTariff[code])
                groupedByTariff[code] = [];
            groupedByTariff[code].push(item);
        });
        const docDefinition = {
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
                                ...items.map((item) => [
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
            const chunks = [];
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
            pdfDoc.end();
        });
    }
    async generateFreeSalePdf(id, tenantId) {
        const shipment = await this.findOne(id, tenantId);
        const PdfPrinter = require('pdfmake');
        const fonts = {
            Roboto: {
                normal: 'node_modules/pdfmake/build/vfs_fonts.js',
                bold: 'node_modules/pdfmake/build/vfs_fonts.js',
            },
        };
        const printer = new PdfPrinter(fonts);
        const docDefinition = {
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
                            ...shipment.items.map((item) => [
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
            const chunks = [];
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
            pdfDoc.end();
        });
    }
};
exports.TrafficService = TrafficService;
exports.TrafficService = TrafficService = TrafficService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], TrafficService);
//# sourceMappingURL=traffic.service.js.map