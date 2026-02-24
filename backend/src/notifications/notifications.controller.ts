import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestContext } from '../common/request-context';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private getContext() {
    const store = RequestContext.getStore();
    if (!store || !store.tenantId) {
      throw new BadRequestException('Tenant context missing');
    }
    return { tenantId: store.tenantId, userId: store.userId || 'system' };
  }

  @Post('subscribe')
  subscribe(@Body() sub: any) {
    const { tenantId, userId } = this.getContext();
    return this.notificationsService.saveSubscription(tenantId, userId, sub);
  }

  @Get()
  findAll() {
    const { tenantId, userId } = this.getContext();
    return this.notificationsService.findAll(tenantId, userId);
  }

  @Get('unread-count')
  getUnreadCount() {
    const { tenantId, userId } = this.getContext();
    return this.notificationsService.getUnreadCount(tenantId, userId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    return this.notificationsService.markAsRead(tenantId, id);
  }

  @Post('read-all')
  markAllAsRead() {
    const { tenantId, userId } = this.getContext();
    return this.notificationsService.markAllAsRead(tenantId, userId);
  }
}
