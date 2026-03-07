import { Controller, Get, Post, Body, Patch, Param, Request, UseGuards } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('transfers')
@UseGuards(JwtAuthGuard)
export class TransfersController {
    constructor(private readonly transfersService: TransfersService) { }

    @Post()
    create(@Body() createDto: any, @Request() req) {
        if (req.user && req.user.sub) {
            createDto.createdBy = req.user.sub;
        }
        return this.transfersService.create(createDto);
    }

    @Get()
    findAll() {
        return this.transfersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.transfersService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() updateDto: any, @Request() req) {
        if (req.user && req.user.sub) {
            updateDto.userId = req.user.sub;
        }
        return this.transfersService.updateStatus(id, updateDto);
    }
}
