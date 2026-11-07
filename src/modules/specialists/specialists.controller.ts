// src/specialists/specialists.controller.ts
import {
  Body, Controller, Get, Param, ParseUUIDPipe,
  Patch, Post, Put, UseGuards,
} from '@nestjs/common';
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
    // اصلاح نام متغیر به specialists
    return this.specialists.setWorkingHours(user.id, dto);
  }

  @Get(':id/working-hours')
  getWorkingHours(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    // اصلاح نام متغیر به specialists
    return this.specialists.getWorkingHours(id);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.specialists.findOne(id);
  }
}
