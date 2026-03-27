import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Header, StreamableFile, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly storageService: StorageService
    ) { }

    @Get()
    async findAll(@CurrentUser() user: any, @Query('warehouseId') warehouseId?: string) {
        const products = await this.productsService.findAll(warehouseId);
        
        // Security filter: Cajeros and Bodega don't see costs/margins
        if (['vendedor', 'bodega', 'pos_cajero', 'pos_encargado'].includes(user.role)) {
            return products.map(p => {
                const { costFOB, costCIF, costAvgWeighted, ...rest } = p;
                return rest;
            });
        }
        return products;
    }

    @Post('batch-import')
    @UseInterceptors(FileInterceptor('file'))
    async importProducts(@UploadedFile() file: any) {
        if (!file) {
            return { success: false, message: 'No se recibió ningún archivo' };
        }
        return this.productsService.importProducts(file);
    }

    @Post('batch-import-json')
    async importProductsJson(@Body() body: { batch: any[] }) {
        return this.productsService.importProductsJsonBatch(body.batch);
    }

    @Get('export/:format')
    @Header('Content-Type', 'application/octet-stream')
    async exportProducts(@Param('format') format: string) {
        const buffer = await this.productsService.exportProducts(format as any);
        return new StreamableFile(buffer, {
            type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            disposition: `attachment; filename="productos_${new Date().getTime()}.${format}"`
        });
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
        const product = await this.productsService.findOne(id);
        
        if (['vendedor', 'bodega', 'pos_cajero', 'pos_encargado'].includes(user.role)) {
            const { costFOB, costCIF, costAvgWeighted, ...rest } = product;
            return rest;
        }
        return product;
    }

    @Get('ref/:reference')
    findByReference(@Param('reference') reference: string) {
        return this.productsService.findByReference(reference);
    }

    @Post()
    create(@Body() createProductDto: any) {
        return this.productsService.create(createProductDto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateProductDto: any) {
        return this.productsService.update(id, updateProductDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.productsService.remove(id);
    }

    @Post('bulk-delete')
    async bulkDelete(@Body('ids') ids: string[]) {
        console.log(`[Products] Bulk deleting ${ids.length} products`);
        return this.productsService.removeMany(ids);
    }

    @Post(':id/image')
    @UseInterceptors(FileInterceptor('image'))
    async uploadImage(
        @Param('id') id: string,
        @UploadedFile() file: any
    ) {
        try {
            if (!file) {
                console.error('[Products] No file received in request');
                return { success: false, message: 'No se recibió ningún archivo' };
            }
            
            console.log(`[Products] Receiving file upload for product ${id}: ${file.originalname}`);
            const imageUrl = await this.storageService.uploadFile(file, 'products');
            console.log(`[Products] Upload successful: ${imageUrl}`);
            
            await this.productsService.update(id, { image: imageUrl });
            return { success: true, image: imageUrl };
        } catch (error) {
            console.error('[Products] Image upload failed:', error.message);
            return { 
                success: false, 
                message: error.message || 'Error al procesar la imagen',
                details: error.stack
            };
        }
    }
}
