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
import { OriginsService } from './origins.service';
import {
  createOriginSchema,
  type CreateOriginDto,
} from './dto/create-origin.dto';
import {
  updateOriginSchema,
  type UpdateOriginDto,
} from './dto/update-origin.dto';
import { originQuerySchema, type OriginQueryDto } from './dto/origin-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../products/pipes/zod-validation.pipe';
import { RequestContext } from '../common/request-context';

@Controller('origins')
@UseGuards(JwtAuthGuard)
export class OriginsController {
  constructor(private readonly originsService: OriginsService) {}

  private getTenantId() {
    const store = RequestContext.getStore();
    if (!store || !store.tenantId) {
      throw new BadRequestException('Tenant context missing');
    }
    return store.tenantId;
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createOriginSchema))
    createOriginDto: CreateOriginDto,
  ) {
    const tenantId = this.getTenantId();
    return this.originsService.create(createOriginDto, tenantId);
  }

  @Get()
  findAll(
    @Query(new ZodValidationPipe(originQuerySchema)) query: OriginQueryDto,
  ) {
    const tenantId = this.getTenantId();
    return this.originsService.findAll(query, tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const tenantId = this.getTenantId();
    return this.originsService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOriginSchema))
    updateOriginDto: UpdateOriginDto,
  ) {
    const tenantId = this.getTenantId();
    return this.originsService.update(id, updateOriginDto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    const tenantId = this.getTenantId();
    return this.originsService.remove(id, tenantId);
  }
}
