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
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { createSupplierSchema } from './dto/create-supplier.dto';
import type { CreateSupplierDto } from './dto/create-supplier.dto';
import { updateSupplierSchema } from './dto/update-supplier.dto';
import type { UpdateSupplierDto } from './dto/update-supplier.dto';
import { supplierQuerySchema } from './dto/supplier-query.dto';
import type { SupplierQueryDto } from './dto/supplier-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../products/pipes/zod-validation.pipe'; // Reuse pipe from products
import { PermissionKey } from '../auth/enums/permission-key.enum';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequestContext } from '../common/request-context';

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  private getContext() {
    const store = RequestContext.getStore();
    if (!store || !store.tenantId) {
      throw new BadRequestException('Tenant context missing');
    }
    return { tenantId: store.tenantId };
  }

  @Post()
  @RequirePermissions(PermissionKey.MANAGE_TENANT)
  create(
    @Body(new ZodValidationPipe(createSupplierSchema))
    createSupplierDto: CreateSupplierDto,
  ) {
    const { tenantId } = this.getContext();
    return this.suppliersService.create(createSupplierDto, tenantId);
  }

  @Get()
  findAll(
    @Query(new ZodValidationPipe(supplierQuerySchema))
    query: SupplierQueryDto,
  ) {
    const { tenantId } = this.getContext();
    return this.suppliersService.findAll(query, tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    return this.suppliersService.findOne(id, tenantId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.MANAGE_TENANT)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSupplierSchema))
    updateSupplierDto: UpdateSupplierDto,
  ) {
    const { tenantId } = this.getContext();
    return this.suppliersService.update(id, updateSupplierDto, tenantId);
  }

  @Delete(':id')
  @RequirePermissions(PermissionKey.MANAGE_TENANT)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    await this.suppliersService.remove(id, tenantId);
  }
}
