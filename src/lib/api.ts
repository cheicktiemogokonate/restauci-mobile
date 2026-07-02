import { API_URL } from '@/constants/api';
import { useStore } from '@/store';

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = useStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let err: { error?: string } = {};
    try {
      err = (await res.json()) as { error?: string };
    } catch {
      // réponse non JSON
    }
    throw new Error(err.error ?? `Erreur ${res.status}`);
  }

  return res.json() as T;
}
