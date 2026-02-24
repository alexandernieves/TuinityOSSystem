import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { TariffsService } from './tariffs.service';
import {
  createTariffSchema,
  type CreateTariffDto,
} from './dto/create-tariff.dto';
import {
  updateTariffSchema,
  type UpdateTariffDto,
} from './dto/update-tariff.dto';
import { tariffQuerySchema, type TariffQueryDto } from './dto/tariff-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../products/pipes/zod-validation.pipe';
import { RequestContext } from '../common/request-context';

@Controller('tariffs')
@UseGuards(JwtAuthGuard)
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  private getTenantId() {
    const store = RequestContext.getStore();
    if (!store || !store.tenantId) {
      throw new BadRequestException('Tenant context missing');
    }
    return store.tenantId;
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createTariffSchema))
    createTariffDto: CreateTariffDto,
  ) {
    const tenantId = this.getTenantId();
    return this.tariffsService.create(createTariffDto, tenantId);
  }

  @Get()
  findAll(
    @Query(new ZodValidationPipe(tariffQuerySchema)) query: TariffQueryDto,
  ) {
    const tenantId = this.getTenantId();
    return this.tariffsService.findAll(query, tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const tenantId = this.getTenantId();
    return this.tariffsService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTariffSchema))
    updateTariffDto: UpdateTariffDto,
  ) {
    const tenantId = this.getTenantId();
    return this.tariffsService.update(id, updateTariffDto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    const tenantId = this.getTenantId();
    return this.tariffsService.remove(id, tenantId);
  }
}
