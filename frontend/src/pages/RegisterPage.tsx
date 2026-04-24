import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api';
import { extractApiError } from '../utils';

export function RegisterPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () =>
      api.post('/auth/register', {
        email,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      }),
    onSuccess: () => {
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    },
    onError: (err) => setError(extractApiError(err)),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError('Введите имя и фамилию');
      return;
    }
    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Пароли не совпадают');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="auth">
      <form className="card auth__card" onSubmit={onSubmit}>
        <h2 className="card__title">Регистрация</h2>
        <div className="form__row">
          <label className="field">
            <span className="field__label">Имя</span>
            <input
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span className="field__label">Фамилия</span>
            <input
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </label>
        </div>
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
        <label className="field">
          <span className="field__label">Повторите пароль</span>
          <input
            className="input"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />
        </label>
        {error && <div className="alert alert--error">{error}</div>}
        <button type="submit" className="btn btn--primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Отправка...' : 'Зарегистрироваться'}
        </button>
        <div className="auth__links">
          <Link to="/login">Уже есть аккаунт? Войти</Link>
        </div>
      </form>
    </div>
  );
}
