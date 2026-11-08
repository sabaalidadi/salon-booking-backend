// src/common/storage/storage.module.ts
import { Module } from '@nestjs/common';
import { StorageService } from './storage.service.js';

@Module({
  providers: [StorageService],
  exports: [StorageService], // ماژول‌های دیگر می‌توانند از آن استفاده کنند
})
export class StorageModule {}