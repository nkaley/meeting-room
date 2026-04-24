import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { AppRole } from '../common/roles';
import { RolesGuard } from '../common/roles.guard';
import { UpsertOfficeDto } from './offices.dto';
import { OfficesService } from './offices.service';

@UseGuards(JwtAuthGuard)
@Controller('offices')
export class OfficesController {
  constructor(private readonly officesService: OfficesService) {}

  @Get()
  list() {
    return this.officesService.list();
  }

  @UseGuards(RolesGuard)
  @Roles(AppRole.ADMIN)
  @Post()
  create(@Body() dto: UpsertOfficeDto) {
    return this.officesService.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(AppRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpsertOfficeDto) {
    return this.officesService.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(AppRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.officesService.remove(id);
  }
}
