import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommercialParams } from './schemas/commercial-params.schema';
import { DocumentNumbering } from './schemas/document-numbering.schema';

@Injectable()
export class SettingsService implements OnModuleInit {
    constructor(
        @InjectModel('CommercialParams') private commercialParamsModel: Model<CommercialParams>,
        @InjectModel('DocumentNumbering') private documentNumberingModel: Model<DocumentNumbering>,
    ) { }

    async onModuleInit() {
        // Seed default settings if none exist
        const paramsCount = await this.commercialParamsModel.countDocuments();
        if (paramsCount === 0) {
            await this.commercialParamsModel.create({
                priceLevels: [
                    { level: 'A', name: 'Nivel A', description: 'Mayoristas VIP', isActive: true },
                    { level: 'B', name: 'Nivel B', description: 'Distribuidores', isActive: true },
                    { level: 'C', name: 'Nivel C', description: 'Público General', isActive: true },
                    { level: 'D', name: 'Nivel D', description: 'Especial', isActive: true },
                    { level: 'E', name: 'Nivel E', description: 'Mínimo', isActive: true },
                ],
                paymentTermsOptions: [
                    { code: 'CONTADO', label: 'Contado', days: 0, isActive: true },
                    { code: 'CREDITO_15', label: 'Crédito 15 Días', days: 15, isActive: true },
                    { code: 'CREDITO_30', label: 'Crédito 30 Días', days: 30, isActive: true },
                ]
            });
        }

        const numberingCount = await this.documentNumberingModel.countDocuments();
        if (numberingCount === 0) {
            const defaultDocs = [
                { code: 'quote', documentLabel: 'Cotización', prefix: 'COT-', currentNumber: 1, paddingLength: 5 },
                { code: 'sale', documentLabel: 'Factura', prefix: 'FAC-', currentNumber: 1, paddingLength: 5 },
                { code: 'purchase', documentLabel: 'Órden de Compra', prefix: 'OC-', currentNumber: 1, paddingLength: 5 },
                { code: 'receipt', documentLabel: 'Recibo de Pago', prefix: 'REC-', currentNumber: 1, paddingLength: 5 },
            ];
            await this.documentNumberingModel.insertMany(defaultDocs);
        }
    }

    async getCommercialParams(): Promise<CommercialParams | null> {
        const params = await this.commercialParamsModel.findOne();
        return params;
    }

    async updateCommercialParams(data: any): Promise<CommercialParams> {
        return this.commercialParamsModel.findOneAndUpdate({}, data, { new: true, upsert: true });
    }

    async getDocumentNumbering(): Promise<DocumentNumbering[]> {
        return this.documentNumberingModel.find();
    }

    async updateDocumentNumbering(id: string, data: any): Promise<DocumentNumbering | null> {
        return this.documentNumberingModel.findByIdAndUpdate(id, data, { new: true });
    }

    async getNextNumber(code: string): Promise<string> {
        const doc = await this.documentNumberingModel.findOne({ code });
        if (!doc) return '00000';

        const nextNum = doc.prefix + String(doc.currentNumber).padStart(doc.paddingLength, '0');

        // Increment for next time
        await this.documentNumberingModel.updateOne({ code }, { $inc: { currentNumber: 1 } });

        return nextNum;
    }
}
