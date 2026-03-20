import { Controller, Get, Post, Body, Patch, Param, UseGuards, UnauthorizedException, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly storageService: StorageService
    ) { }

    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @Get('pending')
    getPendingUsers() {
        return this.usersService.getPendingUsers();
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

    @Patch(':id/approve')
    approveUser(@Param('id') id: string, @Body('role') role: string) {
        return this.usersService.approveUser(id, role);
    }

    @Post(':id/avatar')
    @UseInterceptors(FileInterceptor('avatar'))
    async uploadAvatar(
        @Param('id') id: string,
        @UploadedFile() file: any
    ) {
        if (!file) {
            console.error(`[Users] No avatar file received for user ${id}`);
            throw new UnauthorizedException('No se recibió ningún archivo');
        }

        console.log(`[Users] Uploading avatar for user ${id}: ${file.originalname}`);
        try {
            const avatarUrl = await this.storageService.uploadFile(file, 'user-profiles');
            console.log(`[Users] Avatar uploaded successfully: ${avatarUrl}`);
            return this.usersService.update(id, { avatar: avatarUrl });
        } catch (error) {
            console.error(`[Users] Failed to upload avatar for user ${id}:`, error.message);
            throw error;
        }
    }
}
