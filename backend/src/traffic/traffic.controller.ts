import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  UsePipes,
  Query,
  BadRequestException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { TrafficService } from './traffic.service';
import { createShipmentSchema } from './dto/create-shipment.dto';
import type { CreateShipmentDto } from './dto/create-shipment.dto';
import { shipmentQuerySchema } from './dto/shipment-query.dto';
import type { ShipmentQueryDto } from './dto/shipment-query.dto';
import { updateTrafficDocsSchema } from './dto/update-shipment.dto';
import type { UpdateTrafficDocsDto } from './dto/update-shipment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../products/pipes/zod-validation.pipe';
import { RequestContext } from '../common/request-context';

@Controller('traffic')
@UseGuards(JwtAuthGuard)
export class TrafficController {
  constructor(private readonly trafficService: TrafficService) {}

  private getContext() {
    const store = RequestContext.getStore();
    if (!store || !store.tenantId) {
      throw new BadRequestException('Tenant context missing');
    }
    return { tenantId: store.tenantId, userId: store.userId || 'system' };
  }

  @Post('shipments')
  @UsePipes(new ZodValidationPipe(createShipmentSchema))
  create(@Body() createDto: CreateShipmentDto) {
    const { tenantId, userId } = this.getContext();
    return this.trafficService.create(createDto, tenantId, userId);
  }

  @Get('shipments')
  findAll(
    @Query(new ZodValidationPipe(shipmentQuerySchema)) query: ShipmentQueryDto,
  ) {
    const { tenantId } = this.getContext();
    return this.trafficService.findAll(query, tenantId);
  }

  @Get('shipments/stats')
  getStats() {
    const { tenantId } = this.getContext();
    return this.trafficService.getStats(tenantId);
  }

  @Get('shipments/:id')
  findOne(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    return this.trafficService.findOne(id, tenantId);
  }

  @Patch('shipments/:id/docs')
  @UsePipes(new ZodValidationPipe(updateTrafficDocsSchema))
  updateDocs(@Param('id') id: string, @Body() updateDto: UpdateTrafficDocsDto) {
    const { tenantId, userId } = this.getContext();
    return this.trafficService.updateDocs(id, updateDto, tenantId, userId);
  }

  @Post('shipments/:id/dispatch')
  dispatch(@Param('id') id: string) {
    const { tenantId, userId } = this.getContext();
    return this.trafficService.dispatch(id, tenantId, userId);
  }

  @Patch('shipments/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    const { tenantId, userId } = this.getContext();
    return this.trafficService.updateStatus(id, status, tenantId, userId);
  }

  @Post('shipments/:id/events')
  addEvent(@Param('id') id: string, @Body() dto: any) {
    const { tenantId, userId } = this.getContext();
    return this.trafficService.addEvent(id, dto, tenantId, userId);
  }

  @Get('shipments/:id/packing-list')
  getPackingList(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    return this.trafficService.getPackingList(id, tenantId);
  }

  @Get('shipments/:id/dmc')
  async getDmcPdf(@Param('id') id: string, @Res() res: Response) {
    const { tenantId } = this.getContext();
    const pdfBuffer = await this.trafficService.generateDmcPdf(id, tenantId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=DMC-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get('shipments/:id/bl')
  async getBlPdf(@Param('id') id: string, @Res() res: Response) {
    const { tenantId } = this.getContext();
    const pdfBuffer = await this.trafficService.generateBlPdf(id, tenantId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=BL-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get('shipments/:id/free-sale')
  async getFreeSalePdf(@Param('id') id: string, @Res() res: Response) {
    const { tenantId } = this.getContext();
    const pdfBuffer = await this.trafficService.generateFreeSalePdf(
      id,
      tenantId,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=FREE-SALE-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
