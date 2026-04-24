import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateSelectArg, EventClickArg, EventContentArg, EventInput } from '@fullcalendar/core';
import { Layout } from '../components/Layout';
import { api } from '../api';
import type { Booking, Office, Room } from '../types';
import { BookingModal } from '../features/bookings/BookingModal';
import { useToast } from '../components/ToastProvider';
import { formatUserName } from '../utils';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatEventTime(start?: Date | null, end?: Date | null) {
  if (!start || !end) return '';
  return `${pad(start.getHours())}:${pad(start.getMinutes())} – ${pad(end.getHours())}:${pad(
    end.getMinutes(),
  )}`;
}

function renderEventContent(arg: EventContentArg) {
  const booking = arg.event.extendedProps.booking as Booking | undefined;
  const time = formatEventTime(arg.event.start, arg.event.end);
  return (
    <div className="calendar-event">
      <div className="calendar-event__time">{time}</div>
      {booking?.room?.name && (
        <div className="calendar-event__room">{booking.room.name}</div>
      )}
      {booking?.description && (
        <div className="calendar-event__title">{booking.description}</div>
      )}
      {booking?.user && (
        <div className="calendar-event__author">{formatUserName(booking.user)}</div>
      )}
    </div>
  );
}

export function CalendarPage() {
  const [officeId, setOfficeId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [range, setRange] = useState<{ start: Date; end: Date } | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [creating, setCreating] = useState<{ start: Date; end: Date } | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);
  const { showToast } = useToast();

  const officesQuery = useQuery<Office[]>({
    queryKey: ['offices'],
    queryFn: async () => (await api.get<Office[]>('/offices')).data,
  });
  const offices = officesQuery.data ?? [];

  const roomsQuery = useQuery<Room[]>({
    queryKey: ['rooms', officeId || 'all'],
    queryFn: async () =>
      (await api.get<Room[]>(officeId ? `/rooms?officeId=${officeId}` : '/rooms')).data,
  });
  const rooms = roomsQuery.data ?? [];

  const bookingsQuery = useQuery<Booking[]>({
    queryKey: ['bookings', range?.start.toISOString(), range?.end.toISOString(), officeId, roomId],
    queryFn: async () => {
      if (!range) return [];
      const params = new URLSearchParams();
      params.set('dateFrom', range.start.toISOString());
      params.set('dateTo', range.end.toISOString());
      if (officeId) params.set('officeId', officeId);
      if (roomId) params.set('roomId', roomId);
      return (await api.get<Booking[]>(`/bookings?${params.toString()}`)).data;
    },
    enabled: Boolean(range),
  });
  const bookings = bookingsQuery.data ?? [];

  const events: EventInput[] = useMemo(
    () =>
      bookings.map((b) => ({
        id: b.id,
        title: b.description,
        start: b.startAt,
        end: b.endAt,
        extendedProps: { booking: b },
      })),
    [bookings],
  );

  const onSelect = (selection: DateSelectArg) => {
    selection.view.calendar.unselect();
    const now = new Date();
    if (selection.end <= now) {
      showToast('Нельзя создать бронь в прошлом', 'info');
      return;
    }
    const start = selection.start < now ? now : selection.start;
    const end = selection.end <= start ? new Date(start.getTime() + 60 * 60 * 1000) : selection.end;
    setCreating({ start, end });
  };

  const onEventClick = (click: EventClickArg) => {
    const booking = click.event.extendedProps.booking as Booking | undefined;
    if (booking) setActiveBooking(booking);
  };

  const openCreateNow = () => {
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setCreating({ start, end });
  };

  return (
    <Layout>
      <div className="calendar-page">
        <div className="filters">
          <label className="field">
            <span className="field__label">Офис</span>
            <select
              className="input"
              value={officeId}
              onChange={(e) => {
                setOfficeId(e.target.value);
                setRoomId('');
              }}
            >
              <option value="">Все</option>
              {offices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Переговорка</span>
            <select
              className="input"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            >
              <option value="">Все</option>
              {rooms
                .filter((r) => (officeId ? r.officeId === officeId : true))
                .map((r) => {
                  const officeName = r.office?.name;
                  return (
                    <option key={r.id} value={r.id}>
                      {officeName ? `${r.name} · ${officeName}` : r.name}
                    </option>
                  );
                })}
            </select>
          </label>
          <button type="button" className="btn btn--primary" onClick={openCreateNow}>
            Создать бронь
          </button>
        </div>

        <div className="card calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale="ru"
            firstDay={1}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay',
            }}
            buttonText={{ today: 'Сегодня', week: 'Неделя', day: 'День' }}
            allDaySlot={false}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            slotDuration="00:30:00"
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            slotLabelInterval="01:00:00"
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            dayHeaderFormat={{ weekday: 'short', day: '2-digit', month: '2-digit' }}
            nowIndicator
            scrollTime="09:00:00"
            expandRows
            selectable
            selectMirror
            select={onSelect}
            eventClick={onEventClick}
            events={events}
            eventContent={renderEventContent}
            height="auto"
            datesSet={(arg) => {
              setRange({ start: arg.start, end: arg.end });
            }}
          />
        </div>
      </div>

      <BookingModal
        open={creating !== null}
        onClose={() => setCreating(null)}
        initialRange={creating}
        offices={offices}
      />

      <BookingModal
        open={activeBooking !== null}
        booking={activeBooking}
        onClose={() => setActiveBooking(null)}
        offices={offices}
      />
    </Layout>
  );
}
