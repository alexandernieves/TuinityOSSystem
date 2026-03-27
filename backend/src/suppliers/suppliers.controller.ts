import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountsPayableService } from '../services/accounts-payable/accounts-payable.service';

@UseGuards(JwtAuthGuard)
@Controller('suppliers')
export class SuppliersController {
    constructor(
        private readonly suppliersService: SuppliersService,
        private readonly apService: AccountsPayableService
    ) { }

    @Post('batch-import-json')
    async importSuppliersBatch(@Body() body: { batch: any[] }) {
        console.log(`[SuppliersController] Received batch import with ${body?.batch?.length} items`);
        return this.suppliersService.importSuppliersBatch(body.batch);
    }

    @Get('cxp/summary')
    getSummary(@Query('asOf') asOf: string) {
        let date: Date | undefined = undefined;
        if (asOf) {
            const parsed = new Date(asOf);
            if (!isNaN(parsed.getTime())) {
                date = parsed;
            }
        }
        return this.apService.getAccountsPayableSummary(date);
    }

    @Get()
    findAll() {
        return this.suppliersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.suppliersService.findOne(id);
    }

    @Get(':id/balance')
    getBalance(@Param('id') id: string, @Query('asOf') asOf: string) {
        return this.apService.getSupplierBalance(id, asOf ? new Date(asOf) : undefined);
    }

    @Get(':id/cxp-ledger')
    getLedger(@Param('id') id: string, @Query() query: any) {
        return this.apService.generateAccountsPayableReport({
            supplierId: id,
            startDate: query.start ? new Date(query.start) : undefined,
            endDate: query.end ? new Date(query.end) : undefined,
        });
    }

    @Get('cxp/comparison/:poId')
    getComparison(@Param('poId') poId: string) {
        return this.apService.getPurchaseOrderComparison(poId);
    }

    @Post()
    create(@Body() createSupplierDto: any) {
        return this.suppliersService.create(createSupplierDto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateSupplierDto: any) {
        return this.suppliersService.update(id, updateSupplierDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.suppliersService.remove(id);
    }
}
