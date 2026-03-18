import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors, UploadedFile, Header, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientsService } from './clients.service';
import { AccountsReceivableService } from '../services/accounts-receivable/accounts-receivable.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
    constructor(
        private readonly clientsService: ClientsService,
        private readonly arService: AccountsReceivableService
    ) { }

    @Post()
    create(@Body() createClientDto: any) {
        return this.clientsService.create(createClientDto);
    }

    @Post('batch-import')
    @UseInterceptors(FileInterceptor('file'))
    async importClients(@UploadedFile() file: any) {
        if (!file) {
            return { success: false, message: 'No se recibió ningún archivo' };
        }
        return this.clientsService.importClients(file);
    }

    @Post('batch-import-json')
    async importClientsJson(@Body() body: { batch: any[] }) {
        return this.clientsService.importClientsJsonBatch(body.batch);
    }

    @Get('export/:format')
    @Header('Content-Type', 'application/octet-stream')
    async exportClients(@Param('format') format: string) {
        const buffer = await this.clientsService.exportClients(format as any);
        return new StreamableFile(buffer, {
            type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            disposition: `attachment; filename="clientes_${new Date().getTime()}.${format}"`
        });
    }

    @Get()
    findAll(@Query() query: any) {
        return this.clientsService.findAll(query);
    }

    @Get('cxc/summary')
    getArSummary() {
        return this.arService.getAccountsReceivableSummary();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.clientsService.findOne(id);
    }

    @Get(':id/balance')
    getBalance(@Param('id') id: string) {
        return this.arService.getCustomerBalance(id);
    }

    @Get(':id/transactions')
    getTransactions(@Param('id') id: string, @Query() query: any) {
        return this.arService.generateAccountsReceivableReport({ 
            customerId: id,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined
        });
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
