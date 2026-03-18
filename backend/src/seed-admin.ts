import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './services/shared/prisma.service';
import * as bcrypt from 'bcrypt';

async function resetAdmin() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);

    const hash = await bcrypt.hash('admin123', 10);
    const email = 'admin@tuinity.com';

    // Try to find the 'owner' role
    const role = await prisma.role.findUnique({ where: { name: 'owner' } });
    
    if (!role) {
        console.error('Role "owner" not found. Run "npm run seed" first.');
        await app.close();
        return;
    }

    // Upsert admin user
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash: hash,
            isActive: true,
            name: 'Admin Tuinity'
        },
        create: {
            email,
            passwordHash: hash,
            isActive: true,
            name: 'Admin Tuinity',
            userRoles: {
                create: { roleId: role.id }
            }
        }
    });

    console.log(`Admin user ready: ${email} / admin123`);

    // List all users for verification
    const users = await prisma.user.findMany({
        select: { email: true, isActive: true, userRoles: { include: { role: true } } }
    });
    console.log('All users:', JSON.stringify(users, null, 2));

    await app.close();
}

resetAdmin();
