import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UseFilters } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.notificationsService.setGateway(this);
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers['authorization']?.split(' ')[1];
      if (!token) {
        this.logger.warn(`Client disconnected: No token provided (${client.id})`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;

      // Join user-specific room
      client.join(`user_${payload.sub}`);

      // Join role rooms if available
      if (payload.roles && Array.isArray(payload.roles)) {
        payload.roles.forEach((role: string) => {
          client.join(`role_${role.toUpperCase()}`);
        });
      }

      // Join global room
      client.join('global');

      this.logger.log(`Client connected: ${payload.email} (id: ${payload.sub}, socket: ${client.id})`);
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.logger.log(`Client disconnected: ${client.data.user.email} (socket: ${client.id})`);
    } else {
      this.logger.log(`Client disconnected: anonymous (socket: ${client.id})`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: new Date().toISOString() };
  }

  // --- Methods used by NotificationsService ---

  emitToUser(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('notification', notification);
  }

  emitToRole(roleTarget: string, notification: any) {
    this.server.to(`role_${roleTarget.toUpperCase()}`).emit('notification', notification);
  }

  emitGlobal(notification: any) {
    this.server.to('global').emit('notification', notification);
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
