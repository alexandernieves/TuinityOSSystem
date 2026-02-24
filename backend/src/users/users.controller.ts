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
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
    @Body() body: {
      email: string;
      name: string;
      password?: string;
      role: string;
    },
  ) {
    await this.assertOwner(req);
    const tenantId = req.user?.tenantId;

    const bcrypt = require('bcryptjs');

    // Asignación de contraseña manual
    const finalPassword = body.password || 'Evolution2026';
    const passwordHash = await bcrypt.hash(finalPassword, 12);

    const user = await this.usersService.createUser(tenantId!, {
      email: body.email,
      name: body.name,
      passwordHash,
      role: body.role as any,
    });

    return user;
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

  @Patch('me')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateMyProfile(
    @Req() req: RequestWithUser,
    @Body() body: { name?: string; description?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = req.user?.sub;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      throw new ForbiddenException('Acceso denegado');
    }

    let avatarUrl: string | undefined = undefined;

    if (file) {
      const region = process.env.AWS_REGION || 'us-east-1';
      const s3 = new S3Client({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      });

      const bucketName = process.env.AWS_S3_BUCKET || 'evolution-479664684511-assets-v1';
      const fileExt = file.originalname.split('.').pop();
      const fileName = `user-profiles/${userId}-${Date.now()}.${fileExt}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      avatarUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
    }

    return this.usersService.updateProfile(userId, tenantId, {
      name: body.name,
      description: body.description,
      avatarUrl,
    });
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
      | 'TRAFFIC'
      | 'ACCOUNTING'
      | 'PURCHASING'
      | 'SUPERVISOR';
    },
  ) {
    await this.assertOwner(req);
    const tenantId = req.user?.tenantId;
    return this.usersService.updateUserRole(userId, tenantId!, body.role);
  }

  @Patch(':id')
  async updateUser(
    @Req() req: RequestWithUser,
    @Param('id') userId: string,
    @Body() body: { name?: string; role?: string },
  ) {
    await this.assertOwner(req);
    const tenantId = req.user?.tenantId;
    return this.usersService.updateUserInfo(userId, tenantId!, body);
  }

  @Delete(':id')
  async deleteUser(@Req() req: RequestWithUser, @Param('id') userId: string) {
    await this.assertOwner(req);
    const tenantId = req.user?.tenantId;
    return this.usersService.deleteUser(userId, tenantId!);
  }
}
