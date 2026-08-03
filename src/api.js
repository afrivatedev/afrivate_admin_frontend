const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const STORAGE_KEY = 'afrivate_admin_session';

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

async function refreshTokens() {
  const session = getSession();
  if (!session?.refresh_token) return null;
  const res = await fetch(`${BASE_URL}/api/admin/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) return null;
  const tokens = await res.json();
  setSession({ ...session, ...tokens });
  return tokens.access_token;
}

/** Authenticated fetch with one automatic refresh-and-retry on 401. */
export async function apiFetch(path, options = {}, retrying = false) {
  const session = getSession();
  const headers = { ...(options.headers || {}) };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && !retrying) {
    const newAccess = await refreshTokens();
    if (newAccess) return apiFetch(path, options, true);
    clearSession();
    window.location.hash = '#/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      detail = data.detail || JSON.stringify(data);
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  return res;
}

export async function apiGet(path) {
  return (await apiFetch(path)).json();
}

export async function apiSend(path, method, body) {
  return (await apiFetch(path, { method, body: JSON.stringify(body) })).json();
}

/** Download a CSV export (auth header required, so no plain <a href>). */
export async function apiDownload(path, filename) {
  const res = await apiFetch(path);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/admin/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.detail || data.non_field_errors?.[0] || 'Login failed.';
    throw new Error(msg);
  }
  setSession(data);
  return data.admin;
}
