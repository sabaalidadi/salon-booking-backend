import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { Category } from './entities/category.entity.js';

const DEFAULTS = [
  { icon: '💇‍♀️', label: 'مو' },
  { icon: '💅', label: 'ناخن' },
  { icon: '👁️', label: 'ابرو و مژه' },
  { icon: '💄', label: 'میکاپ و گریم' },
  { icon: '🧖‍♀️', label: 'پوست و فیشیال' },
  { icon: '✨', label: 'کلینیک زیبایی' },
  { icon: '🌿', label: 'ماساژ و اسپا' },
];

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  async onModuleInit() {
    if ((await this.repo.count()) === 0) {
      await this.repo.save(
        DEFAULTS.map((c, i) => this.repo.create({ ...c, sortOrder: i })),
      );
    }
  }

  findAll(): Promise<Category[]> {
    return this.repo.find({ order: { sortOrder: 'ASC', label: 'ASC' } });
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    if (await this.repo.findOneBy({ label: dto.label })) {
      throw new ConflictException('این دسته‌بندی قبلاً ثبت شده است');
    }
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const cat = await this.repo.findOneBy({ id });
    if (!cat) throw new NotFoundException('دسته‌بندی پیدا نشد');
    Object.assign(cat, dto);
    return this.repo.save(cat);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException('دسته‌بندی پیدا نشد');
  }
}
