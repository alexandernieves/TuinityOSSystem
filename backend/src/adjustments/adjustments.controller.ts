import { Controller, Get, Post, Body, Patch, Param, Request, UseGuards } from '@nestjs/common';
import { AdjustmentsService } from './adjustments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('adjustments')
@UseGuards(JwtAuthGuard)
export class AdjustmentsController {
    constructor(private readonly adjustmentsService: AdjustmentsService) { }

    @Post()
    create(@Body() createDto: any, @Request() req) {
        // Si queremos asignar req.user.sub como createdBy automáticamente
        if (req.user && req.user.sub) {
            createDto.createdBy = req.user.sub;
        }
        return this.adjustmentsService.create(createDto);
    }

    @Get()
    findAll() {
        return this.adjustmentsService.findAll();
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
