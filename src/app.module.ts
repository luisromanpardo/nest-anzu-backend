import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    SocialModule,
    CardsModule,
    SyncModule,
    InventoryModule,
    HomeModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
