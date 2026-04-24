import { Modal } from './Modal';

type Props = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
};

export function ConfirmDialog({
  open,
  title = 'Подтверждение',
  message,
  confirmLabel = 'Удалить',
  cancelLabel = 'Отмена',
  variant = 'danger',
  onConfirm,
  onCancel,
  busy = false,
}: Props) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="confirm">
        <p className="confirm__message">{message}</p>
        <div className="confirm__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={variant === 'danger' ? 'btn btn--danger' : 'btn btn--primary'}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
