import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';

@Injectable()
export class TrafficService {
    constructor(private prisma: PrismaService) { }

    // Expedients
    async findAllExpedients(): Promise<any[]> {
        return this.prisma.expedient.findMany({
            include: {
                createdByUser: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findExpedientById(idOrRef: string): Promise<any> {
        const isUuid = idOrRef.length === 36 && idOrRef.includes('-');
        const expedient = await this.prisma.expedient.findFirst({
            where: isUuid ? { id: idOrRef } : { reference: idOrRef },
            include: {
                createdByUser: {
                    select: { name: true }
                },
                dmcs: true,
                bls: true,
                timeline: {
                    orderBy: { createdAt: 'desc' },
                    include: { 
                        expedient: {
                            include: { createdByUser: { select: { name: true } } }
                        }
                    }
                }
            }
        });
        if (!expedient) throw new NotFoundException('Expedient not found');
        return expedient;
    }

    async createExpedient(createDto: any): Promise<any> {
        const count = await this.prisma.expedient.count();
        const year = new Date().getFullYear();
        const reference = `EXP-${year}-${String(count + 1).padStart(4, '0')}`;

        const expedient = await this.prisma.expedient.create({
            data: {
                ...createDto,
                reference,
            },
        } as any);

        await this.registerTimelineEvent({
            expedientId: expedient.id,
            action: 'expediente_creado',
            description: `Expediente ${reference} iniciado desde ${createDto.sourceDocumentType} ${createDto.sourceDocumentId}`,
            userId: createDto.createdByUserId
        });

        return expedient;
    }

    async updateExpedientStatus(id: string, status: string, userId?: string): Promise<any> {
        const exp = await this.findExpedientById(id);

        // Validation for "despachado"
        if (status === 'despachado') {
            const hasDmc = exp.dmcs.some(d => d.status !== 'borrador');
            const hasBl = exp.bls.some(b => b.status !== 'borrador');
            
            if (!hasDmc) throw new BadRequestException('No se puede despachar sin una DMC registrada (no borrador).');
            // BL might be pending but at least DMC is mandatory
        }

        const updated = await this.prisma.expedient.update({
            where: { id: exp.id },
            data: { status }
        });

        await this.registerTimelineEvent({
            expedientId: exp.id,
            action: 'cambio_estado',
            description: `Estado cambiado de ${exp.status} a ${status}`,
            userId
        });

        return updated;
    }

    // DMC
    async createDMC(createDto: any): Promise<any> {
        const count = await this.prisma.dMC.count();
        const year = new Date().getFullYear();
        const prefix = createDto.type === 'entrada' ? 'DME' : (createDto.type === 'salida' ? 'DMS' : 'DMT');
        const reference = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;

        const dmc = await this.prisma.dMC.create({
            data: {
                ...createDto,
                reference,
            },
        });

        await this.registerTimelineEvent({
            expedientId: createDto.expedientId,
            action: 'dmc_generada',
            description: `Documento DMC ${reference} creado`,
            userId: createDto.createdByUserId
        });

        return dmc;
    }

    // Bill of Lading
    async createBL(createDto: any): Promise<any> {
        const count = await this.prisma.billOfLading.count();
        const year = new Date().getFullYear();
        const reference = `BL-${year}-${String(count + 1).padStart(4, '0')}`;

        const bl = await this.prisma.billOfLading.create({
            data: {
                ...createDto,
                reference,
            },
        });

        await this.registerTimelineEvent({
            expedientId: createDto.expedientId,
            action: 'bl_generado',
            description: `Documento Bill of Lading ${reference} creado`,
            userId: createDto.createdByUserId
        });

        return bl;
    }

    async getStats() {
        const promises = [
            this.prisma.expedient.count({ where: { status: 'pendiente' } }),
            this.prisma.dMC.count({ where: { status: 'borrador' } }),
            this.prisma.expedient.count({ where: { status: 'borrador' } }),
            this.prisma.expedient.count({ where: { status: 'completado' } })
        ];
        const [pendingToday, dmcPending, inTransit, completedThisWeek] = await Promise.all(promises);

        return {
            pendingToday,
            dmcPending,
            inTransit,
            completedThisWeek,
        };
    }

    /**
     * Creates an Expedient from an existing Invoice
     */
    async createFromInvoice(invoiceId: string, userId?: string) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                customer: true,
                salesOrder: {
                    include: {
                        packingLists: {
                            where: { status: 'CONFIRMED' },
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            include: { lines: { include: { product: true } } }
                        }
                    }
                },
                lines: {
                    include: {
                        product: {
                            include: { tariffCode: true }
                        }
                    }
                }
            }
        });

        if (!invoice) throw new NotFoundException('Factura no encontrada');

        // Check if already exists
        const existing = await this.prisma.expedient.findFirst({
            where: { sourceDocumentId: invoice.id, sourceDocumentType: 'invoice' }
        });
        if (existing) return existing;

        const packingList = invoice.salesOrder?.packingLists[0];

        // Calculations
        let totalWeight = 0;
        let totalVolume = 0;
        let totalPackages = 0;

        if (packingList && packingList.lines.length > 0) {
            // Use Packing List data
            for (const line of packingList.lines) {
                const qty = Number(line.quantityPacked);
                const unitsPerBox = Number(line.product.unitsPerBox || 1);
                const weightPerPkg = Number(line.product.weightPerPackage || 0);
                const volM3 = Number(line.product.volumeM3 || 0);

                totalWeight += weightPerPkg * (qty / unitsPerBox);
                totalVolume += volM3 * (qty / unitsPerBox);
                totalPackages += Math.ceil(qty / unitsPerBox);
            }
        } else {
            // Fallback to Invoice lines
            totalWeight = invoice.lines.reduce((acc, line) => acc + (Number(line.product.weightPerPackage || 0) * Number(line.quantity) / Number(line.product.unitsPerBox || 1)), 0);
            totalVolume = invoice.lines.reduce((acc, line) => acc + (Number(line.product.volumeM3 || 0) * Number(line.quantity) / Number(line.product.unitsPerBox || 1)), 0);
            totalPackages = invoice.lines.reduce((acc, line) => acc + Math.ceil(Number(line.quantity) / Number(line.product.unitsPerBox || 1)), 0);
        }

        const count = await this.prisma.expedient.count();
        const year = new Date().getFullYear();
        const reference = `EXP-${year}-${String(count + 1).padStart(4, '0')}`;

        const expedient = await this.prisma.expedient.create({
            data: {
                reference,
                type: 'salida',
                status: 'pendiente',
                priority: 'normal',
                sourceDocumentId: invoice.id,
                sourceDocumentType: 'invoice',
                counterpartName: invoice.customer.legalName,
                counterpartCountry: invoice.customer.country,
                createdByUserId: userId,
                totals: {
                    valueFOB: Number(invoice.total),
                    weight: totalWeight,
                    volume: totalVolume,
                    packages: totalPackages
                }
            }
        });

        await this.registerTimelineEvent({
            expedientId: expedient.id,
            action: 'expediente_creado',
            description: `Expediente creado automáticamente tras facturación de ${invoice.number}`,
            userId
        });

        return expedient;
    }

