import { Module } from '@nestjs/common';
import { CompositionsService } from './compositions.service';
import { CompositionsController } from './compositions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CompositionsController],
  providers: [CompositionsService],
  exports: [CompositionsService],
})
export class CompositionsModule {}
