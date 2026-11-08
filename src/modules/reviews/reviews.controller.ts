// src/modules/reviews/reviews.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto.js';

// پیشوند خالی: هر route آدرس کامل خودش را دارد
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ثبت نظر برای یک نوبت انجام‌شده (مشتری)
  @Post('reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.id, dto);
  }

  // لیست نظرهای یک متخصص (عمومی)
  @Get('specialists/:id/reviews')
  findBySpecialist(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() query: ListReviewsQueryDto,
  ) {
    return this.reviewsService.findBySpecialist(id, query);
  }
}