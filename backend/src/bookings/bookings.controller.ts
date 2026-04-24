import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { ListBookingsDto, UpsertBookingDto } from './bookings.dto';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  list(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: ListBookingsDto,
  ) {
    return this.bookingsService.list(query);
  }

  @Post()
  create(
    @Body() dto: UpsertBookingDto,
    @Req() req: { user: { id: string; role: UserRole } },
  ) {
    return this.bookingsService.create(dto, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpsertBookingDto,
    @Req() req: { user: { id: string; role: UserRole } },
  ) {
    return this.bookingsService.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: { user: { id: string; role: UserRole } },
  ) {
    return this.bookingsService.remove(id, req.user);
  }
}
