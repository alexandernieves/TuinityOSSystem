import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';
import { StockService } from '../stock/stock.service';

@Injectable()
export class ProductsService {
    constructor(
        private prisma: PrismaService,
        private stockService: StockService,
    ) { }

    async findAll(warehouseId?: string): Promise<any[]> {
        const products = await this.prisma.product.findMany({
            include: {
                brand: true,
                group: true,
                subgroup: true,
                category: true,
                subcategory: true,
                barcodes: true,
                prices: true,
            },
        });

        const productsWithStock = await Promise.all(
            products.map(async (product) => {
                const stock = await this.stockService.getProductStockAggregate(product.id);
                // If a warehouseId is provided, we should probably return the stock for THAT warehouse
                // BUT the system usually shows global stock. The user asked for "sincronizado".
                // Let's modify getProductStockAggregate to support warehouseId if we want real filtering.
                
                // Let's check getProductStockAggregate in StockService first.
                // It doesn't support warehouseId currently. I should update it.
                
                // For now, if warehouseId is present, we'll fetch existence specifically.
                let filteredStock = stock;
                if (warehouseId) {
                    const existence = await this.prisma.inventoryExistence.findUnique({
                        where: { productId_warehouseId: { productId: product.id, warehouseId } }
                    });
                    if (existence) {
                        filteredStock = {
                            existence: Number(existence.existence),
                            available: Number(existence.available),
                            reserved: Number(existence.reserved),
                            arriving: Number(existence.arriving)
                        };
                    } else {
                        filteredStock = { existence: 0, available: 0, reserved: 0, arriving: 0 };
                    }
                }

                // Map prices array to object { A, B, C, D, E }
                const pricesObj: any = {};
                product.prices.forEach(p => {
                    pricesObj[p.level] = Number(p.price);
                });

                return {
                    ...product,
                    prices: pricesObj,
                    stock: filteredStock,
                    costAvgWeighted: Number(product.costAvgWeighted || 0),
                    costCIF: Number(product.costCIF || 0),
                    costFOB: Number(product.costFOB || 0),
                };
            }),
        );
        return productsWithStock;
    }

