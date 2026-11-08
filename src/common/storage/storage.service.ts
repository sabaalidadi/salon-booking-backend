// src/common/storage/storage.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

// پوشه‌ی ذخیره‌ی فایل‌ها، کنار package.json (پروژه را از ریشه‌ی خودش اجرا کن)
export const UPLOADS_ROOT = join(process.cwd(), 'uploads');
// آدرسی که فایل‌ها با آن در دسترس هستند: http://localhost:3000/uploads/...
export const UPLOADS_URL_PREFIX = '/uploads/';

@Injectable()
export class StorageService {
  // یک عکس را ذخیره می‌کند و آدرس عمومی آن را برمی‌گرداند
  // مثال خروجی: "/uploads/avatars/3f2a....jpg"
  async saveImage(
    file: Express.Multer.File | undefined,
    folder: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('فایلی ارسال نشده است.');
    }

    // نوع واقعی فایل را از روی محتوایش تشخیص می‌دهیم، نه از اسم یا هدر کلاینت
    const ext = this.detectImageExtension(file.buffer);
    if (!ext) {
      throw new BadRequestException(
        'فقط تصاویر JPEG، PNG و WebP مجاز هستند.',
      );
    }

    const dir = join(UPLOADS_ROOT, folder);
    await mkdir(dir, { recursive: true }); // اگر پوشه نبود می‌سازد

    // اسم فایل را خودمان می‌سازیم؛ اسم ارسالی کاربر هرگز استفاده نمی‌شود
    const filename = `${randomUUID()}.${ext}`;
    await writeFile(join(dir, filename), file.buffer);

    return `${UPLOADS_URL_PREFIX}${folder}/${filename}`;
  }

  // فایل را با آدرس عمومی‌اش حذف می‌کند (اگر نبود، بی‌صدا رد می‌شود)
  async delete(publicPath: string | null | undefined): Promise<void> {
    if (!publicPath || !publicPath.startsWith(UPLOADS_URL_PREFIX)) return;

    const target = resolve(
      UPLOADS_ROOT,
      publicPath.slice(UPLOADS_URL_PREFIX.length),
    );

    // امنیت: هرگز بیرون از پوشه‌ی uploads چیزی را پاک نکن
    if (!target.startsWith(UPLOADS_ROOT + sep)) return;

    await unlink(target).catch(() => undefined);
  }

  // تشخیص نوع عکس از روی چند بایت اول فایل (Magic Bytes)
  private detectImageExtension(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
    // JPEG: FF D8 FF
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
      return 'jpg';
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (buf.length >= 8 && buf.subarray(0, 8).equals(pngSignature)) {
      return 'png';
    }

    // WebP: "RIFF" ... "WEBP"
    if (
      buf.length >= 12 &&
      buf.toString('ascii', 0, 4) === 'RIFF' &&
      buf.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return 'webp';
    }

    return null;
  }
}