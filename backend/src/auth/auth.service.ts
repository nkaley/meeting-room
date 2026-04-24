import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../common/prisma.service';
import { LoginDto, RegisterDto, ResendCodeDto, VerifyEmailDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  private assertAllowedDomain(email: string) {
    const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
    if (!allowedDomain) {
      return;
    }
    const [, domain] = email.split('@');
    if (!domain || domain.toLowerCase() !== allowedDomain.toLowerCase()) {
      throw new BadRequestException(
        'Разрешена регистрация только с корпоративной почты',
      );
    }
  }

  private generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async register(payload: RegisterDto) {
    this.assertAllowedDomain(payload.email);
    const existing = await this.prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: payload.email.toLowerCase(),
        passwordHash,
        emailVerified: false,
      },
    });

    const code = this.generateCode();
    const ttlMinutes = Number(process.env.EMAIL_CODE_TTL_MINUTES ?? 10);
    await this.prisma.emailVerificationCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
      },
    });
    await this.mailService.sendVerificationCode(user.email, code);
    return { message: 'Код подтверждения отправлен на email' };
  }

  async verifyEmail(payload: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });
    if (!user) {
      throw new BadRequestException('Неверный код подтверждения');
    }

    const code = await this.prisma.emailVerificationCode.findFirst({
      where: {
        userId: user.id,
        code: payload.code,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!code) {
      throw new BadRequestException('Неверный код подтверждения');
    }

    const firstVerifiedCount = await this.prisma.user.count({
      where: { emailVerified: true },
    });
    const role = firstVerifiedCount === 0 ? UserRole.ADMIN : UserRole.USER;

    await this.prisma.$transaction([
      this.prisma.emailVerificationCode.update({
        where: { id: code.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, role },
      }),
    ]);
    return { message: 'Email подтвержден' };
  }

  async resendCode(payload: ResendCodeDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });
    if (!user) {
      return { message: 'Код отправлен повторно' };
    }

    const cooldownSeconds = Number(
      process.env.EMAIL_CODE_RESEND_COOLDOWN_SECONDS ?? 60,
    );
    const lastCode = await this.prisma.emailVerificationCode.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (
      lastCode &&
      Date.now() - lastCode.createdAt.getTime() < cooldownSeconds * 1000
    ) {
      throw new BadRequestException('Повторная отправка доступна позже');
    }

    const code = this.generateCode();
    const ttlMinutes = Number(process.env.EMAIL_CODE_TTL_MINUTES ?? 10);
    await this.prisma.emailVerificationCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
      },
    });
    await this.mailService.sendVerificationCode(user.email, code);
    return { message: 'Код отправлен повторно' };
  }

  async login(payload: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    if (!user.emailVerified) {
      throw new UnauthorizedException('Email не подтвержден');
    }

    const accessToken = await this.jwtService.signAsync({ sub: user.id });
    return {
      accessToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
