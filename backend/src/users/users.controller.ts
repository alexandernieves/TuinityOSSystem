import { Controller, Get, Post, Body, Patch, Param, UseGuards, UnauthorizedException, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Post()
    create(@Body() createUserDto: any, @Request() req: any) {
        // Only admin should be able to create? Optional:
        // if (req.user?.role !== 'admin') throw new UnauthorizedException('Solo admins pueden crear usuarios');
        return this.usersService.create(createUserDto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateUserDto: any) {
        return this.usersService.update(id, updateUserDto);
    }

    @Patch(':id/toggle')
    toggleActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
        return this.usersService.toggleActive(id, isActive);
    }
}
