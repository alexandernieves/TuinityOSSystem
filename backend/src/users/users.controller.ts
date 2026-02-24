import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
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
    constructor(private readonly usersService: UsersService) { }

    @Get()
    async getAllUsers(@Req() req: RequestWithUser) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            throw new Error('Missing tenantId');
        }
        return this.usersService.findAllByTenant(tenantId);
    }

    @Patch(':id/role')
    async updateUserRole(
        @Req() req: RequestWithUser,
        @Param('id') userId: string,
        @Body() body: { role: 'CLIENT' | 'MEMBER' | 'ADMIN' | 'OWNER' },
    ) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            throw new Error('Missing tenantId');
        }
        return this.usersService.updateUserRole(userId, tenantId, body.role);
    }

    @Delete(':id')
    async deleteUser(
        @Req() req: RequestWithUser,
        @Param('id') userId: string,
    ) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            throw new Error('Missing tenantId');
        }
        return this.usersService.deleteUser(userId, tenantId);
    }
}
