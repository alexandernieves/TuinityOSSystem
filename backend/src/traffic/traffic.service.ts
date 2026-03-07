import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expedient, ExpedientDocument } from './schemas/expedient.schema';
import { DMC, DMCDocument } from './schemas/dmc.schema';
import { BillOfLading, BLDocument } from './schemas/bl.schema';

@Injectable()
export class TrafficService {
    constructor(
        @InjectModel(Expedient.name) private expedientModel: Model<ExpedientDocument>,
        @InjectModel(DMC.name) private dmcModel: Model<DMCDocument>,
        @InjectModel(BillOfLading.name) private blModel: Model<BLDocument>,
    ) { }

    // Expedients
    async findAllExpedients(): Promise<ExpedientDocument[]> {
        return this.expedientModel.find()
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .exec();
    }

    async findExpedientById(id: string): Promise<ExpedientDocument & { dmcs: any[], bls: any[] }> {
        const expedient = await this.expedientModel.findById(id).populate('createdBy', 'name').exec();
        if (!expedient) throw new NotFoundException('Expedient not found');

        const [dmcs, bls] = await Promise.all([
            this.dmcModel.find({ expedientId: expedient._id }).exec(),
            this.blModel.find({ expedientId: expedient._id }).exec(),
        ]);

        return { ...expedient.toObject(), dmcs, bls } as any;
    }

    async createExpedient(createDto: any): Promise<ExpedientDocument> {
        // Generate reference: EXP-2026-XXXX
        const count = await this.expedientModel.countDocuments();
        const year = new Date().getFullYear();
        const reference = `EXP-${year}-${String(count + 1).padStart(4, '0')}`;

        const createdExpedient = new this.expedientModel({
            ...createDto,
            reference,
        });

        return createdExpedient.save();
    }

    async updateExpedientStatus(id: string, status: string): Promise<ExpedientDocument> {
        const updated = await this.expedientModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
        if (!updated) throw new NotFoundException('Expedient not found');
        return updated;
    }

    // DMC
    async createDMC(createDto: any): Promise<DMCDocument> {
        const count = await this.dmcModel.countDocuments();
        const year = new Date().getFullYear();
        const prefix = createDto.type === 'entrada' ? 'DME' : (createDto.type === 'salida' ? 'DMS' : 'DMT');
        const reference = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;

        const createdDmc = new this.dmcModel({
            ...createDto,
            reference,
        });

        return createdDmc.save();
    }

    // Bill of Lading
    async createBL(createDto: any): Promise<BLDocument> {
        const count = await this.blModel.countDocuments();
        const year = new Date().getFullYear();
        const reference = `BL-${year}-${String(count + 1).padStart(4, '0')}`;

        const createdBl = new this.blModel({
            ...createDto,
            reference,
        });

        return createdBl.save();
    }

    async getStats() {
        const [pendingToday, dmcPending, inTransit, completedThisWeek] = await Promise.all([
            this.expedientModel.countDocuments({ status: 'pendiente' }),
            this.dmcModel.countDocuments({ status: 'borrador' }),
            this.expedientModel.countDocuments({ status: 'en_transito' }),
            this.expedientModel.countDocuments({ status: 'entregado' }), // simplified for now
        ]);

        return {
            pendingToday,
            dmcPending,
            inTransit,
            completedThisWeek,
        };
    }
}
