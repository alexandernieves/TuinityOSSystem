
import { Controller, Get, Query, Patch, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestContext } from '../common/request-context';

@Controller('intelligence')
@UseGuards(JwtAuthGuard)
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) { }

  private getContext() {
    const store = RequestContext.getStore();
    if (!store || !store.tenantId) {
      throw new BadRequestException('Tenant context missing');
    }
    return { tenantId: store.tenantId, userId: store.userId || 'system' };
  }

  @Get('replenishment')
  getReplenishment() {
    const { tenantId } = this.getContext();
    return this.intelligenceService.getReplenishmentSuggestions(tenantId);
  }

  @Get('dead-stock')
  getDeadStock() {
    const { tenantId } = this.getContext();
    return this.intelligenceService.getDeadStock(tenantId);
  }

  @Get('forecasting')
  getForecasting() {
    const { tenantId } = this.getContext();
    return this.intelligenceService.getForecasting(tenantId);
  }

  @Get('prices')
  getPrices() {
    const { tenantId } = this.getContext();
    return this.intelligenceService.getPriceOptimizationSuggestions(tenantId);
  }

  @Patch('settings')
  updateSettings(@Body() dto: any) {
    const { tenantId } = this.getContext();
    return this.intelligenceService.updateSettings(tenantId, dto);
  }

  @Post('apply-price')
  applyPrice(@Body() dto: { productId: string, prices: any }) {
    const { tenantId } = this.getContext();
    return this.intelligenceService.applyPriceSuggestion(tenantId, dto.productId, dto.prices);
  }

  @Get('query')
  query(@Query('q') q: string) {
    const { tenantId } = this.getContext();
    return this.intelligenceService.processQuery(tenantId, q);
  }
}
