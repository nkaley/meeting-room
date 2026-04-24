import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { extractApiError } from '../utils';

export function LoginPage() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => api.post('/auth/login', { email, password }),
    onSuccess: (resp) => {
      setAuth(resp.data.accessToken, resp.data.user);
      navigate('/');
    },
    onError: (err) => {
      const message = extractApiError(err);
      setError(message);
      if (message.toLowerCase().includes('подтвердите email')) {
        setTimeout(() => navigate(`/verify-email?email=${encodeURIComponent(email)}`), 1200);
      }
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  };

  return (
    <div className="auth">
      <form className="card auth__card" onSubmit={onSubmit}>
        <h2 className="card__title">Вход</h2>
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
          <span className="field__label">Пароль</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <div className="alert alert--error">{error}</div>}
        <button type="submit" className="btn btn--primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Вход...' : 'Войти'}
        </button>
        <div className="auth__links">
          <Link to="/register">Нет аккаунта? Зарегистрироваться</Link>
          <Link to="/forgot-password">Забыли пароль?</Link>
        </div>
      </form>
    </div>
  );
}
