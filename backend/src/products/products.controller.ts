import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Header, StreamableFile } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly storageService: StorageService
    ) { }

    @Get()
    findAll() {
        return this.productsService.findAll();
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
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
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
