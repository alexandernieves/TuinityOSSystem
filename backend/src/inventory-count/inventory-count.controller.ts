import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { InventoryCountService } from './inventory-count.service';
import { RequestContext } from '../common/request-context';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inventory-counts')
@UseGuards(JwtAuthGuard)
export class InventoryCountController {
  constructor(private readonly inventoryCountService: InventoryCountService) {}

  @Post()
  create(@Body() createDto: { branchId: string; description: string }) {
    const store = RequestContext.getStore();
    if (!store?.tenantId || !store?.userId) throw new UnauthorizedException();
    return this.inventoryCountService.create(
      store.tenantId,
      createDto.branchId,
      createDto.description,
      store.userId,
    );
  }

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.inventoryCountService.findAll(store.tenantId, branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.inventoryCountService.findOne(id, store.tenantId);
  }

  @Post(':id/items')
  addItem(
    @Param('id') id: string,
    @Body()
    itemDto: { productId: string; quantity: number; mode?: 'SCAN' | 'SET' },
  ) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.inventoryCountService.addItem(
      id,
      store.tenantId,
      itemDto.productId,
      itemDto.quantity,
      itemDto.mode || 'SCAN',
    );
  }

  @Post(':id/finalize')
  finalize(@Param('id') id: string) {
    const store = RequestContext.getStore();
    if (!store?.tenantId || !store?.userId) throw new UnauthorizedException();
    return this.inventoryCountService.finalize(
      id,
      store.tenantId,
      store.userId,
    );
  }
}
