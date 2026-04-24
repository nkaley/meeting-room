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
    return this.prisma.office.update({
      where: { id },
      data: { isActive: false },
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
