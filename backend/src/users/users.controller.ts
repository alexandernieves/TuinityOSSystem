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

    @Post(':id/avatar')
    @UseInterceptors(FileInterceptor('avatar'))
    async uploadAvatar(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        const avatarUrl = await this.storageService.uploadFile(file, 'user-profiles');
        return this.usersService.update(id, { avatar: avatarUrl });
    }
}
