import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';

@Injectable()
export class SettingsService implements OnModuleInit {
    constructor(
        private prisma: PrismaService,
    ) { }

    async onModuleInit() {
        // Seed default settings if none exist
        const paramsCount = await this.prisma.commercialParams.count();
        if (paramsCount === 0) {
            await this.prisma.commercialParams.create({
                data: {
                    priceLevels: [
                        { level: 'A', name: 'Nivel A', description: 'Mayoristas VIP', isActive: true },
                        { level: 'B', name: 'Nivel B', description: 'Distribuidores', isActive: true },
                        { level: 'C', name: 'Nivel C', description: 'Público General', isActive: true },
                        { level: 'D', name: 'Nivel D', description: 'Especial', isActive: true },
                        { level: 'E', name: 'Nivel E', description: 'Mínimo', isActive: true },
                    ] as any,
                    paymentTermsOptions: [
                        { code: 'CONTADO', label: 'Contado', days: 0, isActive: true },
                        { code: 'CREDITO_15', label: 'Crédito 15 Días', days: 15, isActive: true },
                        { code: 'CREDITO_30', label: 'Crédito 30 Días', days: 30, isActive: true },
                    ] as any
                }
            });
        }

        const numberingCount = await this.prisma.documentNumbering.count();
        if (numberingCount === 0) {
            const defaultDocs = [
                { code: 'quote', documentLabel: 'Cotización', prefix: 'COT-', currentNumber: 1, paddingLength: 5 },
                { code: 'sale', documentLabel: 'Factura', prefix: 'FAC-', currentNumber: 1, paddingLength: 5 },
                { code: 'packing', documentLabel: 'Lista de Empaque', prefix: 'PKG-', currentNumber: 1, paddingLength: 5 },
                { code: 'purchase', documentLabel: 'Órden de Compra', prefix: 'OC-', currentNumber: 1, paddingLength: 5 },
                { code: 'receipt', documentLabel: 'Recibo de Pago', prefix: 'REC-', currentNumber: 1, paddingLength: 5 },
            ];
            for (const doc of defaultDocs) {
                await this.prisma.documentNumbering.create({ data: doc });
            }
        }
    }

    async getCommercialParams(): Promise<any | null> {
        return this.prisma.commercialParams.findFirst();
    }

    async updateCommercialParams(data: any): Promise<any> {
        const first = await this.prisma.commercialParams.findFirst();
        if (first) {
            return this.prisma.commercialParams.update({
                where: { id: first.id },
                data: {
                    priceLevels: data.priceLevels,
                    paymentTermsOptions: data.paymentTermsOptions,
                    taxConfig: data.taxConfig,
                    notes: data.notes
                }
            });
        } else {
            return this.prisma.commercialParams.create({ data });
        }
    }

    async getDocumentNumbering(): Promise<any[]> {
        return this.prisma.documentNumbering.findMany();
    }

    async updateDocumentNumbering(id: string, data: any): Promise<any | null> {
        return this.prisma.documentNumbering.update({
            where: { id },
            data
        });
    }

    async getNextNumber(code: string): Promise<string> {
        const doc = await this.prisma.documentNumbering.findUnique({ where: { code } });
        if (!doc) return '00000';

        const nextNum = doc.prefix + String(doc.currentNumber).padStart(doc.paddingLength, '0');

        // Increment for next time
        await this.prisma.documentNumbering.update({
            where: { code },
            data: { currentNumber: { increment: 1 } }
        });

        return nextNum;
    }
}
