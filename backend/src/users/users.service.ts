import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(userData: any): Promise<User> {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        return this.prisma.user.create({
            data: {
                email: userData.email,
                name: userData.name,
                passwordHash: hashedPassword,
                isActive: userData.isActive !== undefined ? userData.isActive : true,
                warehouseId: userData.warehouseId || null,
            },
        });
    }

    async findByEmail(email: string): Promise<any | null> {
        const user = await this.prisma.user.findUnique({ 
            where: { email },
            include: { userRoles: { include: { role: true } } }
        });
        
        if (user) {
            // Pick first role name if available
            let roleName = user.userRoles?.[0]?.role?.name || 'user';
            
            // Map backend role names to frontend expected names
            if (roleName === 'ventas_b2b') roleName = 'vendedor';
            
            const { userRoles, ...userData } = user;
            return { ...userData, role: roleName };
        }
        return null;
    }

    async findById(id: string): Promise<any | null> {
        const user = await this.prisma.user.findUnique({ 
            where: { id },
            include: { userRoles: { include: { role: true } } }
        });
        
        if (user) {
            let roleName = user.userRoles?.[0]?.role?.name || 'vendedor';
            if (roleName === 'ventas_b2b') roleName = 'vendedor';
            const { userRoles, ...userData } = user;
            return { ...userData, role: roleName };
        }
        return null;
    }

    async findAll(): Promise<any[]> {
        const users = await this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: { userRoles: { include: { role: true } } },
        });

        return users.map(user => {
            let roleName = user.userRoles?.[0]?.role?.name || 'vendedor';
            if (roleName === 'ventas_b2b') roleName = 'vendedor';
            const { userRoles, ...userData } = user;
            return { ...userData, role: roleName };
        });
    }

    async update(id: string, updateData: any): Promise<User | null> {
        const data: any = { ...updateData };
        if (data.password) {
            data.passwordHash = await bcrypt.hash(data.password, 10);
            delete data.password;
        }
        
        // Remove mongo specific fields if they leak in
        delete data._id;
        delete data.__v;
        delete data.id; // Prisma doesn't like id in data object

        const role = data.role;
        delete data.role;

        // Ensure warehouseId is properly handled
        if (data.warehouseId === "") {
            data.warehouseId = null;
        }

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data,
        });

        if (role) {
            let roleEntity = await this.prisma.role.findUnique({ where: { name: role } });
            if (!roleEntity) {
                roleEntity = await this.prisma.role.create({ data: { name: role } });
            }
            await this.prisma.userRole.deleteMany({ where: { userId: id } });
            await this.prisma.userRole.create({
                data: { userId: id, roleId: roleEntity.id },
            });
        }

        return updatedUser;
    }

    async toggleActive(id: string, isActive: boolean): Promise<User | null> {
        return this.prisma.user.update({
            where: { id },
            data: { isActive },
        });
    }

    async createPendingUser(userData: any): Promise<any> {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: userData.email,
                name: userData.name,
                passwordHash: hashedPassword,
                isActive: false,
                status: 'PENDING',
            },
        });
        const { passwordHash, ...result } = user;
        return result;
    }

    async getPendingUsers(): Promise<any[]> {
        return this.prisma.user.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
        });
    }

    async approveUser(id: string, roleName: string): Promise<any> {
        // Encontrar o crear rol
        let role = await this.prisma.role.findUnique({ where: { name: roleName } });
        if (!role) {
            role = await this.prisma.role.create({ data: { name: roleName } });
        }

        // Actualizar usuario
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: {
                isActive: true,
                status: 'ACTIVE',
            },
        });

        // Borrar roles antiguos y asignar el nuevo
        await this.prisma.userRole.deleteMany({ where: { userId: id } });
        await this.prisma.userRole.create({
            data: {
                userId: id,
                roleId: role.id,
            },
        });

        const { passwordHash, ...result } = updatedUser;
        return result;
    }
}
