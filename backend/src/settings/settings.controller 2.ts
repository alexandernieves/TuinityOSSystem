import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get('commercial-params')
    getCommercialParams() {
        return this.settingsService.getCommercialParams();
    }

    @Put('commercial-params')
    updateCommercialParams(@Body() data: any) {
        return this.settingsService.updateCommercialParams(data);
    }

    @Get('document-numbering')
    getDocumentNumbering() {
        return this.settingsService.getDocumentNumbering();
    }

    @Put('document-numbering/:id')
    updateDocumentNumbering(@Param('id') id: string, @Body() data: any) {
        return this.settingsService.updateDocumentNumbering(id, data);
    }
}
