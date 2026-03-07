import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './users/schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

async function resetAdmin() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const userModel = app.get<Model<User>>(getModelToken('User'));

    const hash = await bcrypt.hash('Admin123!', 10);

    // Try to find and update, or create
    const result = await userModel.findOneAndUpdate(
        { role: 'owner' },
        { $set: { password: hash, isActive: true } },
        { new: true }
    );

    if (result) {
        console.log(`Password reset for: ${result.email}`);
    } else {
        // Create fresh
        await userModel.create({
            name: 'Admin Tuinity',
            email: 'admin@tuinity.com',
            password: hash,
            role: 'owner',
            isActive: true,
        });
        console.log('Created admin@tuinity.com');
    }

    // List all users for verification
    const users = await userModel.find({}, { email: 1, role: 1, isActive: 1 }).lean();
    console.log('All users:', JSON.stringify(users, null, 2));

    await app.close();
}

resetAdmin();
