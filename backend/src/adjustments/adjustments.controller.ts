import { Controller, Get, Post, Body, Patch, Param, Request, UseGuards, UseInterceptors, UploadedFiles, Query } from '@nestjs/common';
import { AdjustmentsService } from './adjustments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';

@Controller('adjustments')
@UseGuards(JwtAuthGuard)
export class AdjustmentsController {
    constructor(
        private readonly adjustmentsService: AdjustmentsService,
        private readonly storageService: StorageService,
    ) { }

    @Post()
    create(@Body() createDto: any, @Request() req) {
        if (req.user && req.user.sub) {
            createDto.createdBy = req.user.sub;
        }
        return this.adjustmentsService.create(createDto);
    }

    @Post('upload-evidence')
    @UseInterceptors(FilesInterceptor('files', 10))
    async uploadEvidence(@UploadedFiles() files: any[]) {
        try {
            if (!files || files.length === 0) {
                return { success: false, urls: [] };
            }

            const uploadPromises = files.map(file => 
                this.storageService.uploadFile(file, 'inventory/adjustments')
            );
            
            const urls = await Promise.all(uploadPromises);
            return { success: true, urls };
        } catch (error) {
            return { 
                success: false, 
                message: error.message || 'Error al subir evidencia',
                urls: [] 
            };
        }
    }

    @Get()
    findAll(@Query('warehouseId') warehouseId?: string) {
        return this.adjustmentsService.findAll(warehouseId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.adjustmentsService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() updateDto: any, @Request() req) {
        if (req.user && req.user.sub) {
            updateDto.userId = req.user.sub;
        }
        return this.adjustmentsService.updateStatus(id, updateDto);
    }
}
