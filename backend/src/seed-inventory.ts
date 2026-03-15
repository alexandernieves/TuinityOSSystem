import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Product } from './products/schemas/product.schema';
import { Warehouse } from './warehouses/schemas/warehouse.schema';
import { Stock } from './stock/schemas/stock.schema';
import { Model } from 'mongoose';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const productModel = app.get<Model<Product>>(getModelToken('Product'));
    const warehouseModel = app.get<Model<Warehouse>>(getModelToken('Warehouse'));
    const stockModel = app.get<Model<Stock>>(getModelToken('Stock'));

    // 1. Limpiar colecciones anteriores
    await productModel.deleteMany({});
    await warehouseModel.deleteMany({});
    await stockModel.deleteMany({});

    console.log('Colecciones limpias.');

    // 2. Insertar Bodegas
    const warehousesData = [
        {
            code: 'ZL',
            name: 'Bodega Zona Libre',
            type: 'zona_libre',
            address: 'Zona Libre de Colón, Edificio 2045',
            city: 'Colón',
            country: 'Panamá',
            phone: '+507 441-8900',
            manager: 'Javier Lange',
            isHeadquarters: true,
            isActive: true,
        },
        {
            code: 'PTY-TIENDA',
            name: 'Tienda Panama City',
            type: 'tienda',
            address: 'Vía España, Local 42',
            city: 'Ciudad de Panamá',
            country: 'Panamá',
            phone: '+507 263-4567',
            manager: 'Pedro Bodega',
            isHeadquarters: false,
            isActive: true,
        },
        {
            code: 'CFZ',
            name: 'Bodega CFZ',
            type: 'bodega',
            address: 'Colón Free Zone, Warehouse 15',
            city: 'Colón',
            country: 'Panamá',
            phone: '+507 441-2345',
            manager: 'Jesus Ferreira',
            isHeadquarters: false,
            isActive: true,
        }
    ];

    const createdWarehouses = await warehouseModel.insertMany(warehousesData);
    console.log(`${createdWarehouses.length} bodegas creadas.`);

    // 3. Insertar Productos
    const productsData = [
        {
            reference: 'EVL-00001',
            description: 'WHISKY BLACK & WHITE 24X375ML 40%VOL',
            group: 'WHISKY',
            subGroup: 'WHISKY',
            brand: 'BLACK & WHITE',
            supplier: 'GLOBAL BRANDS, S.A.',
            country: 'ESCOCIA',
            barcode: '0000050196166',
            unit: 'CJA',
            unitsPerCase: 24,
            reorderPoint: 30,
            minimumQty: 20,
            prices: { A: 111, B: 106, C: 102, D: 97, E: 97 },
            costFOB: 73.0,
            costCIF: 83.95,
            costAvgWeighted: 82.5,
            priceB2C: 6.99,
            status: 'active',
        },
        {
            reference: 'EVL-00002',
            description: 'WHISKY JOHNNIE WALKER RED NR 12X750ML 40%VOL',
            group: 'WHISKY',
            subGroup: 'WHISKY',
            brand: 'JOHNNIE WALKER',
            supplier: 'TRIPLE DOUBLE TRADING LLC',
            country: 'ESCOCIA',
            barcode: '5000267014005',
            unit: 'CJA',
            unitsPerCase: 12,
            reorderPoint: 40,
            minimumQty: 50,
            prices: { A: 120, B: 115, C: 110, D: 105, E: 102 },
            costFOB: 73.0,
            costCIF: 83.95,
            costAvgWeighted: 82.5,
            priceB2C: 14.99,
            status: 'active',
        },
        {
            reference: 'EVL-00004',
            description: 'TEQUILA DON JULIO 1942 GB COR 6X750ML 40%V',
            group: 'TEQUILA',
            subGroup: 'TEQUILA',
            brand: 'DON JULIO',
            supplier: 'TRIPLE DOUBLE TRADING LLC',
            country: 'MEXICO',
            unit: 'CJA',
            unitsPerCase: 6,
            reorderPoint: 5,
            minimumQty: 5,
            prices: { A: 780, B: 750, C: 720, D: 695, E: 680 },
            costFOB: 528.0,
            costCIF: 607.2,
            costAvgWeighted: 595.0,
            priceB2C: 189.99,
            status: 'active',
        }
    ];

    const createdProducts = await productModel.insertMany(productsData);
    console.log(`${createdProducts.length} productos creados.`);

    // 4. Crear Stock Inicial
    const stockData: any[] = [];

    // Asignar stock a EVL-00001 en Bodega Zona Libre (index 0)
    stockData.push({
        productId: createdProducts[0]._id,
        warehouseId: createdWarehouses[0]._id,
        existence: 150,
        arriving: 50,
        reserved: 20,
        available: 180,
    });

    // Asignar stock a EVL-00002 en Bodega Zona Libre (index 0)
    stockData.push({
        productId: createdProducts[1]._id,
        warehouseId: createdWarehouses[0]._id,
        existence: 100,
        arriving: 0,
        reserved: 30,
        available: 70,
    });

    // Asignar stock a EVL-00004 en Bodega Zona Libre
    stockData.push({
        productId: createdProducts[2]._id,
        warehouseId: createdWarehouses[0]._id,
        existence: 23,
        arriving: 0,
        reserved: 10,
        available: 13,
    });

    // Asignar algo de stock a la Tienda B2C (index 1) para pruebas de transferencias
    stockData.push({
        productId: createdProducts[0]._id,
        warehouseId: createdWarehouses[1]._id,
        existence: 10,
        arriving: 0,
        reserved: 0,
        available: 10,
    });

    await stockModel.insertMany(stockData);
    console.log('Stock inicial creado.');

    await app.close();
}

seed();
