import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Post,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import type { Request } from 'express';

type RequestWithUser = Request & {
  user?: {
    sub: string;
    tenantId: string;
  };
};

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private async assertOwner(req: RequestWithUser) {
    const userId = req.user?.sub;
    const tenantId = req.user?.tenantId;
    if (!userId || !tenantId) {
      throw new ForbiddenException('Acceso denegado');
    }

    const me = await this.usersService.findByIdAndTenant(userId, tenantId);
    if (!me || me.role !== 'OWNER') {
      throw new ForbiddenException('Solo el OWNER puede gestionar usuarios');
    }
  }

  // Super-admin global: en este sistema, cualquier usuario con rol OWNER
  // se considera administrador global, sin necesidad de variables de entorno.
  private async assertGlobalAdmin(req: RequestWithUser) {
    // Reutilizamos la misma validación de OWNER; cualquier OWNER puede
    // acceder a vistas globales (todos los tenants, todos los usuarios).
    await this.assertOwner(req);
  }

  @Get()
  async getAllUsers(@Req() req: RequestWithUser) {
    await this.assertOwner(req);
    const tenantId = req.user?.tenantId;
    return this.usersService.findAllByTenant(tenantId!);
  }

  @Post()
  async createUser(
    @Req() req: RequestWithUser,
    @Body()
    body: { email: string; name: string; password?: string; role: string },
  ) {
    await this.assertOwner(req);
    const tenantId = req.user?.tenantId;

    const bcrypt = require('bcryptjs');
    const password = body.password || 'Evolution2026'; // Default password if not provided
    const passwordHash = await bcrypt.hash(password, 12);

    return this.usersService.createUser(tenantId!, {
      email: body.email,
      name: body.name,
      passwordHash,
      role: body.role as any,
    });
  }

  // SUPER-ADMIN: obtener todos los usuarios de todos los tenants
  @Get('admin/all')
  async getAllUsersAllTenants(@Req() req: RequestWithUser) {
    await this.assertGlobalAdmin(req);
    return this.usersService.findAllUsersAllTenants();
  }

  // SUPER-ADMIN: obtener todas las empresas (tenants) con estadísticas básicas
  @Get('admin/tenants')
  async getAllTenants(@Req() req: RequestWithUser) {
    await this.assertGlobalAdmin(req);
    return this.usersService.findAllTenantsWithStats();
  }

  @Patch(':id/role')
  async updateUserRole(
    @Req() req: RequestWithUser,
    @Param('id') userId: string,
    @Body()
    body: {
      role:
        | 'CLIENT'
        | 'MEMBER'
        | 'ADMIN'
        | 'OWNER'
        | 'SALES'
        | 'WAREHOUSE'
        | 'TRAFFIC';
    },
  ) {
    await this.assertOwner(req);
    const tenantId = req.user?.tenantId;
    return this.usersService.updateUserRole(userId, tenantId!, body.role);
  }

  @Delete(':id')
  async deleteUser(@Req() req: RequestWithUser, @Param('id') userId: string) {
    await this.assertOwner(req);
    const tenantId = req.user?.tenantId;
    return this.usersService.deleteUser(userId, tenantId!);
  }
}