    async findOne(id: string): Promise<any> {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                brand: true,
                group: true,
                subgroup: true,
                category: true,
                subcategory: true,
                barcodes: true,
                prices: true,
            },
        });
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        const stock = await this.stockService.getProductStockAggregate(id);

        // Map prices array to object { A, B, C, D, E }
        const pricesObj: any = {};
        product.prices.forEach(p => {
            pricesObj[p.level] = Number(p.price);
        });

        return { 
            ...product, 
            prices: pricesObj,
            stock,
            costFOB: Number(product.costFOB || 0),
            costCIF: Number(product.costCIF || 0),
            costAvgWeighted: Number(product.costAvgWeighted || 0),
        };
    }

    async findByReference(reference: string): Promise<any> {
        const product = await this.prisma.product.findUnique({
            where: { sku: reference },
            include: {
                barcodes: true,
            },
        });
        if (!product) {
            throw new NotFoundException(`Product with reference ${reference} not found`);
        }
        return { ...product };
    }

    async create(createProductDto: any): Promise<any> {
        return this.prisma.product.create({
            data: {
                sku: createProductDto.sku || createProductDto.reference,
                name: createProductDto.name,
                description: createProductDto.description,
                groupId: createProductDto.groupId,
                subgroupId: createProductDto.subgroupId,
                brandId: createProductDto.brandId,
                categoryId: createProductDto.categoryId,
                subcategoryId: createProductDto.subcategoryId,
                unitsPerBox: createProductDto.unitsPerBox,
                image: createProductDto.image,
                isActive: createProductDto.isActive ?? (createProductDto.status !== undefined ? createProductDto.status === 'active' : true),
            }
        });
    }

    async update(id: string, updateProductDto: any): Promise<any> {
        const data: any = {};
        
        if (updateProductDto.name !== undefined) data.name = updateProductDto.name;
        if (updateProductDto.description !== undefined) data.description = updateProductDto.description;
        if (updateProductDto.groupId !== undefined) data.groupId = updateProductDto.groupId;
        if (updateProductDto.subgroupId !== undefined) data.subgroupId = updateProductDto.subgroupId;
        if (updateProductDto.categoryId !== undefined) data.categoryId = updateProductDto.categoryId;
        if (updateProductDto.subcategoryId !== undefined) data.subcategoryId = updateProductDto.subcategoryId;
        if (updateProductDto.brandId !== undefined) data.brandId = updateProductDto.brandId;
        if (updateProductDto.unitsPerBox !== undefined) data.unitsPerBox = updateProductDto.unitsPerBox;
        if (updateProductDto.image !== undefined) data.image = updateProductDto.image;
        
        // Map status to isActive if needed
        if (updateProductDto.status !== undefined) {
            data.isActive = updateProductDto.status === 'active';
        } else if (updateProductDto.isActive !== undefined) {
            data.isActive = updateProductDto.isActive;
        }

        return this.prisma.product.update({
            where: { id },
            data
        });
    }

    async remove(id: string): Promise<any> {
        return this.prisma.product.delete({ where: { id } });
    }

    async removeMany(ids: string[]): Promise<any> {
        return this.prisma.product.deleteMany({
            where: {
                id: { in: ids }
            }
        });
    }

    async importProducts(file: any): Promise<any> {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        
        try {
            if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
                await workbook.csv.read(file.buffer);
            } else {
                await workbook.xlsx.load(file.buffer);
            }

            const worksheet = workbook.getWorksheet(1);
            if (!worksheet) {
                throw new Error('No se encontró ninguna hoja en el archivo');
            }

            // Identify headers (skip empty rows at start if any)
            let headerRowIndex = 1;
            let headers: string[] = [];
            
            // Search for the row containing "Referencia"
            worksheet.eachRow((row, rowNumber) => {
                if (headers.length > 0) return;
                const rowValues = row.values as any[];
                if (rowValues.some(v => v?.toString()?.trim()?.toLowerCase() === 'referencia')) {
                    headerRowIndex = rowNumber;
                    headers = rowValues.map(v => v?.toString()?.trim() || '');
                }
            });

            if (headers.length === 0) {
                // Fallback to row 1
                headers = (worksheet.getRow(1).values as any[]).map(v => v?.toString()?.trim() || '');
            }

            const colMap: any = {};
            headers.forEach((h, i) => {
                if (!h) return;
                const lower = h.toLowerCase();
                if (lower.includes('referencia')) colMap.sku = i;
                if (lower.includes('descripción') || lower.includes('descripcion')) colMap.name = i;
                if (lower.includes('codigo barra') || lower.includes('códigos de barras')) colMap.barcode = i;
                if (lower.includes('existencia') || lower.includes('disponible')) colMap.stock = i;
                if (lower.includes('precio a')) colMap.priceA = i;
                if (lower.includes('cantidad minima') || lower.includes('mínimo')) colMap.minQty = i;
                if (lower.includes('marca')) colMap.brand = i;
                if (lower.includes('grupo') && !lower.includes('sub')) colMap.group = i;
                if (lower.includes('sub-grupo') || lower.includes('subgrupo')) colMap.subgroup = i;
                if (lower.includes('precio pos') || lower.includes('precio b2c')) colMap.pricePOS = i;
            });

            // Validation of mandatory columns
            const missing: string[] = [];
            if (!colMap.sku) missing.push('Referencia');
            if (!colMap.name) missing.push('Descripción');
            if (!colMap.group) missing.push('Grupo');

            if (missing.length > 0) {
                return { 
                    success: false, 
                    message: `Faltan columnas requeridas: ${missing.join(', ')}. Por favor, asegúrese de que la cabecera del archivo contenga estos nombres.` 
                };
            }

            const results = {
                success: 0,
                failed: 0,
                errors: [] as string[]
            };

            const defaultWarehouse = await this.prisma.warehouse.findFirst({
                where: { isActive: true, type: 'B2B' },
                orderBy: { name: 'asc' }
            }) || await this.prisma.warehouse.findFirst({
                where: { isActive: true }
            }) || await this.prisma.warehouse.findFirst();

            // Process data rows
            const rows = worksheet.getRows(headerRowIndex + 1, worksheet.rowCount - headerRowIndex);
            if (!rows) return { success: true, count: 0, details: results };

            // Sequential processing
            for (const row of rows) {
                const values = row.values as any[];
                const rowData = {
                    sku: values[colMap.sku]?.toString()?.trim(),
                    name: values[colMap.name]?.toString()?.trim(),
                    groupName: values[colMap.group]?.toString()?.trim(),
                    brandName: colMap.brand ? values[colMap.brand]?.toString()?.trim() : null,
                    subgroupName: colMap.subgroup ? values[colMap.subgroup]?.toString()?.trim() : null,
                    barcode: colMap.barcode ? values[colMap.barcode]?.toString()?.trim() : null,
                    priceA: colMap.priceA ? parseFloat(values[colMap.priceA]) : null,
                    pricePOS: colMap.pricePOS ? parseFloat(values[colMap.pricePOS]) : null,
                    stock: colMap.stock ? parseFloat(values[colMap.stock]) : null,
                    minQty: colMap.minQty ? parseInt(values[colMap.minQty]) || 0 : 0,
                    rowNumber: row.number
                };

                await this.processSingleRow(rowData, results, defaultWarehouse);
            }

            return { 
                success: true, 
                message: `Importación finalizada: ${results.success} productos importados, ${results.failed} fallidos.`,
                details: results
            };

        } catch (error) {
            console.error('[Import] Critical error parsing file:', error);
            return { 
                success: false, 
                message: `Error al procesar el archivo: ${error.message}` 
            };
        }
    }

    async importProductsJsonBatch(batch: any[]): Promise<any> {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        const defaultWarehouse = await this.prisma.warehouse.findFirst({
            where: { isActive: true }
        }) || await this.prisma.warehouse.findFirst();

        for (const rowData of batch) {
            await this.processSingleRow(rowData, results, defaultWarehouse);
        }

        return {
            success: true,
            details: results
        };
    }

    private async processSingleRow(rowData: any, results: any, defaultWarehouse: any) {
        const { sku, name, groupName, brandName, subgroupName, barcode, priceA, pricePOS, stock, minQty, rowNumber } = rowData;

        if (!sku || !name || !groupName) {
            const missing: string[] = [];
            if (!sku) missing.push('Referencia');
            if (!name) missing.push('Descripción');
            if (!groupName) missing.push('Grupo');
            
            results.failed++;
            results.errors.push(`Fila ${rowNumber || 'N/A'}: Datos incompletos (${missing.join(', ')} son obligatorios)`);
            return;
        }

        try {
            // Check if duplicate SKU
            // Handle Brand
            let brandId: string | null = null;
            if (brandName && brandName.toLowerCase() !== 'varios') {
                const brand = await this.prisma.brand.upsert({
                    where: { name: brandName },
                    update: {},
                    create: { name: brandName }
                });
                brandId = brand.id;
            }

            // Handle Group
            const group = await this.prisma.productGroup.upsert({
                where: { name: groupName },
                update: {},
                create: { name: groupName }
            });

            // Handle Category (New Model)
            let rootCategory = await this.prisma.category.findUnique({
                where: { name: groupName }
            });

            if (!rootCategory) {
                rootCategory = await this.prisma.category.create({
                    data: {
                        name: groupName,
                        level: 1,
                        isActive: true
                    }
                });
            }


            // Handle Subgroup
            let subgroupId: string | null = null;
            let subcategoryId: string | null = null;

            if (subgroupName) {
                const subgroup = await this.prisma.productSubgroup.upsert({
                    where: { 
                        groupId_name: {
                            groupId: group.id,
                            name: subgroupName
                        }
                    },
                    update: {},
                    create: { name: subgroupName, groupId: group.id }
                });
                subgroupId = subgroup.id;

                const subCat = await this.prisma.category.findUnique({
                    where: { name: subgroupName }
                });

                if (subCat) {
                    subcategoryId = subCat.id;
                } else {
                    const newSubCat = await this.prisma.category.create({
                        data: {
                            name: subgroupName,
                            parentId: rootCategory.id,
                            level: 2,
                            isActive: true
                        }
                    });
                    subcategoryId = newSubCat.id;
                }
            }

            // Upsert Product
            const product = await this.prisma.product.upsert({
                where: { sku },
                update: {
                    name,
                    description: name,
                    brandId,
                    groupId: group.id,
                    subgroupId,
                    categoryId: rootCategory.id,
                    subcategoryId,
                    minimumQuantity: minQty || 0,
                    isActive: true
                },
                create: {
                    sku,
                    name,
                    description: name,
                    brandId,
                    groupId: group.id,
                    subgroupId,
                    categoryId: rootCategory.id,
                    subcategoryId,
                    minimumQuantity: minQty || 0,
                    isActive: true
                }
            });

            // Handle Barcode
            if (barcode) {
                await this.prisma.productBarcode.upsert({
                    where: { barcode: barcode },
                    update: { productId: product.id },
                    create: {
                        productId: product.id,
                        barcode: barcode,
                        type: 'EAN13'
                    }
                });
            }

            // Handle Price A
            if (priceA !== null && !isNaN(priceA)) {
                await this.prisma.productPrice.upsert({
                    where: {
                        productId_level: {
                            productId: product.id,
                            level: 'A'
                        }
                    },
                    update: { price: priceA },
                    create: {
                        productId: product.id,
                        level: 'A',
                        price: priceA,
                        currency: 'USD'
                    }
                });
            }

            // Handle Price POS
            if (pricePOS !== null && !isNaN(pricePOS)) {
                await this.prisma.productPrice.upsert({
                    where: {
                        productId_level: {
                            productId: product.id,
                            level: 'POS'
                        }
                    },
                    update: { price: pricePOS },
                    create: {
                        productId: product.id,
                        level: 'POS',
                        price: pricePOS,
                        currency: 'USD'
                    }
                });
            }

            // Handle Stock
            if (stock !== null && !isNaN(stock) && stock >= 0 && defaultWarehouse) {
                // 1. Update InventoryExistence (total summary)
                await this.prisma.inventoryExistence.upsert({
                    where: {
                        productId_warehouseId: {
                            productId: product.id,
                            warehouseId: defaultWarehouse.id
                        }
                    },
                    update: {
                        existence: stock,
                        available: stock
                    },
                    create: {
                        productId: product.id,
                        warehouseId: defaultWarehouse.id,
                        existence: stock,
                        available: stock
                    }
                });

                // 2. Update ProductLot (granular level)
                if (stock > 0) {
                    const existingLot = await this.prisma.productLot.findFirst({
                        where: {
                            warehouseId: defaultWarehouse.id,
                            productId: product.id,
                            lotNumber: 'STOCK-INICIAL',
                            expirationDate: null
                        }
                    });

                    if (existingLot) {
                        await this.prisma.productLot.update({
                            where: { id: existingLot.id },
                            data: {
                                availableQuantity: stock,
                                receivedQuantity: stock,
                                isActive: true
                            }
                        });
                    } else {
                        await this.prisma.productLot.create({
                            data: {
                                warehouseId: defaultWarehouse.id,
                                productId: product.id,
                                lotNumber: 'STOCK-INICIAL',
                                receivedQuantity: stock,
                                availableQuantity: stock,
                                isActive: true
                            }
                        });
                    }
                } else {
                    // If stock is 0, we ensure the lot reflects that if it exists
                    await this.prisma.productLot.updateMany({
                        where: {
                            productId: product.id,
                            warehouseId: defaultWarehouse.id,
                            lotNumber: 'STOCK-INICIAL'
                        },
                        data: {
                            availableQuantity: 0,
                            receivedQuantity: 0
                        }
                    });
                }
            }

            results.success++;
        } catch (rowErr) {
            results.failed++;
            results.errors.push(`Error en referencia "${sku}": ${rowErr.message}`);
            console.error(`[Import] Error processing row with SKU ${sku}:`, rowErr);
        }
    }
    async exportProducts(format: 'xlsx' | 'csv'): Promise<any> {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Productos');

        // Define columns
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 30 },
            { header: 'Referencia', key: 'sku', width: 20 },
            { header: 'Nombre', key: 'name', width: 30 },
            { header: 'Descripción', key: 'description', width: 40 },
            { header: 'Marca', key: 'brand', width: 20 },
            { header: 'Grupo', key: 'group', width: 20 },
            { header: 'Sub-Grupo', key: 'subgroup', width: 20 },
            { header: 'Unidades por Caja', key: 'unitsPerBox', width: 15 },
            { header: 'Imagen URL', key: 'image', width: 40 },
            { header: 'Códigos de Barra', key: 'barcodes', width: 30 },
            { header: 'Estado', key: 'status', width: 12 },
            { header: 'Existencia Total', key: 'totalStock', width: 15 },
            { header: 'Precio A', key: 'priceA', width: 12 },
            { header: 'Precio B', key: 'priceB', width: 12 },
            { header: 'Precio C', key: 'priceC', width: 12 },
            { header: 'Precio D', key: 'priceD', width: 12 },
            { header: 'Precio E', key: 'priceE', width: 12 },
            { header: 'Precio POS', key: 'pricePOS', width: 12 },
            { header: 'Costo FOB', key: 'costFOB', width: 12 },
            { header: 'Costo CIF', key: 'costCIF', width: 12 },
            { header: 'Costo Promedio', key: 'costAvg', width: 12 },
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        const products = await this.findAll();

        products.forEach(p => {
            const barcodesText = p.barcodes?.map((b: any) => b.barcode).join(', ') || '';
            const totalStock = p.stock?.total || 0;

            worksheet.addRow({
                id: p.id,
                sku: p.sku,
                name: p.name,
                description: p.description,
                brand: p.brand?.name || '',
                group: p.group?.name || '',
                subgroup: p.subgroup?.name || '',
                unitsPerBox: p.unitsPerBox || 1,
                image: p.image || '',
                barcodes: barcodesText,
                status: p.isActive ? 'Activo' : 'Inactivo',
                totalStock: totalStock,
                priceA: p.prices?.A || 0,
                priceB: p.prices?.B || 0,
                priceC: p.prices?.C || 0,
                priceD: p.prices?.D || 0,
                priceE: p.prices?.E || 0,
                pricePOS: p.prices?.POS || 0,
                costFOB: p.costFOB || 0,
                costCIF: p.costCIF || 0,
                costAvg: p.costAvgWeighted || 0,
            });
        });

        if (format === 'csv') {
            return workbook.csv.writeBuffer();
        }
        return workbook.xlsx.writeBuffer();
    }
}

