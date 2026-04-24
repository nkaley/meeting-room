import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/ToastProvider';
import { api } from '../../api';
import { extractApiError } from '../../utils';
import type { Office, Room } from '../../types';

type Props = {
  open: boolean;
  onClose: () => void;
  room?: Room | null;
  offices: Office[];
};

export function RoomModal({ open, onClose, room, offices }: Props) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [officeId, setOfficeId] = useState<string>('');
  const [floor, setFloor] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [isBookable, setIsBookable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(room?.name ?? '');
      setOfficeId(room?.officeId ?? offices[0]?.id ?? '');
      setFloor(room?.floor ?? '');
      setCapacity(room?.capacity != null ? String(room.capacity) : '');
      setDescription(room?.description ?? '');
      setIsBookable(room ? room.isBookable : true);
      setError(null);
    }
  }, [open, room, offices]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name,
        officeId,
        isBookable,
      };
      if (floor.trim()) payload.floor = floor.trim();
      if (capacity.trim()) payload.capacity = Number(capacity);
      if (description.trim()) payload.description = description.trim();
      if (room) {
        return api.patch(`/rooms/${room.id}`, payload);
      }
      return api.post('/rooms', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['rooms'] });
      showToast(room ? 'Переговорка обновлена' : 'Переговорка создана', 'success');
      onClose();
    },
    onError: (err) => setError(extractApiError(err)),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!officeId) {
      setError('Выберите офис');
      return;
    }
    mutation.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={room ? 'Редактировать переговорку' : 'Добавить переговорку'}
    >
      <form onSubmit={onSubmit} className="form">
        <label className="field">
          <span className="field__label">Название</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span className="field__label">Офис</span>
          <select
            className="input"
            value={officeId}
            onChange={(e) => setOfficeId(e.target.value)}
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
          <span className="field__label">Этаж</span>
          <input className="input" value={floor} onChange={(e) => setFloor(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Вместимость, чел.</span>
          <input
            className="input"
            inputMode="numeric"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </label>
        <label className="field">
          <span className="field__label">Описание</span>
          <textarea
            className="input input--area"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="field field--row">
          <input
            type="checkbox"
            checked={isBookable}
            onChange={(e) => setIsBookable(e.target.checked)}
          />
          <span>Переговорка доступна для бронирования</span>
        </label>
        {error && <div className="alert alert--error">{error}</div>}
        <button type="submit" className="btn btn--primary" disabled={mutation.isPending}>
          Сохранить
        </button>
      </form>
    </Modal>
  );
}
