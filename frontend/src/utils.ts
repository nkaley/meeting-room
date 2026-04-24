import { AxiosError } from 'axios';

export function extractApiError(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Неизвестная ошибка';
}

export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function fromLocalInputToISO(value: string): string {
  return new Date(value).toISOString();
}

export function formatUserName(user?: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
} | null): string {
  if (!user) return '—';
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  return user.email ?? '—';
}
