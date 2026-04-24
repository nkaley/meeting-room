import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from './api';

function isAuthed() {
  return Boolean(localStorage.getItem('accessToken'));
}

function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="page">
      <header className="header">
        <h1>Meeting Rooms</h1>
        <button
          onClick={() => {
            localStorage.removeItem('accessToken');
            navigate('/login');
          }}
        >
          Выйти
        </button>
      </header>
      {children}
    </div>
  );
}

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const mutation = useMutation({
    mutationFn: async () => api.post('/auth/register', { email, password }),
    onSuccess: () => setMessage('Код подтверждения отправлен на email'),
  });
  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <h2>Регистрация</h2>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Пароль"
        type="password"
      />
      <button type="submit">Зарегистрироваться</button>
      <a href="/verify-email">Подтвердить email</a>
      {message && <p>{message}</p>}
    </form>
  );
}

function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const verifyMutation = useMutation({
    mutationFn: async () => api.post('/auth/verify-email', { email, code }),
    onSuccess: () => setMessage('Email подтвержден, можно входить'),
  });
  const resendMutation = useMutation({
    mutationFn: async () => api.post('/auth/resend-code', { email }),
    onSuccess: () => setMessage('Код отправлен повторно'),
  });
  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        verifyMutation.mutate();
      }}
    >
      <h2>Подтверждение email</h2>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Код" />
      <button type="submit">Подтвердить</button>
      <button
        type="button"
        onClick={() => {
          resendMutation.mutate();
        }}
      >
        Отправить код повторно
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: async () => api.post('/auth/login', { email, password }),
    onSuccess: (resp) => {
      localStorage.setItem('accessToken', resp.data.accessToken);
      navigate('/');
    },
    onError: () => setError('Не удалось войти'),
  });
  return (
    <form
      className="card"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <h2>Вход</h2>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Пароль"
        type="password"
      />
      <button type="submit">Войти</button>
      {error && <p>{error}</p>}
    </form>
  );
}

function CalendarPage() {
  const [roomId, setRoomId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [description, setDescription] = useState('');
  const bookings = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => (await api.get('/bookings')).data,
  });
  const createBooking = useMutation({
    mutationFn: async () => api.post('/bookings', { roomId, startAt, endAt, description }),
    onSuccess: () => bookings.refetch(),
  });

  return (
    <Layout>
      <div className="card">
        <h2>Календарь броней</h2>
        <p>Базовый MVP-список (вместо fullcalendar на первом шаге)</p>
        <ul>
          {(bookings.data ?? []).map((item: any) => (
            <li key={item.id}>
              {new Date(item.startAt).toLocaleString()} - {new Date(item.endAt).toLocaleString()} |{' '}
              {item.room?.name} | {item.description}
            </li>
          ))}
        </ul>
      </div>
      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          createBooking.mutate();
        }}
      >
        <h3>Создать бронь</h3>
        <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Room ID" />
        <input
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          placeholder="startAt ISO"
        />
        <input value={endAt} onChange={(e) => setEndAt(e.target.value)} placeholder="endAt ISO" />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание"
        />
        <button type="submit">Сохранить</button>
      </form>
    </Layout>
  );
}

function PrivateRoute({ children }: { children: JSX.Element }) {
  if (!isAuthed()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function App() {
  return (
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <CalendarPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
