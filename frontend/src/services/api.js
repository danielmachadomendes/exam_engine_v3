const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function downloadCsv(endpoint) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Accept: 'text/csv',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'CSV export failed');
  }
  return response.blob();
}

// API methods auxiliares
export const authApi = {
  login: (credentials) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getProfile: () => apiFetch('/users/profile'),
};

export const adminApi = {
  getUsers: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
    ).toString();
    return apiFetch(`/admin/users${query ? `?${query}` : ''}`);
  },
  getPendingUsers: () => apiFetch('/admin/users/pending'),
  updateUser: (id, data) =>
    apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateUserStatus: (id, status) =>
    apiFetch(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getExams: () => apiFetch('/admin/exams'),
  importCsv: (entity, csv) =>
    apiFetch(`/admin/${entity}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csv,
    }),
  exportCsv: (entity) => downloadCsv(`/admin/${entity}/export`),
  createExam: (data) => apiFetch('/admin/exams', { method: 'POST', body: JSON.stringify(data) }),
  updateExam: (id, data) =>
    apiFetch(`/admin/exams/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteExam: (id) => apiFetch(`/admin/exams/${id}`, { method: 'DELETE' }),
  createDomain: (data) =>
    apiFetch('/admin/domains', { method: 'POST', body: JSON.stringify(data) }),
  updateDomain: (id, data) =>
    apiFetch(`/admin/domains/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteDomain: (id) => apiFetch(`/admin/domains/${id}`, { method: 'DELETE' }),
  getQuestions: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
    ).toString();
    return apiFetch(`/admin/questions${query ? `?${query}` : ''}`);
  },
  updateQuestion: (id, data) =>
    apiFetch(`/admin/questions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteQuestion: (id) => apiFetch(`/admin/questions/${id}`, { method: 'DELETE' }),
};

export const examApi = {
  startExam: (examId) => apiFetch(`/exams/${examId}/start`, { method: 'POST' }),
  submitExam: (examId, payload) =>
    apiFetch(`/exams/${examId}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};