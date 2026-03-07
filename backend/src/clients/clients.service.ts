import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client, ClientDocument } from './schemas/client.schema';

@Injectable()
export class ClientsService {
    constructor(
        @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    ) { }

    async create(createClientDto: any): Promise<ClientDocument> {
        const existing = await this.clientModel.findOne({ reference: createClientDto.reference });
        if (existing) {
            throw new BadRequestException(`El cliente con referencia ${createClientDto.reference} ya existe.`);
        }
        const newClient = new this.clientModel(createClientDto);
        return newClient.save();
    }

    async findAll(filters: any = {}): Promise<ClientDocument[]> {
        const query: any = {};
        if (filters.status) query.status = filters.status;
        if (filters.type) query.type = filters.type;
        return this.clientModel.find(query).sort({ name: 1 }).exec();
    }

    async findOne(id: string): Promise<ClientDocument> {
        const client = await this.clientModel.findById(id).exec();
        if (!client) throw new NotFoundException(`Cliente ${id} no encontrado`);
        return client;
    }

    async update(id: string, updateClientDto: any): Promise<ClientDocument> {
        const client = await this.clientModel.findByIdAndUpdate(id, updateClientDto, { new: true }).exec();
        if (!client) throw new NotFoundException(`Cliente ${id} no encontrado`);
        return client;
    }

    async updateBalance(id: string, amountChange: number): Promise<ClientDocument> {
        const client = await this.findOne(id);
        client.currentBalance += amountChange;
        return client.save();
    }

    async remove(id: string): Promise<any> {
        const client = await this.clientModel.findByIdAndDelete(id).exec();
        if (!client) throw new NotFoundException(`Cliente ${id} no encontrado`);
        return { message: 'Cliente eliminado', id };
    }
}
