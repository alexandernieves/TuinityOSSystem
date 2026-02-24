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
import { CompositionsService } from './compositions.service';
import { createCompositionSchema } from './dto/create-composition.dto';
import type { CreateCompositionDto } from './dto/create-composition.dto';
import { updateCompositionSchema } from './dto/update-composition.dto';
import type { UpdateCompositionDto } from './dto/update-composition.dto';
import { compositionQuerySchema } from './dto/composition-query.dto';
import type { CompositionQueryDto } from './dto/composition-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestContext } from '../common/request-context';
import { ZodValidationPipe } from '../products/pipes/zod-validation.pipe';

@Controller('compositions')
@UseGuards(JwtAuthGuard)
export class CompositionsController {
  constructor(private readonly compositionsService: CompositionsService) {}

  private getContext() {
    const store = RequestContext.getStore();
    if (!store || !store.tenantId) {
      throw new BadRequestException('Tenant context missing');
    }
    return { tenantId: store.tenantId, userId: store.userId || 'system' };
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createCompositionSchema))
    createCompositionDto: CreateCompositionDto,
  ) {
    const { tenantId } = this.getContext();
    return this.compositionsService.create(createCompositionDto, tenantId);
  }

  @Get()
  findAll(
    @Query(new ZodValidationPipe(compositionQuerySchema))
    query: CompositionQueryDto,
  ) {
    const { tenantId } = this.getContext();
    return this.compositionsService.findAll(query, tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    return this.compositionsService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCompositionSchema))
    updateCompositionDto: UpdateCompositionDto,
  ) {
    const { tenantId } = this.getContext();
    return this.compositionsService.update(id, updateCompositionDto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    return this.compositionsService.remove(id, tenantId);
  }
}
