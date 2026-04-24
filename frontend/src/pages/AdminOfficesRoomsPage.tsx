import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { api } from '../api';
import type { Office, Room } from '../types';
import { OfficeModal } from '../features/offices/OfficeModal';
import { RoomModal } from '../features/rooms/RoomModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/ToastProvider';
import { extractApiError } from '../utils';

type Tab = 'offices' | 'rooms';

type PendingDelete =
  | { type: 'office'; office: Office }
  | { type: 'room'; room: Room }
  | null;

export function AdminOfficesRoomsPage() {
  const [tab, setTab] = useState<Tab>('offices');
  const [officeModal, setOfficeModal] = useState<{ open: boolean; office: Office | null }>({
    open: false,
    office: null,
  });
  const [roomModal, setRoomModal] = useState<{ open: boolean; room: Room | null }>({
    open: false,
    room: null,
  });
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const officesQuery = useQuery<Office[]>({
    queryKey: ['offices'],
    queryFn: async () => (await api.get<Office[]>('/offices')).data,
  });
  const roomsQuery = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => (await api.get<Room[]>('/rooms')).data,
  });

  const offices = officesQuery.data ?? [];
  const rooms = roomsQuery.data ?? [];

  const deleteOffice = useMutation({
    mutationFn: async (id: string) => api.delete(`/offices/${id}`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['offices'] }),
        queryClient.invalidateQueries({ queryKey: ['rooms'] }),
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
      ]);
      showToast('Офис удалён', 'success');
    },
    onError: (err) => showToast(extractApiError(err), 'error'),
  });

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => api.delete(`/rooms/${id}`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['rooms'] }),
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
      ]);
      showToast('Переговорка удалена', 'success');
    },
    onError: (err) => showToast(extractApiError(err), 'error'),
  });

  const officesById = useMemo(() => new Map(offices.map((o) => [o.id, o])), [offices]);

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'office') {
      deleteOffice.mutate(pendingDelete.office.id, {
        onSettled: () => setPendingDelete(null),
      });
    } else {
      deleteRoom.mutate(pendingDelete.room.id, {
        onSettled: () => setPendingDelete(null),
      });
    }
  };

  const isDeleting =
    (pendingDelete?.type === 'office' && deleteOffice.isPending) ||
    (pendingDelete?.type === 'room' && deleteRoom.isPending);

  return (
    <Layout>
      <div className="admin">
        <div className="admin__header">
          <h1 className="admin__title">Офисы и переговорки</h1>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              if (tab === 'offices') setOfficeModal({ open: true, office: null });
              else setRoomModal({ open: true, room: null });
            }}
            disabled={tab === 'rooms' && offices.length === 0}
          >
            Добавить
          </button>
        </div>

        <div className="tabs">
          <button
            className={tab === 'offices' ? 'tab tab--active' : 'tab'}
            onClick={() => setTab('offices')}
            type="button"
          >
            Офисы
            <span className="tab__counter">{offices.length}</span>
          </button>
          <button
            className={tab === 'rooms' ? 'tab tab--active' : 'tab'}
            onClick={() => setTab('rooms')}
            type="button"
          >
            Переговорки
            <span className="tab__counter">{rooms.length}</span>
          </button>
        </div>

        {tab === 'offices' &&
          (offices.length === 0 ? (
            <div className="empty">
              <h3>Добавьте офисы</h3>
              <p>После этого можно будет создавать переговорки.</p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setOfficeModal({ open: true, office: null })}
              >
                Добавить
              </button>
            </div>
          ) : (
            <ul className="list">
              {offices.map((office) => (
                <li key={office.id} className="list__item">
                  <div className="list__info">
                    <div className="list__title">{office.name}</div>
                    <div className="list__meta">
                      {office.city} · {office.address}
                    </div>
                  </div>
                  <div className="list__actions">
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => setOfficeModal({ open: true, office })}
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() => setPendingDelete({ type: 'office', office })}
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ))}

        {tab === 'rooms' &&
          (rooms.length === 0 ? (
            <div className="empty">
              <h3>Добавьте переговорки</h3>
              <p>Сотрудники смогут бронировать их при создании встреч в календаре.</p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setRoomModal({ open: true, room: null })}
                disabled={offices.length === 0}
              >
                Добавить
              </button>
              {offices.length === 0 && (
                <div className="empty__hint">Сначала создайте офис во вкладке «Офисы».</div>
              )}
            </div>
          ) : (
            <ul className="list">
              {rooms.map((room) => {
                const officeName = room.office?.name ?? officesById.get(room.officeId)?.name ?? '—';
                const metaParts: string[] = [];
                if (room.floor) metaParts.push(`этаж ${room.floor}`);
                if (room.capacity) metaParts.push(`до ${room.capacity} чел.`);
                return (
                  <li key={room.id} className="list__item">
                    <div className="list__info">
                      <div className="list__title">
                        {room.name}
                        <span
                          className={
                            room.isBookable
                              ? 'badge badge--success'
                              : 'badge badge--muted'
                          }
                        >
                          {room.isBookable ? 'доступна' : 'недоступна'}
                        </span>
                      </div>
                      <div className="list__meta">
                        <span className="badge badge--office">{officeName}</span>
                        {metaParts.length > 0 && (
                          <span className="list__meta-dot">{metaParts.join(' · ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="list__actions">
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => setRoomModal({ open: true, room })}
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger"
                        onClick={() => setPendingDelete({ type: 'room', room })}
                      >
                        Удалить
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ))}
      </div>

      <OfficeModal
        open={officeModal.open}
        office={officeModal.office}
        onClose={() => setOfficeModal({ open: false, office: null })}
      />
      <RoomModal
        open={roomModal.open}
        room={roomModal.room}
        offices={offices}
        onClose={() => setRoomModal({ open: false, room: null })}
      />

      <ConfirmDialog
        open={pendingDelete?.type === 'office'}
        title="Удалить офис?"
        message="Все связанные переговорки также будут недоступны."
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        busy={isDeleting}
      />
      <ConfirmDialog
        open={pendingDelete?.type === 'room'}
        title="Удалить переговорку?"
        message="Она больше не будет доступна для бронирования."
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        busy={isDeleting}
      />
    </Layout>
  );
}
