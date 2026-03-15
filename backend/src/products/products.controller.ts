import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
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

    @Post(':id/image')
    @UseInterceptors(FileInterceptor('image'))
    async uploadImage(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        const imageUrl = await this.storageService.uploadFile(file, 'products');
        return this.productsService.update(id, { image: imageUrl });
    }
}
