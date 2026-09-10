import api from './api';

// POST /api/v1/auth/login -> { data: { accessToken, refreshToken, userId, email, role } }
export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  const { accessToken, refreshToken } = res.data.data;
  localStorage.setItem('lias_access_token', accessToken);
  localStorage.setItem('lias_refresh_token', refreshToken);
  return res.data.data;
}

export async function logout() {
  try {
    // Stateless backend: this call exists only for audit/UX, failures don't
    // block the actual (client-side) logout below.
    await api.post('/auth/logout');
  } catch {
    // ignore — token may already be invalid/expired
  } finally {
    localStorage.removeItem('lias_access_token');
    localStorage.removeItem('lias_refresh_token');
  }
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem('lias_access_token'));
}

// POST /api/v1/auth/change-password
export async function changePassword(currentPassword, newPassword) {
  await api.post('/auth/change-password', { currentPassword, newPassword });
}

// POST /api/v1/auth/forgot-password — always resolves the same way whether
// or not the email is registered (backend avoids user enumeration).
export async function forgotPassword(email) {
  await api.post('/auth/forgot-password', { email });
}

// POST /api/v1/auth/reset-password
export async function resetPassword(token, newPassword) {
  await api.post('/auth/reset-password', { token, newPassword });
}
