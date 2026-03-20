import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  Post,
  Body,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getMyNotifications(@Request() req: any, @Query() query: any) {
    const userId = req.user?.sub;
    const role = (req.user?.roles?.[0] || 'USER').toUpperCase();
    return this.notificationsService.getMyNotifications(userId, role, query);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user?.sub;
    const role = (req.user?.roles?.[0] || 'USER').toUpperCase();
    return { count: await this.notificationsService.getUnreadCount(userId, role) };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub;
    return this.notificationsService.markAsRead(id, userId);
  }

  @Post('read-all')
  async markAllAsRead(@Request() req: any) {
    const userId = req.user?.sub;
    const role = (req.user?.roles?.[0] || 'USER').toUpperCase();
    return this.notificationsService.markAllAsRead(userId, role);
  }

  // Admin route to test notifications (optional)
  @Post('test-notify')
  async testNotify(@Body() data: any, @Request() req: any) {
    const senderId = req.user?.sub;
    if (data.userId) {
      return this.notificationsService.notifyUser(data.userId, {
        ...data,
        severity: data.severity || 'INFO',
      });
    } else if (data.role) {
      return this.notificationsService.notifyRole(data.role, {
        ...data,
        severity: data.severity || 'INFO',
      });
    } else {
      return this.notificationsService.notifyGlobal({
        ...data,
        severity: data.severity || 'INFO',
      });
    }
  }
}
