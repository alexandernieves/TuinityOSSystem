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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductsService } from './products.service';
import { createProductSchema } from './dto/create-product.dto';
import type { CreateProductDto } from './dto/create-product.dto';
import { updateProductSchema } from './dto/update-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import { productQuerySchema } from './dto/product-query.dto';
import type { ProductQueryDto } from './dto/product-query.dto';
import { bulkUpdatePricesSchema } from './dto/bulk-update-prices.dto';
import type { BulkUpdatePricesDto } from './dto/bulk-update-prices.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from './pipes/zod-validation.pipe';
import { PermissionKey } from '../auth/enums/permission-key.enum';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequestContext } from '../common/request-context';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  private getContext() {
    const store = RequestContext.getStore();
    if (!store || !store.tenantId) {
      throw new BadRequestException('Tenant context missing');
    }
    return { tenantId: store.tenantId, userId: store.userId || 'system' };
  }

  @Post()
  @RequirePermissions(PermissionKey.EDIT_PRODUCTS)
  @UsePipes(new ZodValidationPipe(createProductSchema))
  create(@Body() createProductDto: CreateProductDto) {
    const { tenantId, userId } = this.getContext();
    return this.productsService.create(createProductDto, tenantId, userId);
  }

  @Get()
  findAll(
    @Query(new ZodValidationPipe(productQuerySchema)) query: ProductQueryDto,
  ) {
    const { tenantId } = this.getContext();
    return this.productsService.findAll(query, tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    return this.productsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.EDIT_PRODUCTS)
  @UsePipes(new ZodValidationPipe(updateProductSchema))
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    const { tenantId, userId } = this.getContext();
    return this.productsService.update(id, updateProductDto, tenantId, userId);
  }

  @Delete(':id')
  @RequirePermissions(PermissionKey.DELETE_PRODUCTS)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    const { tenantId, userId } = this.getContext();
    await this.productsService.remove(id, tenantId, userId);
  }

  @Post('bulk/prices')
  @RequirePermissions(PermissionKey.BULK_EDIT_PRICES)
  @UsePipes(new ZodValidationPipe(bulkUpdatePricesSchema))
  bulkUpdatePrices(@Body() dto: BulkUpdatePricesDto) {
    const { tenantId, userId } = this.getContext();
    return this.productsService.bulkUpdatePrices(dto.updates, tenantId, userId);
  }

  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/products/images',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
    }),
  )
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const { tenantId, userId } = this.getContext();
    const imageUrl = `/uploads/products/images/${file.filename}`;
    return this.productsService.updateImage(id, imageUrl, tenantId, userId);
  }

  @Post('bulk/import')
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const { tenantId, userId } = this.getContext();
    return this.productsService.bulkImport(file.buffer, tenantId, userId);
  }
}
