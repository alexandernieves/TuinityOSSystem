import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UsePipes,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BrandsService } from './brands.service';
import { StorageService } from '../storage/storage.service';
import { createBrandSchema } from './dto/create-brand.dto';
import type { CreateBrandDto } from './dto/create-brand.dto';
import { updateBrandSchema } from './dto/update-brand.dto';
import type { UpdateBrandDto } from './dto/update-brand.dto';
import { brandQuerySchema } from './dto/brand-query.dto';
import type { BrandQueryDto } from './dto/brand-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../products/pipes/zod-validation.pipe';
import { RequestContext } from '../common/request-context';

@Controller('brands')
@UseGuards(JwtAuthGuard)
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly storageService: StorageService,
  ) {}

  private getContext() {
    const store = RequestContext.getStore();
    if (!store || !store.tenantId) {
      throw new BadRequestException('Tenant context missing');
    }
    return { tenantId: store.tenantId, userId: store.userId || 'system' };
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body(new ZodValidationPipe(createBrandSchema))
    createBrandDto: CreateBrandDto,
    @UploadedFile() file?: any,
  ) {
    const { tenantId } = this.getContext();
    if (file) {
      createBrandDto.imageUrl = await this.storageService.uploadFile(
        file,
        'brands',
      );
    }
    return this.brandsService.create(createBrandDto, tenantId);
  }

  @Get()
  findAll(
    @Query(new ZodValidationPipe(brandQuerySchema)) query: BrandQueryDto,
  ) {
    const { tenantId } = this.getContext();
    return this.brandsService.findAll(query, tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    return this.brandsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBrandSchema))
    updateBrandDto: UpdateBrandDto,
    @UploadedFile() file?: any,
  ) {
    const { tenantId } = this.getContext();
    if (file) {
      updateBrandDto.imageUrl = await this.storageService.uploadFile(
        file,
        'brands',
      );
    }
    return this.brandsService.update(id, updateBrandDto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    await this.brandsService.remove(id, tenantId);
  }
}
