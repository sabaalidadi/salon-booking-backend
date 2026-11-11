import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevelopmentOnlyGuard } from './development-only.guard.js';
import { SalonService } from './entities/salon-service.entity.js';
import { ServicesController } from './services.controller.js';
import { ServicesService } from './services.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { StorageModule } from '../../common/storage/storage.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([SalonService]), AuthModule, StorageModule],
  controllers: [ServicesController],
  providers: [ServicesService, DevelopmentOnlyGuard],
  exports: [ServicesService],
})
export class ServicesModule {}
