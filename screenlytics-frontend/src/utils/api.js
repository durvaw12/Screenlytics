// src/utils/api.js
// Central API helper — all fetch calls to the backend live here

const BASE = '/api';

function getToken() {
  return localStorage.getItem('sl-token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data;
}

// ── Auth ─────────────────────────────────────────────────
export const authAPI = {
  register: (body) => request('POST', '/auth/register', body),
  login:    (body) => request('POST', '/auth/login',    body),
};

// ── User ─────────────────────────────────────────────────
export const userAPI = {
  getMe:          ()     => request('GET',   '/users/me'),
  updateMe:       (body) => request('PATCH', '/users/me',          body),
  updatePassword: (body) => request('PATCH', '/users/me/password', body),
};

// ── Logs ─────────────────────────────────────────────────
export const logsAPI = {
  getLogs:      ()     => request('GET',    '/logs'),
  upsertLog:    (body) => request('POST',   '/logs',       body),
  getLogByDate: (date) => request('GET',    `/logs/${date}`),
  deleteLog:    (date) => request('DELETE', `/logs/${date}`),
};

// ── Tasks ────────────────────────────────────────────────
export const tasksAPI = {
  getTasks:   ()     => request('GET',    '/tasks'),
  createTask: (body) => request('POST',   '/tasks',             body),
  toggleTask: (id)   => request('PATCH',  `/tasks/${id}/toggle`),
  deleteTask: (id)   => request('DELETE', `/tasks/${id}`),
};

// ── Analytics ────────────────────────────────────────────
export const analyticsAPI = {
  getSummary:   (days = 7) => request('GET', `/analytics/summary?days=${days}`),
  getChartData: (days = 7) => request('GET', `/analytics/chart?days=${days}`),
  getStreak:    ()         => request('GET', '/analytics/streak'),
};
