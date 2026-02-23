import { Module } from '@nestjs/common';
import { BarcodesService } from './barcodes.service';
import { BarcodesController } from './barcodes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BarcodesController],
  providers: [BarcodesService],
  exports: [BarcodesService],
})
export class BarcodesModule {}
