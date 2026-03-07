import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';

@Controller('warehouses')
export class WarehousesController {
    constructor(private readonly warehousesService: WarehousesService) { }

    @Get()
    findAll() {
        return this.warehousesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.warehousesService.findOne(id);
    }

    @Post()
    create(@Body() createWarehouseDto: any) {
        return this.warehousesService.create(createWarehouseDto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateWarehouseDto: any) {
        return this.warehousesService.update(id, updateWarehouseDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.warehousesService.remove(id);
    }
}
