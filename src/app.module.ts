import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SocialModule } from './social/social.module';
import { CardsModule } from './cards/cards.module';
import { SyncModule } from './sync/sync.module';
import { InventoryModule } from './inventory/inventory.module';
import { HomeModule } from './home/home.module';
import { PublicModule } from './public/public.module';
import { HealthModule } from './health/health.module';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    // Global rate limiting: 100 req/min per IP
    // Auth endpoints use stricter guard (30 req/min) — see JwtAuthGuard override
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    SocialModule,
    CardsModule,
    SyncModule,
    InventoryModule,
    HomeModule,
    PublicModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply throttling globally via APP_GUARD
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Serialize BigInt as string in all JSON responses
    {
      provide: APP_INTERCEPTOR,
      useClass: BigIntInterceptor,
    },
  ],
})
export class AppModule {}
