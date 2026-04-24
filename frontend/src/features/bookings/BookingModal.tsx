import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/ToastProvider';
import { api } from '../../api';
import { extractApiError, formatUserName, fromLocalInputToISO, toLocalInputValue } from '../../utils';
import type { Booking, Office, Room } from '../../types';
import { useAuth } from '../../auth/AuthContext';

type Mode = 'create' | 'view';

type Props = {
  open: boolean;
  onClose: () => void;
  booking?: Booking | null;
  initialRange?: { start: Date; end: Date } | null;
  offices: Office[];
};

const ONE_HOUR_MS = 60 * 60 * 1000;

export function BookingModal({ open, onClose, booking, initialRange, offices }: Props) {
  const { me } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const mode: Mode = booking ? 'view' : 'create';
  const [editMode, setEditMode] = useState(false);

  const [officeId, setOfficeId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const roomsQuery = useQuery<Room[]>({
    queryKey: ['rooms', officeId || 'all'],
    queryFn: async () =>
      (await api.get<Room[]>(officeId ? `/rooms?officeId=${officeId}` : '/rooms')).data,
    enabled: open,
  });
  const rooms = roomsQuery.data ?? [];
  const availableRooms = useMemo(
    () => rooms.filter((r) => r.isActive && r.isBookable),
    [rooms],
  );

  useEffect(() => {
    if (!open) return;
    setError(null);
    setConfirmDelete(false);
    if (booking) {
      setEditMode(false);
      setOfficeId(booking.room?.office?.id ?? '');
      setRoomId(booking.roomId);
      setStartAt(toLocalInputValue(new Date(booking.startAt)));
      setEndAt(toLocalInputValue(new Date(booking.endAt)));
      setDescription(booking.description);
    } else {
      setEditMode(true);
      const now = new Date();
      const start = initialRange?.start && initialRange.start >= now ? initialRange.start : now;
      const end = initialRange?.end && initialRange.end > start
        ? initialRange.end
        : new Date(start.getTime() + ONE_HOUR_MS);
      setOfficeId(offices[0]?.id ?? '');
      setRoomId('');
      setStartAt(toLocalInputValue(start));
      setEndAt(toLocalInputValue(end));
      setDescription('');
    }
  }, [open, booking, initialRange, offices]);

  const canManage =
    Boolean(booking) && Boolean(me) && (me!.role === 'ADMIN' || me!.id === booking!.userId);

  const isEditing = mode === 'create' || editMode;

  const validation = useMemo(() => {
    if (!isEditing) return { ok: true, message: '' };
    if (!startAt || !endAt) return { ok: false, message: 'Укажите дату и время' };
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return { ok: false, message: 'Некорректные дата или время' };
    }
    if (endDate <= startDate) {
      return { ok: false, message: 'Время окончания должно быть больше времени начала' };
    }
    if (startDate < new Date()) {
      return { ok: false, message: 'Нельзя создать бронь в прошлом' };
    }
    if (!officeId) return { ok: false, message: 'Выберите офис' };
    if (!roomId) return { ok: false, message: 'Выберите переговорку' };
    if (!description.trim()) return { ok: false, message: 'Описание обязательно' };
    return { ok: true, message: '' };
  }, [isEditing, startAt, endAt, officeId, roomId, description]);

  const onStartChange = (value: string) => {
    setStartAt(value);
    if (!value) return;
    const newStart = new Date(value);
    const currentEnd = endAt ? new Date(endAt) : null;
    if (!currentEnd || currentEnd <= newStart) {
      const newEnd = new Date(newStart.getTime() + ONE_HOUR_MS);
      setEndAt(toLocalInputValue(newEnd));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        roomId,
        startAt: fromLocalInputToISO(startAt),
        endAt: fromLocalInputToISO(endAt),
        description,
      };
      if (booking) {
        return api.patch(`/bookings/${booking.id}`, payload);
      }
      return api.post('/bookings', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      showToast(booking ? 'Бронь обновлена' : 'Бронь создана', 'success');
      onClose();
    },
    onError: (err) => {
      const message = extractApiError(err);
      setError(message);
      showToast(message, 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/bookings/${booking!.id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      showToast('Бронь удалена', 'success');
      onClose();
    },
    onError: (err) => {
      const message = extractApiError(err);
      setError(message);
      showToast(message, 'error');
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    saveMutation.mutate();
  };

  const title = mode === 'create' ? 'Создать бронь' : editMode ? 'Редактировать бронь' : 'Бронь';
  const isReadonly = !isEditing;
  const saveDisabled = !validation.ok || saveMutation.isPending;
  const inlineHint = isEditing && !validation.ok ? validation.message : null;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={onSubmit} className="form">
        <div className="form__row">
          <label className="field">
            <span className="field__label">Дата и время начала</span>
            <input
              className="input"
              type="datetime-local"
              value={startAt}
              onChange={(e) => onStartChange(e.target.value)}
              disabled={isReadonly}
              required
            />
          </label>
          <label className="field">
            <span className="field__label">Дата и время окончания</span>
            <input
              className="input"
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              disabled={isReadonly}
              required
            />
          </label>
        </div>
        <label className="field">
          <span className="field__label">Офис</span>
          <select
            className="input"
            value={officeId}
            onChange={(e) => {
              setOfficeId(e.target.value);
              setRoomId('');
            }}
            disabled={isReadonly}
            required
          >
            <option value="" disabled>
              Выберите офис
            </option>
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
            disabled={isReadonly || !officeId}
            required
          >
            <option value="" disabled>
              Выберите переговорку
            </option>
            {availableRooms
              .filter((r) => (officeId ? r.officeId === officeId : true))
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Описание / тема встречи</span>
          <textarea
            className="input input--area"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isReadonly}
            required
          />
        </label>
        {mode === 'view' && booking?.user && (
          <div className="field">
            <span className="field__label">Автор</span>
            <div className="field__readonly">
              {formatUserName(booking.user)}
              {booking.user.email && (
                <span className="field__readonly-meta"> · {booking.user.email}</span>
              )}
            </div>
          </div>
        )}
        {inlineHint && <div className="alert alert--info">{inlineHint}</div>}
        {error && <div className="alert alert--error">{error}</div>}
        <div className="form__actions">
          {mode === 'create' && (
            <button type="submit" className="btn btn--primary" disabled={saveDisabled}>
              Сохранить
            </button>
          )}
          {mode === 'view' && !editMode && canManage && (
            <>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setEditMode(true)}
              >
                Редактировать
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => setConfirmDelete(true)}
                disabled={deleteMutation.isPending}
              >
                Удалить
              </button>
            </>
          )}
          {mode === 'view' && editMode && (
            <button type="submit" className="btn btn--primary" disabled={saveDisabled}>
              Сохранить
            </button>
          )}
        </div>
      </form>
      <ConfirmDialog
        open={confirmDelete}
        title="Удалить бронь?"
        message="Бронь будет удалена безвозвратно."
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteMutation.mutate();
        }}
        busy={deleteMutation.isPending}
      />
    </Modal>
  );
}
