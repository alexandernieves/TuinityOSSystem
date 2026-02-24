import { Module } from '@nestjs/common';
import { OriginsService } from './origins.service';
import { OriginsController } from './origins.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OriginsController],
  providers: [OriginsService],
  exports: [OriginsService],
})
export class OriginsModule {}
