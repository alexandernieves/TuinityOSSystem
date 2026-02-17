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
} from '@nestjs/common';
import { BrandsService } from './brands.service';
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
  constructor(private readonly brandsService: BrandsService) {}

  private getContext() {
    const store = RequestContext.getStore();
    if (!store || !store.tenantId) {
      throw new BadRequestException('Tenant context missing');
    }
    return { tenantId: store.tenantId, userId: store.userId || 'system' };
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createBrandSchema))
  create(@Body() createBrandDto: CreateBrandDto) {
    const { tenantId } = this.getContext();
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
  @UsePipes(new ZodValidationPipe(updateBrandSchema))
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    const { tenantId } = this.getContext();
    return this.brandsService.update(id, updateBrandDto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    await this.brandsService.remove(id, tenantId);
  }
}
