import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevelopmentOnlyGuard } from './development-only.guard.js';
import { SalonService } from './entities/salon-service.entity.js';
import { ServicesController } from './services.controller.js';
import { ServicesService } from './services.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([SalonService])],
  controllers: [ServicesController],
  providers: [ServicesService, DevelopmentOnlyGuard],
  exports: [ServicesService],
})
export class ServicesModule {}
