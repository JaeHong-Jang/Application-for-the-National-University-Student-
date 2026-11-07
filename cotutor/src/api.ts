// API 호출. 교사 키는 최초 ?k= 로 받아 localStorage에 두고 헤더로 보낸다.
const KEY_STORE = 'cotutor.teacherKey';

export function teacherKey(): string {
  const q = new URLSearchParams(location.search).get('k');
  if (q) localStorage.setItem(KEY_STORE, q);
  return localStorage.getItem(KEY_STORE) ?? '';
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public body: unknown) {
    super(message);
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
    headers: { 'content-type': 'application/json', 'x-teacher-key': teacherKey() },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string } | null)?.error ?? `요청 실패(${res.status})`, data);
  return data as T;
}
