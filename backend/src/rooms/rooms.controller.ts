import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { AppRole } from '../common/roles';
import { RolesGuard } from '../common/roles.guard';
import { UpsertRoomDto } from './rooms.dto';
import { RoomsService } from './rooms.service';

@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  list(@Query('officeId') officeId?: string) {
    return this.roomsService.list(officeId);
  }

  @UseGuards(RolesGuard)
  @Roles(AppRole.ADMIN)
  @Post()
  create(@Body() dto: UpsertRoomDto) {
    return this.roomsService.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(AppRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpsertRoomDto) {
    return this.roomsService.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(AppRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }
}
