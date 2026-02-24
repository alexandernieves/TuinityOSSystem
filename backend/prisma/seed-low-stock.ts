
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tenantId = 'da9cbe8f-6ffe-4714-8709-ee3291058e93';
const branchId = '0f347390-8884-4e6f-8db4-6514f281b459';

async function main() {
    console.log('Seed starting...');

    const products = [
        {
            description: 'LÁMPARA LED DE ESCRITORIO ALTO BRILLO',
            internalReference: 'LAMP-PRO-001',
            minStock: 20,
            currentQuantity: 5,
            barcode: '770123456001',
        },
        {
            description: 'CABLE HDMI 2.1 ULTRA HD 4K (2 METROS)',
            internalReference: 'CABLE-HDMI-002',
            minStock: 50,
            currentQuantity: 12,
            barcode: '770123456002',
        },
        {
            description: 'MOUSE GAMER INALÁMBRICO RGB 12000DPI',
            internalReference: 'MOUSE-GAM-003',
            minStock: 15,
            currentQuantity: 3,
            barcode: '770123456003',
        },
    ];

    for (const p of products) {
        const createdProduct = await prisma.product.create({
            data: {
                tenantId,
                description: p.description,
                internalReference: p.internalReference,
                minStock: p.minStock,
                unitOfMeasure: 'UND',
                unitsPerBox: 1,
                weight: 0.5,
                volume: 0.001,
                barcodes: {
                    create: {
                        barcode: p.barcode,
                        tenantId,
                    },
                },
                inventory: {
                    create: {
                        tenantId,
                        branchId,
                        quantity: p.currentQuantity,
                        reserved: 0,
                    },
                },
            },
        });
        console.log(`Created product: ${createdProduct.description} (ID: ${createdProduct.id})`);
    }

    console.log('Seed finished successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
