import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { SalonService } from './entities/salon-service.entity.js';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(SalonService)
    private readonly servicesRepository: Repository<SalonService>,
  ) {}

  create(dto: CreateServiceDto): Promise<SalonService> {
    const service = this.servicesRepository.create(dto);
    return this.servicesRepository.save(service);
  }

  findAll(): Promise<SalonService[]> {
    return this.servicesRepository.find({
      where: { isActive: true },
      order: { title: 'ASC' },
    });
  }

  async findOne(id: string): Promise<SalonService> {
    const service = await this.servicesRepository.findOneBy({
      id,
      isActive: true,
    });

    if (!service) {
      throw new NotFoundException('خدمت پیدا نشد');
    }

    return service;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<SalonService> {
    const service = await this.servicesRepository.findOneBy({ id });

    if (!service) {
      throw new NotFoundException('خدمت پیدا نشد');
    }

    Object.assign(service, dto);
    return this.servicesRepository.save(service);
  }

  async remove(id: string): Promise<void> {
    const service = await this.servicesRepository.findOneBy({ id });

    if (!service) {
      throw new NotFoundException('خدمت پیدا نشد');
    }

    await this.servicesRepository.softDelete(id);
  }
}
