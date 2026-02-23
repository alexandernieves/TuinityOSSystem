import { Module } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';

import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [BrandsController],
  providers: [BrandsService],
})
export class BrandsModule {}
