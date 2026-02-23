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
import { CategoriesService } from './categories.service';
import { createCategorySchema } from './dto/create-category.dto';
import type { CreateCategoryDto } from './dto/create-category.dto';
import { updateCategorySchema } from './dto/update-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import { categoryQuerySchema } from './dto/category-query.dto';
import type { CategoryQueryDto } from './dto/category-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../products/pipes/zod-validation.pipe';
import { RequestContext } from '../common/request-context';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  private getContext() {
    const store = RequestContext.getStore();
    if (!store || !store.tenantId) {
      throw new BadRequestException('Tenant context missing');
    }
    return { tenantId: store.tenantId, userId: store.userId || 'system' };
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createCategorySchema))
    createCategoryDto: CreateCategoryDto,
  ) {
    const { tenantId } = this.getContext();
    return this.categoriesService.create(createCategoryDto, tenantId);
  }

  @Get()
  findAll(
    @Query(new ZodValidationPipe(categoryQuerySchema)) query: CategoryQueryDto,
  ) {
    const { tenantId } = this.getContext();
    return this.categoriesService.findAll(query, tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    return this.categoriesService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCategorySchema))
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const { tenantId } = this.getContext();
    return this.categoriesService.update(id, updateCategoryDto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    await this.categoriesService.remove(id, tenantId);
  }
}
