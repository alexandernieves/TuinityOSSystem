import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrafficController } from './traffic.controller';
import { TrafficService } from './traffic.service';
import { Expedient, ExpedientSchema } from './schemas/expedient.schema';
import { DMC, DMCSchema } from './schemas/dmc.schema';
import { BillOfLading, BillOfLadingSchema } from './schemas/bl.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Expedient.name, schema: ExpedientSchema },
            { name: DMC.name, schema: DMCSchema },
            { name: BillOfLading.name, schema: BillOfLadingSchema },
        ]),
    ],
    controllers: [TrafficController],
    providers: [TrafficService],
    exports: [TrafficService],
})
export class TrafficModule { }
