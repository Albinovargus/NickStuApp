import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase.js';

const BASE_URL = Capacitor.isNativePlatform()
  ? import.meta.env.VITE_API_BASE_URL_NATIVE
  : import.meta.env.VITE_API_BASE_URL;

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  // getSession() reads from local storage without server validation.
  // Safe here: we only extract the JWT to forward as a Bearer header.
  // The Fastify API validates the token server-side via jose + SUPABASE_JWT_SECRET.
  // For trusted user data on the frontend (display, role-based UI), use getUser() instead.
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({
      success: false,
      error: { code: 'UNKNOWN', message: res.statusText },
    }));
    throw error;
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