    /**
     * Pre-fills a DMC from Expedient data (Invoice + Packing List)
     */
    async prefillDMC(expedientId: string, userId: string) {
        const exp = await this.findExpedientById(expedientId);
        
        if (exp.sourceDocumentType !== 'invoice') {
            throw new BadRequestException('Solo se pueden prellenar DMCs desde facturas');
        }

        const invoice = await this.prisma.invoice.findUnique({
            where: { id: exp.sourceDocumentId },
            include: {
                customer: true,
                salesOrder: {
                    include: {
                        packingLists: {
                            where: { status: 'CONFIRMED' },
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            include: { lines: { include: { product: { include: { tariffCode: true } } } } }
                        }
                    }
                },
                lines: { include: { product: { include: { tariffCode: true } } } }
            }
        });

        if (!invoice) throw new NotFoundException('Factura origen no encontrada');

        const packingList = invoice.salesOrder?.packingLists[0];
        
        // Items to include (prefer Packing List if available)
        const merchandiseLines: any[] = [];
        
        if (packingList && packingList.lines.length > 0) {
            for (const pLine of packingList.lines) {
                // Find matching invoice line for price
                const iLine = invoice.lines.find(il => il.productId === pLine.productId);
                merchandiseLines.push({
                    sku: pLine.product.sku,
                    description: pLine.product.name,
                    quantity: Number(pLine.quantityPacked),
                    price: iLine ? Number(iLine.unitPrice) : 0,
                    total: iLine ? (Number(iLine.unitPrice) * Number(pLine.quantityPacked)) : 0,
                    hsCode: pLine.product.tariffCode?.code,
                    weight: Number(pLine.product.weightPerPackage || 0) * (Number(pLine.quantityPacked) / Number(pLine.product.unitsPerBox || 1)),
                    countryOfOrigin: pLine.product.countryOfOrigin || 'PANAMA'
                });
            }
        } else {
            for (const iLine of invoice.lines) {
                merchandiseLines.push({
                    sku: iLine.product.sku,
                    description: iLine.product.name,
                    quantity: Number(iLine.quantity),
                    price: Number(iLine.unitPrice),
                    total: Number(iLine.lineTotal),
                    hsCode: iLine.product.tariffCode?.code,
                    weight: Number(iLine.product.weightPerPackage || 0) * (Number(iLine.quantity) / Number(iLine.product.unitsPerBox || 1)),
                    countryOfOrigin: iLine.product.countryOfOrigin || 'PANAMA'
                });
            }
        }

        // Check for amendments if DMC already exists
        const existingDmc = exp.dmcs[0];
        if (existingDmc) {
            await this.registerTimelineEvent({
                expedientId: exp.id,
                action: 'dmc_enmienda',
                description: `Se ha re-generado el pre-llenado de DMC. El documento anterior ${existingDmc.reference} debe ser revisado.`,
                userId,
                metadata: { prevDmc: existingDmc.id }
            });
        }

        return this.createDMC({
            expedientId: exp.id,
            type: 'salida',
            status: 'borrador',
            shipperName: 'TUINITY LOGISTICS S.A.',
            consigneeName: invoice.customer.legalName,
            consigneeCountry: invoice.customer.country,
            merchandiseLines,
            totals: exp.totals,
            createdByUserId: userId
        });
    }

