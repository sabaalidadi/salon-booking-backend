// src/specialists/specialists.controller.ts

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';
import { SpecialistsService } from './specialists.service.js';
import { CreateSpecialistProfileDto } from './dto/create-specialist-profile.dto.js';
import { UpdateSpecialistProfileDto } from './dto/update-specialist-profile.dto.js';
import { SetSpecialistServicesDto } from './dto/set-specialist-services.dto.js';
import { SetWorkingHoursDto } from './dto/set-working-hours.dto.js';
import { GetAvailabilityDto } from './dto/get-availability.dto.js';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IMAGE_UPLOAD_OPTIONS } from '../../common/storage/image-upload.options.js';

@Controller('specialists')
export class SpecialistsController {
  constructor(private readonly specialists: SpecialistsService) {}

  @Get()
  findAll() {
    return this.specialists.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPECIALIST)
  mine(@CurrentUser() user: { id: string }) {
    return this.specialists.mine(user.id);
  }

  @Post('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPECIALIST)
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateSpecialistProfileDto,
  ) {
    return this.specialists.create(user.id, dto);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPECIALIST)
  update(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateSpecialistProfileDto,
  ) {
    return this.specialists.update(user.id, dto);
  }

  @Put(':id/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  setServices(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: SetSpecialistServicesDto,
  ) {
    return this.specialists.setServices(id, dto.serviceIds);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllForAdmin() {
    return this.specialists.findAllForAdmin();
  }

  @Put('me/working-hours')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPECIALIST)
  setWorkingHours(
    @CurrentUser() user: { id: string },
    @Body() dto: SetWorkingHoursDto,
  ) {
    return this.specialists.setWorkingHours(user.id, dto);
  }

    // آپلود یا جایگزینی عکس پروفایل (فرم multipart با فیلد "file")
  @Put('me/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPECIALIST)
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  setAvatar(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.specialists.setAvatar(user.id, file);
  }

  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SPECIALIST)
  removeAvatar(@CurrentUser() user: { id: string }) {
    return this.specialists.removeAvatar(user.id);
  }

  // اسلات‌های خالی یک متخصص در یک روز، برای یک سرویس مشخص
  @Get(':id/availability')
  getAvailability(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() query: GetAvailabilityDto,
  ) {
    return this.specialists.getAvailability(id, query);
  }

  @Get(':id/working-hours')
  getWorkingHours(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.specialists.getWorkingHours(id);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.specialists.findOne(id);
  }
}