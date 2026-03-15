import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { CommercialParamsSchema } from './schemas/commercial-params.schema';
import { DocumentNumberingSchema } from './schemas/document-numbering.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'CommercialParams', schema: CommercialParamsSchema },
            { name: 'DocumentNumbering', schema: DocumentNumberingSchema },
        ]),
    ],
    controllers: [SettingsController],
    providers: [SettingsService],
    exports: [SettingsService],
})
export class SettingsModule { }
