import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PermissionKey } from '../auth/enums/permission-key.enum';
import { ZodValidationPipe } from '../products/pipes/zod-validation.pipe';
import { RequestContext } from '../common/request-context';

import { createWarehouseSchema } from './dto/create-warehouse.dto';
import { updateWarehouseSchema } from './dto/update-warehouse.dto';
import { createLocationSchema } from './dto/create-location.dto';
import { updateLocationSchema } from './dto/update-location.dto';
import { locationQuerySchema } from './dto/location-query.dto';

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  private get tenantId() {
    const store = RequestContext.getStore();
    if (!store?.tenantId)
      throw new BadRequestException('Tenant context missing');
    return store.tenantId;
  }

  // ── WAREHOUSES ────────────────────────────────────────────────────────────

  @Post('warehouses')
  @RequirePermissions(PermissionKey.MANAGE_TENANT)
  createWarehouse(
    @Body(new ZodValidationPipe(createWarehouseSchema)) dto: any,
  ) {
    return this.locationsService.createWarehouse(dto, this.tenantId);
  }

  @Get('warehouses')
  findAllWarehouses() {
    return this.locationsService.findAllWarehouses(this.tenantId);
  }

  @Get('warehouses/:id')
  findOneWarehouse(@Param('id') id: string) {
    return this.locationsService.findOneWarehouse(id, this.tenantId);
  }

  @Patch('warehouses/:id')
  @RequirePermissions(PermissionKey.MANAGE_TENANT)
  updateWarehouse(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateWarehouseSchema)) dto: any,
  ) {
    return this.locationsService.updateWarehouse(id, dto, this.tenantId);
  }

  @Delete('warehouses/:id')
  @RequirePermissions(PermissionKey.MANAGE_TENANT)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeWarehouse(@Param('id') id: string) {
    await this.locationsService.removeWarehouse(id, this.tenantId);
  }

  // ── LOCATIONS ─────────────────────────────────────────────────────────────

  @Post()
  @RequirePermissions(PermissionKey.MANAGE_TENANT)
  createLocation(@Body(new ZodValidationPipe(createLocationSchema)) dto: any) {
    return this.locationsService.createLocation(dto, this.tenantId);
  }

  @Get()
  findAllLocations(
    @Query(new ZodValidationPipe(locationQuerySchema)) query: any,
  ) {
    return this.locationsService.findAllLocations(query, this.tenantId);
  }

  @Get(':id')
  findOneLocation(@Param('id') id: string) {
    return this.locationsService.findOneLocation(id, this.tenantId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.MANAGE_TENANT)
  updateLocation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLocationSchema)) dto: any,
  ) {
    return this.locationsService.updateLocation(id, dto, this.tenantId);
  }

  @Delete(':id')
  @RequirePermissions(PermissionKey.MANAGE_TENANT)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeLocation(@Param('id') id: string) {
    await this.locationsService.removeLocation(id, this.tenantId);
  }
}
