import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    const SEED_USERS = [
        { name: 'Javier Lange', email: 'javier@evolutionzl.com', role: 'gerencia', password: 'password123' },
        { name: 'Astelvia Watts', email: 'gerencia1@evolutionzl.com', role: 'gerencia', password: 'password123' },
        { name: 'Jakeira Chavez', email: 'contabilidad@evolutionzl.com', role: 'contabilidad', password: 'password123' },
        { name: 'Ariel Brome', email: 'trafico1@evolutionzl.com', role: 'trafico', password: 'password123' },
        { name: 'Margarita Morelos', email: 'ventas1@evolutionzl.com', role: 'vendedor', password: 'password123' },
        { name: 'Arnold Arenas', email: 'arnold@evolutionzl.com', role: 'vendedor', password: 'password123' },
        { name: 'Celideth Dominguez', email: 'bodega@evolutionzl.com', role: 'compras', password: 'password123' },
        { name: 'Jesus Ferreira', email: 'compras@evolutionzl.com', role: 'bodega', password: 'password123' },
        { name: 'Marelis Gonzalez', email: 'showroom@evolutionzl.com', role: 'vendedor', password: 'password123' },
        { name: 'Elisa Garay', email: 'cajera@evolutionzl.com', role: 'vendedor', password: 'password123' },
    ];

    console.log('Seeding users...');
    for (const user of SEED_USERS) {
        const exists = await usersService.findByEmail(user.email);
        if (!exists) {
            await usersService.create(user);
            console.log(`User ${user.email} created.`);
        } else {
            console.log(`User ${user.email} already exists.`);
        }
    }

    await app.close();
    console.log('Seeding complete.');
}
bootstrap();
