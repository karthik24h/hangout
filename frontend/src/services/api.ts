const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
}

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${apiUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

export async function signup(data: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await apiFetch('/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json();
    const messages = Array.isArray(body.details)
      ? body.details
          .map((detail: { message?: unknown } | null) => detail?.message)
          .filter((message: unknown): message is string => typeof message === 'string' && !!message)
      : [];
    throw new Error(messages.join('. ') || body.error || 'Signup failed');
  }
  return res.json();
}

export async function login(data: {
  email: string;
  password: string;
  rememberMe?: boolean;
}): Promise<AuthResponse> {
  const res = await apiFetch('/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
  return res.json();
}

export async function logout(): Promise<void> {
  await apiFetch('/logout', { method: 'POST' });
}

export async function getCurrentUser(): Promise<User | null> {
  const res = await apiFetch('/me');
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to get current user');
  const data = await res.json();
  return data.user;
}
