import { Module } from '@nestjs/common';
import { TrafficController } from './traffic.controller';
import { TrafficService } from './traffic.service';

@Module({
    imports: [],
    controllers: [TrafficController],
    providers: [TrafficService],
    exports: [TrafficService],
})
export class TrafficModule { }
