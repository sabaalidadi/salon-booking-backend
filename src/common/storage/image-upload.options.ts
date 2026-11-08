// src/common/storage/image-upload.options.ts

// حداکثر حجم هر عکس: ۲ مگابایت
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

// تنظیماتی که به FileInterceptor داده می‌شود (در مرحله‌ی بعد)
export const IMAGE_UPLOAD_OPTIONS = {
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES, // بزرگ‌تر از این => خطای ۴۱۳
    files: 1, // فقط یک فایل در هر درخواست
  },
};