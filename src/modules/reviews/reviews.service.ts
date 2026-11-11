// src/modules/reviews/reviews.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Review } from './entities/review.entity.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto.js';
import {
  Appointment,
  AppointmentStatus,
} from '../appointments/entities/appointment.entity.js';
import { SpecialistProfile } from '../specialists/entities/specialist-profile.entity.js';
import { UserRole } from '../users/entities/user.entity.js';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(SpecialistProfile)
    private readonly specialistRepo: Repository<SpecialistProfile>,
  ) {}

  // ثبت نظر توسط مشتری برای یک نوبت انجام‌شده
  async create(customerId: string, dto: CreateReviewDto) {
    // شرط customerId یعنی نوبتِ دیگران برای او «پیدا نشد» است
    const appointment = await this.appointmentRepo.findOne({
      where: { id: dto.appointmentId, customerId },
    });
    if (!appointment) {
      throw new NotFoundException('نوبت مورد نظر یافت نشد.');
    }

    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException(
        'فقط برای نوبت‌های انجام‌شده می‌توان نظر ثبت کرد.',
      );
    }

    const existing = await this.reviewRepo.findOneBy({
      appointmentId: appointment.id,
    });
    if (existing) {
      throw new ConflictException('برای این نوبت قبلاً نظر ثبت شده است.');
    }

    let saved: Review;
    try {
      saved = await this.reviewRepo.save(
        this.reviewRepo.create({
          appointmentId: appointment.id,
          customerId,
          specialistId: appointment.specialistId,
          rating: dto.rating,
          comment: dto.comment || null, // رشته‌ی خالی => null
        }),
      );
    } catch (error) {
      // اگر دو درخواست همزمان رسیده باشند، دیتابیس جلوی دومی را می‌گیرد
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('برای این نوبت قبلاً نظر ثبت شده است.');
      }
      throw error;
    }

    return {
      message: 'نظر شما با موفقیت ثبت شد.',
      data: {
        id: saved.id,
        appointmentId: saved.appointmentId,
        rating: saved.rating,
        comment: saved.comment,
        createdAt: saved.createdAt,
      },
    };
  }

  // لیست نظرهای همه‌ی متخصص‌های فعال (عمومی)
  async findAll(query: ListReviewsQueryDto) {
    const [reviews, totalReviews] = await this.reviewRepo.findAndCount({
      where: {
        specialist: { user: { role: UserRole.SPECIALIST, isActive: true } },
      },
      relations: { customer: true, specialist: { user: true } },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      page: query.page,
      limit: query.limit,
      totalReviews,
      totalPages: Math.ceil(totalReviews / query.limit),
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        customer: { fullName: review.customer.fullName },
        specialist: {
          id: review.specialistId,
          fullName: review.specialist.user.fullName,
        },
      })),
    };
  }

  // لیست نظرهای یک متخصص + میانگین و تعداد کل
  async findBySpecialist(specialistId: string, query: ListReviewsQueryDto) {
    const specialist = await this.specialistRepo.findOne({
      where: {
        id: specialistId,
        user: { role: UserRole.SPECIALIST, isActive: true },
      },
    });
    if (!specialist) throw new NotFoundException('Specialist not found');

    // میانگین و تعداد را خود دیتابیس حساب می‌کند
    const stats = await this.reviewRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.specialistId = :specialistId', { specialistId })
      .getRawOne<{ avg: string | null; count: string }>();

    const totalReviews = Number(stats?.count ?? 0);
    const averageRating =
      stats?.avg == null ? null : Math.round(Number(stats.avg) * 10) / 10;

    const reviews = await this.reviewRepo.find({
      where: { specialistId },
      relations: { customer: true },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      specialistId,
      averageRating,
      totalReviews,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(totalReviews / query.limit),
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        customer: { fullName: review.customer.fullName },
      })),
    };
  }
}