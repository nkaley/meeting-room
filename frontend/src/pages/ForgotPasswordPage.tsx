import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api';
import { extractApiError } from '../utils';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => api.post('/auth/password-reset/request', { email }),
    onSuccess: () => {
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    },
    onError: (err) => setError(extractApiError(err)),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  };

  return (
    <div className="auth">
      <form className="card auth__card" onSubmit={onSubmit}>
        <h2 className="card__title">Восстановление пароля</h2>
        <p className="auth__hint">
          Укажите email, с которым вы регистрировались. Мы отправим код для сброса пароля.
        </p>
        <label className="field">
          <span className="field__label">Email</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        {error && <div className="alert alert--error">{error}</div>}
        <button type="submit" className="btn btn--primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Отправка...' : 'Отправить код'}
        </button>
        <div className="auth__links">
          <Link to="/login">Вернуться ко входу</Link>
          <Link to="/reset-password">У меня есть код</Link>
        </div>
      </form>
    </div>
  );
}
