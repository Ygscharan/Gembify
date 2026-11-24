const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const TOKEN_STORAGE_KEY = 'gembify_auth_token';

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function clearStoredToken() {
  setStoredToken(null);
}

async function apiRequest(endpoint, options = {}) {
  const { skipAuth = false, ...fetchOptions } = options;
  const token = skipAuth ? null : getStoredToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(fetchOptions.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401 && !skipAuth) {
      clearStoredToken();
      if (typeof unauthorizedHandler === 'function') {
        unauthorizedHandler();
      }
    }

    const error = new Error(
      data?.error || `Falha na requisição (${response.status}). Verifique se o backend está ativo.`
    );
    error.status = response.status;
    error.code = data?.code;
    throw error;
  }

  return data;
}

export const api = {
  checkHealth() {
    return apiRequest('/health', { skipAuth: true });
  },

  login(username, password) {
    return apiRequest('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ username, password }),
    });
  },

  getMe() {
    return apiRequest('/auth/me');
  },

  listReports() {
    return apiRequest('/reports');
  },

  getReport(id) {
    return apiRequest(`/reports/${encodeURIComponent(id)}`);
  },

  analyzeProblem(payload) {
    return apiRequest('/reports/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  sendChatMessage(reportId, message) {
    return apiRequest(`/reports/${encodeURIComponent(reportId)}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  deleteReport(id) {
    return apiRequest(`/reports/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
