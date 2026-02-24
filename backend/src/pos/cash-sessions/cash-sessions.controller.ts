import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { CashSessionsService } from './cash-sessions.service';
import { openSessionSchema } from './dto/open-session.dto';
import type { OpenSessionDto } from './dto/open-session.dto';
import { closeSessionSchema } from './dto/close-session.dto';
import type { CloseSessionDto } from './dto/close-session.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RequestContext } from '../../common/request-context';
import { PermissionKey } from '../../auth/enums/permission-key.enum';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';

@Controller('pos/cash-sessions')
export class CashSessionsController {
  constructor(private readonly service: CashSessionsService) {}

  private getContext() {
    const store = RequestContext.getStore();
    if (!store) throw new Error('No context found');
    return store;
  }

  @Get('active')
  @RequirePermissions(PermissionKey.MANAGE_POS)
  getActive() {
    const { userId, tenantId } = this.getContext();
    return this.service.getActiveSession(userId!, tenantId!);
  }

  @Post('open')
  @RequirePermissions(PermissionKey.MANAGE_POS)
  @UsePipes(new ZodValidationPipe(openSessionSchema))
  open(@Body() dto: OpenSessionDto) {
    const { userId, tenantId } = this.getContext();
    return this.service.openSession(dto, userId!, tenantId!);
  }

  @Patch(':id/close')
  @RequirePermissions(PermissionKey.MANAGE_POS)
  @UsePipes(new ZodValidationPipe(closeSessionSchema))
  close(@Param('id') id: string, @Body() dto: CloseSessionDto) {
    const { userId, tenantId } = this.getContext();
    return this.service.closeSession(id, dto, userId!, tenantId!);
  }

  @Get(':id/report')
  @RequirePermissions(PermissionKey.MANAGE_POS)
  getReport(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    return this.service.getSessionReport(id, tenantId!);
  }
}
