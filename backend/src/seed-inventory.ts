import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './services/shared/prisma.service';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);

    // 1. Limpiar colecciones anteriores de Stock, Productos y Bodegas
    await prisma.inventoryExistence.deleteMany({});
    await prisma.productPrice.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.warehouse.deleteMany({});
    await prisma.productSubgroup.deleteMany({});
    await prisma.productGroup.deleteMany({});
    await prisma.brand.deleteMany({});

    console.log('Colecciones limpias.');

    // Crear grupos y marcas
    const group = await prisma.productGroup.create({ data: { name: 'WHISKY' } });
    const subGroup = await prisma.productSubgroup.create({ data: { name: 'WHISKY', groupId: group.id } });
    const bwBrand = await prisma.brand.create({ data: { name: 'BLACK & WHITE' } });
    const jwBrand = await prisma.brand.create({ data: { name: 'JOHNNIE WALKER' } });
    const tqGroup = await prisma.productGroup.create({ data: { name: 'TEQUILA' } });
    const djBrand = await prisma.brand.create({ data: { name: 'DON JULIO' } });

    // 2. Insertar Bodegas
    const w1 = await prisma.warehouse.create({
        data: {
            code: 'ZL', name: 'Bodega Zona Libre', type: 'B2B', 
            isActive: true,
        }
    });
    const w2 = await prisma.warehouse.create({
        data: {
            code: 'PTY', name: 'Tienda Panama City', type: 'B2C', 
            isActive: true,
        }
    });

    console.log(`Bodegas creadas.`);

    // 3. Insertar Productos
    const p1 = await prisma.product.create({
        data: {
            sku: 'EVL-00001', name: 'WHISKY BLACK & WHITE',
            groupId: group.id, subgroupId: subGroup.id, brandId: bwBrand.id,
            prices: {
                create: [
                    { level: 'A', price: 111 }, { level: 'B', price: 106 }, { level: 'C', price: 102 }
                ]
            }
        }
    });

    const p2 = await prisma.product.create({
        data: {
            sku: 'EVL-00002', name: 'WHISKY JOHNNIE WALKER RED',
            groupId: group.id, subgroupId: subGroup.id, brandId: jwBrand.id,
            prices: {
                create: [
                    { level: 'A', price: 120 }, { level: 'B', price: 115 }, { level: 'C', price: 110 }
                ]
            }
        }
    });

    const p3 = await prisma.product.create({
        data: {
            sku: 'EVL-00004', name: 'TEQUILA DON JULIO 1942',
            groupId: tqGroup.id, brandId: djBrand.id,
            prices: {
                create: [
                    { level: 'A', price: 780 }, { level: 'B', price: 750 }, { level: 'C', price: 720 }
                ]
            }
        }
    });

    console.log(`Productos creados.`);

    // 4. Crear Stock Inicial
    await prisma.inventoryExistence.createMany({
        data: [
            { productId: p1.id, warehouseId: w1.id, existence: 150, arriving: 50, available: 200 },
            { productId: p2.id, warehouseId: w1.id, existence: 100, arriving: 0, available: 100 },
            { productId: p3.id, warehouseId: w1.id, existence: 23, arriving: 0, available: 23 },
            { productId: p1.id, warehouseId: w2.id, existence: 10, arriving: 0, available: 10 },
        ]
    });

    console.log('Stock inicial creado.');
    
    // 5. Insertar Clientes (Novedad)
    await prisma.customer.deleteMany({});
    const client1 = await prisma.customer.create({
        data: {
            code: 'CLI-001',
            legalName: 'RETAIL PANAMÁ S.A.',
            taxId: '1234567-1-123456',
            email: 'compras@retailpty.com',
            phone: '222-3344',
            country: 'Panamá',
            creditProfile: {
                create: {
                   creditLimit: 5000,
                   creditDays: 30,
                   priceLevel: 'A'
                }
            }
        }
    });

    const client2 = await prisma.customer.create({
        data: {
            code: 'CLI-002',
            legalName: 'DISTRIBUIDORA EL EXITO',
            taxId: '9876543-2-987654',
            email: 'ventas@exito.com.pa',
            phone: '399-8877',
            country: 'Panamá',
            creditProfile: {
                create: {
                   creditLimit: 2500,
                   creditDays: 15,
                   priceLevel: 'B'
                }
            }
        }
    });

    console.log('Clientes creados.');

    await app.close();
}

seed();
