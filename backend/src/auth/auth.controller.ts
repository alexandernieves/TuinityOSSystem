import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { z } from 'zod';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDtoSchema } from './dto/login.dto';
import { RegisterTenantDtoSchema } from './dto/register-tenant.dto';
import { RefreshDtoSchema } from './dto/refresh.dto';
import { LogoutDtoSchema } from './dto/logout.dto';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';

type RequestWithUser = Request & {
  user?: {
    sub: string;
    tenantId: string;
  };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @Post('register-tenant')
  async registerTenant(@Body() body: unknown) {
    const dto = RegisterTenantDtoSchema.parse(body);
    return this.authService.registerTenant(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @Post('login')
  async login(@Body() body: unknown) {
    const dto = LoginDtoSchema.parse(body);
    return this.authService.login(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 refreshes per minute
  @Post('refresh')
  async refresh(@Body() body: unknown) {
    const dto = RefreshDtoSchema.parse(body);
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  async logout(@Body() body: unknown) {
    const dto = LogoutDtoSchema.parse(body);
    return this.authService.logout(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: RequestWithUser) {
    return {
      userId: req.user?.sub,
      tenantId: req.user?.tenantId,
    };
  }
}