    /**
     * Pre-fills a Bill of Lading from Expedient data + Historial
     */
    async prefillBL(expedientId: string, userId: string) {
        const exp = await this.findExpedientById(expedientId);
        
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: exp.sourceDocumentId },
            include: { customer: true }
        });

        // Search for previous BL for same customer
        const prevBl = await this.prisma.billOfLading.findFirst({
            where: {
                expedient: {
                    sourceDocumentType: 'invoice',
                    sourceDocumentId: { not: exp.sourceDocumentId }
                },
                consigneeName: invoice?.customer.legalName || exp.counterpartName
            },
            orderBy: { createdAt: 'desc' }
        });

        return this.createBL({
            expedientId: exp.id,
            status: 'borrador',
            shipperName: 'TUINITY LOGISTICS S.A.',
            consigneeName: prevBl?.consigneeName || invoice?.customer.legalName || exp.counterpartName,
            vesselName: prevBl?.vesselName || 'POR DEFINIR',
            portOfLoading: prevBl?.portOfLoading || 'COLON CONTAINER TERMINAL',
            portOfDischarge: prevBl?.portOfDischarge || 'POR DEFINIR',
            createdByUserId: userId
        });
    }

    private async registerTimelineEvent(data: { expedientId: string, action: string, description?: string, userId?: string, metadata?: any }) {
        return this.prisma.expedientTimeline.create({
            data: {
                expedientId: data.expedientId,
                action: data.action,
                description: data.description,
                userId: data.userId,
                metadata: data.metadata
            }
        });
    }
}
