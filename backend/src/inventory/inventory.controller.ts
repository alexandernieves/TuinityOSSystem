import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  UsePipes,
  BadRequestException,
  Res,
  Patch,
} from '@nestjs/common';
import type { Response } from 'express';
import { InventoryService } from './inventory.service';
import { createMovementSchema } from './dto/create-movement.dto';
import type { CreateMovementDto } from './dto/create-movement.dto';
import { transferInventorySchema } from './dto/transfer-inventory.dto';
import type { TransferInventoryDto } from './dto/transfer-inventory.dto';
import { bulkTransferSchema } from './dto/bulk-transfer.dto';
import type { BulkTransferDto } from './dto/bulk-transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ZodValidationPipe } from '../products/pipes/zod-validation.pipe';
import { RequestContext } from '../common/request-context';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PermissionKey } from '../auth/enums/permission-key.enum';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  private getContext() {
    const store = RequestContext.getStore();
    if (!store || !store.tenantId) {
      throw new BadRequestException('Tenant context missing');
    }
    return { tenantId: store.tenantId, userId: store.userId || 'system' };
  }

  @Post('movements')
  @RequirePermissions(PermissionKey.ADJUST_INVENTORY)
  @UsePipes(new ZodValidationPipe(createMovementSchema))
  createMovement(@Body() createMovementDto: CreateMovementDto) {
    const { tenantId, userId } = this.getContext();
    return this.inventoryService.createMovement(
      createMovementDto,
      tenantId,
      userId,
    );
  }

  @Get('branch/:branchId')
  @RequirePermissions(PermissionKey.VIEW_INVENTORY)
  getInventoryByBranch(@Param('branchId') branchId: string) {
    const { tenantId } = this.getContext();
    return this.inventoryService.getInventoryByBranch(branchId, tenantId);
  }

  @Get('movements/:productId')
  @RequirePermissions(PermissionKey.VIEW_INVENTORY)
  getMovementsByProduct(
    @Param('productId') productId: string,
    @Query('branchId') branchId?: string,
  ) {
    const { tenantId } = this.getContext();
    return this.inventoryService.getMovementsByProduct(
      productId,
      branchId,
      tenantId,
    );
  }

  @Get()
  @RequirePermissions(PermissionKey.VIEW_INVENTORY)
  getGlobalInventory() {
    const { tenantId } = this.getContext();
    return this.inventoryService.findGlobalInventory(tenantId);
  }

  @Get('low-stock')
  @RequirePermissions(PermissionKey.VIEW_INVENTORY)
  getLowStockProducts() {
    const { tenantId } = this.getContext();
    return this.inventoryService.getLowStockProducts(tenantId);
  }

  @Get('stagnant')
  @RequirePermissions(PermissionKey.VIEW_INVENTORY)
  getStagnantProducts(@Query('days') days?: string) {
    const { tenantId } = this.getContext();
    const daysNum = days ? parseInt(days) : 120;
    return this.inventoryService.getStagnantProducts(tenantId, daysNum);
  }

  @Get('valuation')
  @RequirePermissions(PermissionKey.VIEW_COSTS)
  getValuationReport() {
    const { tenantId } = this.getContext();
    return this.inventoryService.getValuationReport(tenantId);
  }

  @Post('transfers')
  @RequirePermissions(PermissionKey.ADJUST_INVENTORY)
  @UsePipes(new ZodValidationPipe(transferInventorySchema))
  async transferInventory(@Body() dto: TransferInventoryDto) {
    const { tenantId, userId } = this.getContext();
    return this.inventoryService.transferInventory(dto, tenantId, userId);
  }

  @Post('transfers/bulk')
  @RequirePermissions(PermissionKey.ADJUST_INVENTORY)
  @UsePipes(new ZodValidationPipe(bulkTransferSchema))
  async transferBulk(@Body() dto: BulkTransferDto) {
    const { tenantId, userId } = this.getContext();
    return this.inventoryService.transferBulk(dto, tenantId, userId);
  }

  @Get('counts/active')
  @RequirePermissions(PermissionKey.VIEW_INVENTORY)
  async getActiveCount(@Query('branchId') branchId: string) {
    const { tenantId } = this.getContext();
    return this.inventoryService.getActiveCountSession(tenantId, branchId);
  }

  @Post('counts')
  @RequirePermissions(PermissionKey.ADJUST_INVENTORY)
  async createCount(@Body() body: { branchId: string; description?: string }) {
    const { tenantId, userId } = this.getContext();
    return this.inventoryService.createCountSession(tenantId, body.branchId, userId, body.description);
  }

  @Post('counts/:id/items')
  @RequirePermissions(PermissionKey.ADJUST_INVENTORY)
  async addCountItem(
    @Param('id') id: string,
    @Body() body: { productId: string; quantity: number }
  ) {
    const { tenantId } = this.getContext();
    return this.inventoryService.addCountItem(id, body.productId, body.quantity, tenantId);
  }

  @Patch('counts/:id/complete')
  @RequirePermissions(PermissionKey.ADJUST_INVENTORY)
  async completeCount(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    return this.inventoryService.completeCountSession(id, tenantId);
  }

  @Get('branch/:branchId/export')
  @RequirePermissions(PermissionKey.VIEW_INVENTORY)
  async exportExcel(@Param('branchId') branchId: string, @Res() res: Response) {
    const { tenantId } = this.getContext();
    const buffer = await this.inventoryService.exportExcel(branchId, tenantId);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=inventario-${branchId}.xlsx`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Post('recalculate')
  @RequirePermissions(PermissionKey.ADJUST_INVENTORY)
  async recalculate() {
    const { tenantId } = this.getContext();
    return this.inventoryService.recalculateInventory(tenantId);
  }
}
