// API helper functions

const API_URL = "";

export async function apiRequest(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// Auth APIs
export const auth = {
  register: (username: string, password: string) =>
    apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  login: (username: string, password: string) =>
    apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    apiRequest("/api/auth/logout", {
      method: "POST",
    }),

  me: () => apiRequest("/api/auth/me"),
};

// Profile APIs
export const profile = {
  get: () => apiRequest("/api/profile"),
  
  create: (data: any) =>
    apiRequest("/api/profile", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateUser: (data: any) =>
    apiRequest("/api/profile/user", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Transaction APIs
export const transactions = {
  list: () => apiRequest("/api/transactions"),

  create: (data: any) =>
    apiRequest("/api/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest(`/api/transactions/${id}`, {
      method: "DELETE",
    }),
};

// Dashboard APIs
export const dashboard = {
  get: () => apiRequest("/api/dashboard"),
};

// Reports APIs
export const reports = {
  history: () => apiRequest("/api/reports/history"),
  
  monthly: (year: number, month: number) =>
    apiRequest(`/api/reports/monthly?year=${year}&month=${month}`),
};

// Settings APIs
export const settings = {
  get: () => apiRequest("/api/settings"),

  update: (data: any) =>
    apiRequest("/api/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
