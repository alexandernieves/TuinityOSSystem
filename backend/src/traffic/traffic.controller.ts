import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { TrafficService } from './traffic.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('traffic')
@UseGuards(JwtAuthGuard)
export class TrafficController {
    constructor(private readonly trafficService: TrafficService) { }

    @Get('expedients')
    findAllExpedients() {
        return this.trafficService.findAllExpedients();
    }

    @Get('expedients/:id')
    findExpedientById(@Param('id') id: string) {
        return this.trafficService.findExpedientById(id);
    }

    @Post('expedients')
    createExpedient(@Body() createDto: any, @Request() req) {
        if (req.user && req.user.sub) {
            createDto.createdBy = req.user.sub;
        }
        return this.trafficService.createExpedient(createDto);
    }

    @Patch('expedients/:id/status')
    updateExpedientStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.trafficService.updateExpedientStatus(id, status);
    }

    @Post('dmc')
    createDMC(@Body() createDto: any, @Request() req) {
        if (req.user && req.user.sub) {
            createDto.createdBy = req.user.sub;
        }
        return this.trafficService.createDMC(createDto);
    }

    @Post('bl')
    createBL(@Body() createDto: any, @Request() req) {
        if (req.user && req.user.sub) {
            createDto.createdBy = req.user.sub;
        }
        return this.trafficService.createBL(createDto);
    }

    @Get('stats')
    getStats() {
        return this.trafficService.getStats();
    }
}
