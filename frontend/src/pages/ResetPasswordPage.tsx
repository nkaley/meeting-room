import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api';
import { extractApiError } from '../utils';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () =>
      api.post('/auth/password-reset/confirm', { email, code, newPassword: password }),
    onSuccess: () => {
      setInfo('Пароль обновлён. Перенаправляем на вход...');
      setTimeout(() => navigate('/login'), 800);
    },
    onError: (err) => setError(extractApiError(err)),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }
    if (password !== passwordRepeat) {
      setError('Пароли не совпадают');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="auth">
      <form className="card auth__card" onSubmit={onSubmit}>
        <h2 className="card__title">Сброс пароля</h2>
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
        <label className="field">
          <span className="field__label">Код из письма</span>
          <input
            className="input"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            required
          />
        </label>
        <label className="field">
          <span className="field__label">Новый пароль</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
        <label className="field">
          <span className="field__label">Повторите пароль</span>
          <input
            className="input"
            type="password"
            value={passwordRepeat}
            onChange={(e) => setPasswordRepeat(e.target.value)}
            minLength={8}
            required
          />
        </label>
        {error && <div className="alert alert--error">{error}</div>}
        {info && <div className="alert alert--info">{info}</div>}
        <button type="submit" className="btn btn--primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Сохраняем...' : 'Сохранить новый пароль'}
        </button>
        <div className="auth__links">
          <Link to="/forgot-password">Запросить новый код</Link>
          <Link to="/login">Ко входу</Link>
        </div>
      </form>
    </div>
  );
}
