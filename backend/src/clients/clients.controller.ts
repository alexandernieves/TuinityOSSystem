import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @Post()
    create(@Body() createClientDto: any) {
        return this.clientsService.create(createClientDto);
    }

    @Get()
    findAll(@Query() query: any) {
        return this.clientsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.clientsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateClientDto: any) {
        return this.clientsService.update(id, updateClientDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.clientsService.remove(id);
    }
}
