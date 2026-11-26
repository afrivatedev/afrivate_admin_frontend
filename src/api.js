/**
 * Admin API client.
 *
 * Sessions live in HttpOnly cookies that the backend sets on login and refresh.
 * This file never reads, stores or sends a token. Every request:
 *   - sends cookies (`credentials: 'include'`), and
 *   - sends `X-Admin-Request: 1`. The backend requires this header on cookie-based
 *     requests, which blocks cross-site form attacks (see SECURITY.md).
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const LEGACY_STORAGE_KEY = 'afrivate_admin_session';

/** Fired on window when the session can no longer be renewed. App listens for it. */
export const SESSION_ENDED_EVENT = 'afrivate-admin:session-ended';

/** Earlier builds kept tokens in localStorage. Remove them so they are never used again. */
export function clearLegacySession() {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* storage unavailable: nothing to clear */
  }
}

async function rawFetch(path, options = {}) {
  const headers = { 'X-Admin-Request': '1', ...(options.headers || {}) };
  if (options.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(`${BASE_URL}${path}`, { ...options, headers, credentials: 'include' });
}

// Several requests can fail with 401 at once. They share one refresh call.
let refreshInFlight = null;

function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = rawFetch('/api/admin/auth/refresh/', { method: 'POST' })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/** Turn an error response into a short, safe message. Never shows raw bodies or stack traces. */
async function errorMessage(res, fallback) {
  const data = await res.json().catch(() => null);
  if (data && typeof data.detail === 'string') return data.detail;
  if (data && typeof data === 'object') {
    const first = Object.values(data).flat()[0];
    if (typeof first === 'string') return first;
  }
  return fallback || `Request failed (${res.status}).`;
}

/** Authenticated fetch with one automatic refresh-and-retry on 401. */
export async function apiFetch(path, options = {}, retrying = false) {
  const res = await rawFetch(path, options);

  if (res.status === 401 && !retrying) {
    if (await refreshSession()) return apiFetch(path, options, true);
    window.dispatchEvent(new Event(SESSION_ENDED_EVENT));
    throw new Error('Your session has ended. Please sign in again.');
  }

  if (!res.ok) throw new Error(await errorMessage(res));
  return res;
}

export async function apiGet(path) {
  return (await apiFetch(path)).json();
}

export async function apiSend(path, method, body) {
  return (await apiFetch(path, { method, body: JSON.stringify(body) })).json();
}

/** Download a CSV export. Cookies are sent automatically, so a plain <a href> cannot be used. */
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

/** Returns the signed-in admin, or throws if there is no valid session. */
export async function fetchMe() {
  return (await apiFetch('/api/admin/auth/me/')).json();
}

/** Signs in. The backend sets the cookies; only the admin profile comes back. */
export async function login(email, password) {
  const res = await rawFetch('/api/admin/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'Login failed.'));
  const data = await res.json();
  return data.admin;
}

/** Ends the session on the server, which revokes it everywhere. Local state is cleared by the caller. */
export async function logout() {
  try {
    await rawFetch('/api/admin/auth/logout/', { method: 'POST' });
  } catch {
    /* Network error: the cookies still expire on their own, so carry on. */
  }
}
