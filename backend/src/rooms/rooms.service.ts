import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UpsertRoomDto } from './rooms.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  list(officeId?: string) {
    return this.prisma.room.findMany({
      where: { isActive: true, ...(officeId ? { officeId } : {}) },
      include: { office: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: UpsertRoomDto) {
    return this.prisma.room.create({ data: dto });
  }

  async update(id: string, dto: UpsertRoomDto) {
    await this.getOrThrow(id);
    return this.prisma.room.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    return this.prisma.room.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async getOrThrow(id: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) {
      throw new NotFoundException('Сущность не найдена');
    }
    return room;
  }
}
