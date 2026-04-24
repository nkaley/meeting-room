import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { ListBookingsDto, UpsertBookingDto } from './bookings.dto';

type SessionUser = { id: string; role: UserRole };

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: ListBookingsDto) {
    return this.prisma.booking.findMany({
      where: {
        ...(filters.dateFrom ? { startAt: { gte: new Date(filters.dateFrom) } } : {}),
        ...(filters.dateTo ? { endAt: { lte: new Date(filters.dateTo) } } : {}),
        ...(filters.roomId ? { roomId: filters.roomId } : {}),
        ...(filters.officeId ? { room: { officeId: filters.officeId } } : {}),
      },
      include: {
        room: {
          include: { office: { select: { id: true, name: true } } },
        },
        user: { select: { id: true, email: true } },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async create(dto: UpsertBookingDto, user: SessionUser) {
    const { startAt, endAt } = this.validateTimeRange(dto.startAt, dto.endAt);
    await this.ensureRoomBookable(dto.roomId);
    await this.ensureNoOverlap(dto.roomId, startAt, endAt);
    return this.prisma.booking.create({
      data: {
        roomId: dto.roomId,
        userId: user.id,
        startAt,
        endAt,
        description: dto.description,
      },
    });
  }

  async update(id: string, dto: UpsertBookingDto, user: SessionUser) {
    const existing = await this.prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Сущность не найдена');
    }
    this.assertCanManageBooking(existing.userId, user);

    const { startAt, endAt } = this.validateTimeRange(dto.startAt, dto.endAt);
    await this.ensureRoomBookable(dto.roomId);
    await this.ensureNoOverlap(dto.roomId, startAt, endAt, id);
    return this.prisma.booking.update({
      where: { id },
      data: {
        roomId: dto.roomId,
        startAt,
        endAt,
        description: dto.description,
      },
    });
  }

  async remove(id: string, user: SessionUser) {
    const existing = await this.prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Сущность не найдена');
    }
    this.assertCanManageBooking(existing.userId, user);
    await this.prisma.booking.delete({ where: { id } });
    return { message: 'OK' };
  }

  private validateTimeRange(startAtRaw: string, endAtRaw: string) {
    const startAt = new Date(startAtRaw);
    const endAt = new Date(endAtRaw);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Ошибка валидации');
    }
    if (endAt <= startAt) {
      throw new BadRequestException('Время окончания должно быть больше времени начала');
    }
    if (startAt < new Date()) {
      throw new BadRequestException('Нельзя выбрать прошедшее время');
    }
    return { startAt, endAt };
  }

  private assertCanManageBooking(ownerId: string, user: SessionUser) {
    if (ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Недостаточно прав для выполнения действия');
    }
  }

  private async ensureRoomBookable(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { office: true },
    });
    if (!room || !room.isActive || !room.office.isActive) {
      throw new BadRequestException('Сущность не найдена');
    }
    if (!room.isBookable) {
      throw new BadRequestException('Переговорка недоступна для бронирования');
    }
  }

  private async ensureNoOverlap(
    roomId: string,
    startAt: Date,
    endAt: Date,
    excludeBookingId?: string,
  ) {
    const overlap = await this.prisma.booking.findFirst({
      where: {
        roomId,
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });
    if (overlap) {
      throw new ConflictException('Комната уже забронирована на выбранное время');
    }
  }
}
