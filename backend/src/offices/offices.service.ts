import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UpsertOfficeDto } from './offices.dto';

@Injectable()
export class OfficesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.office.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: UpsertOfficeDto) {
    return this.prisma.office.create({ data: dto });
  }

  async update(id: string, dto: UpsertOfficeDto) {
    await this.getOrThrow(id);
    return this.prisma.office.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const rooms = await tx.room.findMany({
        where: { officeId: id, isActive: true },
        select: { id: true },
      });
      const roomIds = rooms.map((room) => room.id);
      if (roomIds.length > 0) {
        await tx.booking.deleteMany({
          where: {
            roomId: { in: roomIds },
            startAt: { gt: now },
          },
        });
        await tx.room.updateMany({
          where: { id: { in: roomIds } },
          data: { isActive: false },
        });
      }
      return tx.office.update({
        where: { id },
        data: { isActive: false },
      });
    });
  }

  private async getOrThrow(id: string) {
    const office = await this.prisma.office.findUnique({ where: { id } });
    if (!office) {
      throw new NotFoundException('Сущность не найдена');
    }
    return office;
  }
}
