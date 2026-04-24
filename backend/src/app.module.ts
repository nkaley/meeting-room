import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { BookingsController } from './bookings/bookings.controller';
import { BookingsService } from './bookings/bookings.service';
import { OfficesController } from './offices/offices.controller';
import { OfficesService } from './offices/offices.service';
import { PrismaService } from './common/prisma.service';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { RolesGuard } from './common/roles.guard';
import { RoomsController } from './rooms/rooms.controller';
import { RoomsService } from './rooms/rooms.service';
import { MailService } from './mail/mail.service';
import { JwtStrategy } from './common/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'change_me',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
    }),
  ],
  controllers: [
    AuthController,
    OfficesController,
    RoomsController,
    BookingsController,
  ],
  providers: [
    PrismaService,
    AuthService,
    OfficesService,
    RoomsService,
    BookingsService,
    MailService,
    JwtAuthGuard,
    RolesGuard,
    JwtStrategy,
  ],
})
export class AppModule {}
