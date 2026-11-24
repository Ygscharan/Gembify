const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
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
    return apiRequest('/health');
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
