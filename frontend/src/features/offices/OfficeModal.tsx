import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/ToastProvider';
import { api } from '../../api';
import { extractApiError } from '../../utils';
import type { Office } from '../../types';

type Props = {
  open: boolean;
  onClose: () => void;
  office?: Office | null;
};

export function OfficeModal({ open, onClose, office }: Props) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(office?.name ?? '');
      setCity(office?.city ?? '');
      setAddress(office?.address ?? '');
      setError(null);
    }
  }, [open, office]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { name, city, address };
      if (office) {
        return api.patch(`/offices/${office.id}`, payload);
      }
      return api.post('/offices', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['offices'] });
      showToast(office ? 'Офис обновлён' : 'Офис создан', 'success');
      onClose();
    },
    onError: (err) => setError(extractApiError(err)),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  };

  return (
    <Modal open={open} onClose={onClose} title={office ? 'Редактировать офис' : 'Добавить офис'}>
      <form onSubmit={onSubmit} className="form">
        <label className="field">
          <span className="field__label">Название</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            required
          />
        </label>
        <label className="field">
          <span className="field__label">Город</span>
          <input
            className="input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span className="field__label">Адрес</span>
          <input
            className="input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </label>
        {error && <div className="alert alert--error">{error}</div>}
        <button type="submit" className="btn btn--primary" disabled={mutation.isPending}>
          Сохранить
        </button>
      </form>
    </Modal>
  );
}
