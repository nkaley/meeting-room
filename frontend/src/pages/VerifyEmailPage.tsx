import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api';
import { extractApiError } from '../utils';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const timerRef = useRef<number | null>(null);

  const verifyMutation = useMutation({
    mutationFn: async () => api.post('/auth/verify-email', { email, code }),
    onSuccess: () => {
      setInfo('Email подтвержден. Перенаправляем на вход...');
      setTimeout(() => navigate('/login'), 800);
    },
    onError: (err) => setError(extractApiError(err)),
  });

  const resendMutation = useMutation({
    mutationFn: async () => api.post('/auth/resend-code', { email }),
    onSuccess: () => {
      setInfo('Код отправлен повторно');
      startCooldown(60);
    },
    onError: (err) => setError(extractApiError(err)),
  });

  const startCooldown = (seconds: number) => {
    setCooldownLeft(seconds);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setCooldownLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    verifyMutation.mutate();
  };

  return (
    <div className="auth">
      <form className="card auth__card" onSubmit={onSubmit}>
        <h2 className="card__title">Подтверждение email</h2>
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
        {error && <div className="alert alert--error">{error}</div>}
        {info && <div className="alert alert--info">{info}</div>}
        <button type="submit" className="btn btn--primary" disabled={verifyMutation.isPending}>
          {verifyMutation.isPending ? 'Проверка...' : 'Подтвердить'}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => resendMutation.mutate()}
          disabled={cooldownLeft > 0 || resendMutation.isPending || !email}
        >
          {cooldownLeft > 0 ? `Отправить код повторно (${cooldownLeft})` : 'Отправить код повторно'}
        </button>
      </form>
    </div>
  );
}
