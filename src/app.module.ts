    import { Module } from '@nestjs/common';
    import { ConfigModule, ConfigService } from '@nestjs/config';
    import { TypeOrmModule } from '@nestjs/typeorm';
    import * as JoiPackage from 'joi';
    import { ServicesModule } from './modules/services/services.module.js';

    const Joi = (JoiPackage as any).default || JoiPackage;

    @Module({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validationSchema: Joi.object({
            NODE_ENV: Joi.string()
              .valid('development', 'test', 'production')
              .default('development'),
            PORT: Joi.number().default(3000), // در صورت نیاز .port() را اضافه کنید
            DB_HOST: Joi.string().required(),
            DB_PORT: Joi.number().default(5432), // در صورت نیاز .port() را اضافه کنید
            DB_USER: Joi.string().required(),
            DB_PASSWORD: Joi.string().required(),
            DB_NAME: Joi.string().required(),
          }),
        }),
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            type: 'postgres' as const,
            host: config.get<string>('DB_HOST'), // دسترسی صحیح از طریق ConfigService
            port: config.get<number>('DB_PORT'), // دسترسی صحیح از طریق ConfigService
            username: config.get<string>('DB_USER'), // دسترسی صحیح از طریق ConfigService
            password: config.get<string>('DB_PASSWORD'), // دسترسی صحیح از طریق ConfigService
            database: config.get<string>('DB_NAME'), // دسترسی صحیح از طریق ConfigService
            autoLoadEntities: true,
            synchronize: config.get<string>('NODE_ENV') === 'development',
          }),
        }),
        ServicesModule,
      ],
    })
    export class AppModule {}
