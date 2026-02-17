import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequestContext } from '../common/request-context';
import {
  createCustomerSchema,
  updateCustomerSchema,
  blockCustomerSchema,
  approveCustomerSchema,
  createCustomerTransactionSchema,
  voidTransactionSchema,
  createCustomerAreaSchema,
  updateCustomerAreaSchema,
  createCustomerSubAreaSchema,
  updateCustomerSubAreaSchema,
  createSalespersonSchema,
  updateSalespersonSchema,
} from './dto';
import type {
  CreateCustomerDto,
  UpdateCustomerDto,
  BlockCustomerDto,
  ApproveCustomerDto,
  CreateCustomerTransactionDto,
  VoidTransactionDto,
  CreateCustomerAreaDto,
  UpdateCustomerAreaDto,
  CreateCustomerSubAreaDto,
  UpdateCustomerSubAreaDto,
  CreateSalespersonDto,
  UpdateSalespersonDto,
} from './dto';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  // ==================== CUSTOMERS ====================

  @Post()
  async createCustomer(
    @Body(new ZodValidationPipe(createCustomerSchema)) dto: CreateCustomerDto,
  ) {
    const store = RequestContext.getStore();
    if (!store?.tenantId || !store?.userId) {
      throw new UnauthorizedException();
    }
    return this.customersService.createCustomer(dto, store.tenantId, store.userId);
  }

  @Get()
  async listCustomers(
    @Query('search') search?: string,
    @Query('customerType') customerType?: 'CASH' | 'CREDIT',
    @Query('priceLevel') priceLevel?: 'A' | 'B' | 'C' | 'D' | 'E',
    @Query('creditStatus') creditStatus?: string,
    @Query('isBlocked') isBlocked?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();

    return this.customersService.listCustomers(store.tenantId, {
      search,
      customerType,
      priceLevel,
      creditStatus,
      isBlocked: isBlocked === 'true',
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')
  async getCustomer(@Param('id') id: string) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.customersService.getCustomer(id, store.tenantId);
  }

  @Put(':id')
  async updateCustomer(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCustomerSchema)) dto: UpdateCustomerDto,
  ) {
    const store = RequestContext.getStore();
    if (!store?.tenantId || !store?.userId) {
      throw new UnauthorizedException();
    }
    return this.customersService.updateCustomer(id, dto, store.tenantId, store.userId);
  }

  @Delete(':id')
  async deleteCustomer(@Param('id') id: string) {
    const store = RequestContext.getStore();
    if (!store?.tenantId || !store?.userId) {
      throw new UnauthorizedException();
    }
    return this.customersService.deleteCustomer(id, store.tenantId, store.userId);
  }

  @Post(':id/block')
  async blockCustomer(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(blockCustomerSchema)) dto: BlockCustomerDto,
  ) {
    const store = RequestContext.getStore();
    if (!store?.tenantId || !store?.userId) {
      throw new UnauthorizedException();
    }
    return this.customersService.blockCustomer(id, dto, store.tenantId, store.userId);
  }

  @Post(':id/unblock')
  async unblockCustomer(@Param('id') id: string) {
    const store = RequestContext.getStore();
    if (!store?.tenantId || !store?.userId) {
      throw new UnauthorizedException();
    }
    return this.customersService.unblockCustomer(id, store.tenantId, store.userId);
  }

  @Post(':id/approve')
  async approveCustomer(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(approveCustomerSchema)) dto: ApproveCustomerDto,
  ) {
    const store = RequestContext.getStore();
    if (!store?.tenantId || !store?.userId) {
      throw new UnauthorizedException();
    }
    return this.customersService.approveCustomer(id, dto, store.tenantId, store.userId);
  }

  @Get(':id/statement')
  async getAccountStatement(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.customersService.getAccountStatement(id, store.tenantId, {
      startDate,
      endDate,
    });
  }

  // ==================== CUSTOMER TRANSACTIONS (CxC) ====================

  @Post('transactions')
  async createTransaction(
    @Body(new ZodValidationPipe(createCustomerTransactionSchema))
    dto: CreateCustomerTransactionDto,
  ) {
    const store = RequestContext.getStore();
    if (!store?.tenantId || !store?.userId) {
      throw new UnauthorizedException();
    }
    return this.customersService.createTransaction(dto, store.tenantId, store.userId);
  }

  @Get('transactions/list')
  async listTransactions(
    @Query('customerId') customerId?: string,
    @Query('branchId') branchId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();

    return this.customersService.listTransactions(store.tenantId, {
      customerId,
      branchId,
      type,
      startDate,
      endDate,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post('transactions/:id/void')
  async voidTransaction(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(voidTransactionSchema)) dto: VoidTransactionDto,
  ) {
    const store = RequestContext.getStore();
    if (!store?.tenantId || !store?.userId) {
      throw new UnauthorizedException();
    }
    return this.customersService.voidTransaction(id, dto, store.tenantId, store.userId);
  }

  // ==================== CUSTOMER AREAS ====================

  @Post('areas')
  async createArea(
    @Body(new ZodValidationPipe(createCustomerAreaSchema)) dto: CreateCustomerAreaDto,
  ) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.customersService.createArea(dto, store.tenantId);
  }

  @Get('areas')
  async listAreas() {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.customersService.listAreas(store.tenantId);
  }

  @Put('areas/:id')
  async updateArea(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCustomerAreaSchema)) dto: UpdateCustomerAreaDto,
  ) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.customersService.updateArea(id, dto, store.tenantId);
  }

  @Delete('areas/:id')
  async deleteArea(@Param('id') id: string) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.customersService.deleteArea(id, store.tenantId);
  }

  // ==================== CUSTOMER SUB-AREAS ====================

  @Post('sub-areas')
  async createSubArea(
    @Body(new ZodValidationPipe(createCustomerSubAreaSchema))
    dto: CreateCustomerSubAreaDto,
  ) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.customersService.createSubArea(dto, store.tenantId);
  }

  @Get('sub-areas')
  async listSubAreas(@Query('areaId') areaId?: string) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.customersService.listSubAreas(store.tenantId, areaId);
  }

  @Put('sub-areas/:id')
  async updateSubArea(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCustomerSubAreaSchema))
    dto: UpdateCustomerSubAreaDto,
  ) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.customersService.updateSubArea(id, dto, store.tenantId);
  }

  @Delete('sub-areas/:id')
  async deleteSubArea(@Param('id') id: string) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.customersService.deleteSubArea(id, store.tenantId);
  }

  // ==================== SALESPEOPLE ====================

  @Post('salespeople')
  async createSalesperson(
    @Body(new ZodValidationPipe(createSalespersonSchema)) dto: CreateSalespersonDto,
  ) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.customersService.createSalesperson(dto, store.tenantId);
  }

  @Get('salespeople')
  async listSalespeople(
    @Query('areaId') areaId?: string,
    @Query('subAreaId') subAreaId?: string,
  ) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.customersService.listSalespeople(store.tenantId, { areaId, subAreaId });
  }

  @Put('salespeople/:id')
  async updateSalesperson(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSalespersonSchema)) dto: UpdateSalespersonDto,
  ) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.customersService.updateSalesperson(id, dto, store.tenantId);
  }

  @Delete('salespeople/:id')
  async deleteSalesperson(@Param('id') id: string) {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.customersService.deleteSalesperson(id, store.tenantId);
  }

  // ==================== REPORTS ====================

  @Get('reports/aging')
  async getAgingReport() {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.customersService.getAgingReport(store.tenantId);
  }
  @Get('reports/segmentation')
  async getSegmentationReport() {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new UnauthorizedException();
    return this.customersService.getSegmentationStats(store.tenantId);
  }
}
