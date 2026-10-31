const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('roadguard_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP Error ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`API call failed for ${url}:`, error.message);
    throw error;
  }
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/auth/me'),
  getDemoUsers: () => request('/auth/demo-users'),

  // Districts
  getDistricts: () => request('/districts'),
  getDistrictSummary: (id) => request(`/districts/${id}/summary`),

  // Road Locations
  getRoads: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/roads${q ? `?${q}` : ''}`);
  },
  getRoadDetail: (id) => request(`/roads/${id}`),
  createRoad: (data) => request('/roads', { method: 'POST', body: JSON.stringify(data) }),

  // Cameras
  getCameras: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/cameras${q ? `?${q}` : ''}`);
  },
  getCameraDetail: (id) => request(`/cameras/${id}`),
  getCameraTelemetry: (id) => request(`/cameras/${id}/telemetry`),
  getCameraEvents: (id) => request(`/cameras/${id}/events`),
  uploadMediaAnalysis: async (formData) => {
    const res = await fetch(`${API_BASE}/cameras/analyze-upload`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });
    return await res.json();
  },

  // Weather
  getWeather: () => request('/weather'),
  getDistrictWeather: (id) => request(`/weather/district/${id}`),
  getWeatherCorrelation: () => request('/weather/risk-correlation'),

  // Hazards
  getHazards: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/hazards${q ? `?${q}` : ''}`);
  },
  updateHazardStatus: (id, status) => request(`/hazards/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  reportHazard: async (formData) => {
    const res = await fetch(`${API_BASE}/hazards/report-defect`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });
    return await res.json();
  },

  // AI Risk
  predictRisk: (features) => request('/risk/predict', { method: 'POST', body: JSON.stringify(features) }),
  getRiskAssessments: () => request('/risk/assessments'),
  getShapFactors: (assessmentId) => request(`/risk/factors/${assessmentId}`),

  // Manual Media Inspection (Image / Video Upload & AI Analysis)
  inspectMedia: async (formData) => {
    const res = await fetch(`${API_BASE}/ai/inspect-media`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Upload inspection failed with code ${res.status}`);
    }
    return await res.json();
  },
  convertSuggestionToWorkOrder: (payload) => request('/ai/convert-suggestion-to-work-order', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Recommendations
  getRecommendations: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/recommendations${q ? `?${q}` : ''}`);
  },
  actionRecommendation: (id, action, remarks) => request(`/recommendations/${id}/action`, {
    method: 'POST',
    body: JSON.stringify({ action, remarks })
  }),

  // Work Orders
  getWorkOrders: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/work-orders${q ? `?${q}` : ''}`);
  },
  getWorkOrderDetail: (id) => request(`/work-orders/${id}`),
  advanceWorkOrderStage: (id, data) => request(`/work-orders/${id}/advance-stage`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  uploadWorkOrderEvidence: async (woId, formData) => {
    const res = await fetch(`${API_BASE}/work-orders/${woId}/upload-evidence`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });
    return await res.json();
  },

  // Before & After
  getBeforeAfterMetrics: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/before-after${q ? `?${q}` : ''}`);
  },
  getInterventions: () => request('/before-after/interventions'),

  // Digital Twin Simulation
  runSimulation: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/simulation/run${q ? `?${q}` : ''}`);
  },
  getScenarios: () => request('/simulation/scenarios'),

  // Analytics
  getDashboardAnalytics: () => request('/analytics/dashboard'),

  // Alerts
  getAlerts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/alerts${q ? `?${q}` : ''}`);
  },
  actionAlert: (id, action, dispatched_units) => request(`/alerts/${id}/action`, {
    method: 'POST',
    body: JSON.stringify({ action, dispatched_units })
  }),

  // Reports
  generateReport: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/generate${q ? `?${q}` : ''}`);
  },

  // Users & Roles
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  toggleUserStatus: (id, is_active) => request(`/users/${id}/status?is_active=${is_active}`, { method: 'PATCH' }),
  getAuditLogs: () => request('/users/audit-logs'),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'POST', body: JSON.stringify(data) }),
};

