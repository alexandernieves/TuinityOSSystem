import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
    constructor(private readonly stockService: StockService) { }

    @Get()
    findAll() {
        return this.stockService.findAll();
    }

    @Get('items')
    getInventoryItems() {
        return this.stockService.getInventoryItems();
    }

    @Get('product/:productId')
    findByProduct(@Param('productId') productId: string) {
        return this.stockService.findByProduct(productId);
    }

    @Get('product/:productId/aggregate')
    getProductStockAggregate(@Param('productId') productId: string) {
        return this.stockService.getProductStockAggregate(productId);
    }

    @Get('warehouse/:warehouseId')
    findByWarehouse(@Param('warehouseId') warehouseId: string) {
        return this.stockService.findByWarehouse(warehouseId);
    }

    @Post('update')
    updateStock(@Body() body: { productId: string; warehouseId: string; updateDto: any }) {
        return this.stockService.updateStock(body.productId, body.warehouseId, body.updateDto);
    }
}
