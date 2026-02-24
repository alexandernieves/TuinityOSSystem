import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Patch,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { z } from 'zod';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDtoSchema } from './dto/login.dto';
import { RegisterTenantDtoSchema } from './dto/register-tenant.dto';
import { RegisterClientDtoSchema } from './dto/register-client.dto';
import { RefreshDtoSchema } from './dto/refresh.dto';
import { LogoutDtoSchema } from './dto/logout.dto';
import { UsersService } from '../users/users.service';
import type { Request } from 'express';
import { Public } from './decorators/public.decorator';
import { UseGuards } from '@nestjs/common';

type RequestWithUser = Request & {
  user?: {
    sub: string;
    tenantId: string;
  };
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) { }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @Post('register-tenant')
  async registerTenant(@Body() body: unknown) {
    const dto = RegisterTenantDtoSchema.parse(body);
    return this.authService.registerTenant(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register-client')
  async registerClient(@Body() body: unknown) {
    const dto = RegisterClientDtoSchema.parse(body);
    return this.authService.registerClient(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @Post('login')
  async login(@Body() body: unknown) {
    const dto = LoginDtoSchema.parse(body);
    return this.authService.login(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 refreshes per minute
  @Post('refresh')
  async refresh(@Body() body: unknown) {
    const dto = RefreshDtoSchema.parse(body);
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  async logout(@Body() body: unknown) {
    const dto = LogoutDtoSchema.parse(body);
    return this.authService.logout(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: RequestWithUser) {
    const userId = req.user?.sub;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      return {
        userId,
        tenantId,
      };
    }

    const user = await this.usersService.findByIdAndTenant(userId, tenantId);

    return {
      userId,
      tenantId,
      email: user?.email,
      name: user?.name,
      role: user?.role,
      avatarUrl: user?.avatarUrl,
      description: user?.description,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account')
  async deleteAccount(@Req() req: RequestWithUser) {
    const userId = req.user?.sub;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      throw new ForbiddenException('Acceso denegado');
    }

    return this.authService.deleteTenantAccount(userId, tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @Req() req: RequestWithUser,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const userId = req.user?.sub;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      throw new ForbiddenException('Acceso denegado');
    }

    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException('Faltan campos requeridos');
    }

    if (body.newPassword.length < 6) {
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
    }

    return this.authService.changePassword(userId, body.currentPassword, body.newPassword);
  }
}
