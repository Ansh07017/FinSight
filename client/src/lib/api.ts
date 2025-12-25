// client/src/lib/api.ts

/*const API_URL = "";

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

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
  
  if (response.status === 204) {
      return null; 
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

  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest("/api/auth/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  deleteAccount: (password: string) =>
    apiRequest("/api/auth/account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    }),
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

// Behavioral Savings APIs (RESTORED & FIXED)
export const behavioral = {
    logSavings: (data: { behaviorType: string; estimatedAmount: string }) => 
        apiRequest("/api/behavioral/savings", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    getHistory: () => 
        apiRequest("/api/behavioral/savings", { 
            method: "GET" 
        }),
};

// Settings APIs
export const settings = {
  get: () => apiRequest("/api/settings"),

  update: (data: any) =>
    apiRequest("/api/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};*/
// client/src/lib/api.ts

const API_URL = "";

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

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
  
  if (response.status === 204) {
      return null; 
  }
  return response.json();
}

// ========== Auth APIs ==========
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

  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest("/api/auth/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  deleteAccount: (password: string) =>
    apiRequest("/api/auth/account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    }),
};

// ========== Profile APIs (Refactored) ==========
export const profile = {
  // Full profile for the Settings page
  get: () => apiRequest("/api/profile"),
  
  // High-speed summary for the Sidebar/Layout
  getSummary: () => apiRequest("/api/profile/summary"),
  
  // Financial-specific data (Balance/Salary)
  getFinancial: () => apiRequest("/api/profile/financial"),
  
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

// ========== Transaction APIs (Refactored) ==========
export const transactions = {
  // Full list for the Transactions page
  list: () => apiRequest("/api/transactions"),

  // High-speed fetch for only the last 10 items (Dashboard)
  getRecent: () => apiRequest("/api/transactions/recent"),

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

// ========== Dashboard APIs (Broken Down) ==========
export const dashboard = {
  // Just the top stats: Income, Expense, Savings
  getStats: () => apiRequest("/api/dashboard/stats"),
  
  // Data for the Weekly Spend Area Chart
  getTrend: () => apiRequest("/api/dashboard/trend"),
  
  // Data for the Categories Bar Chart
  getCategories: () => apiRequest("/api/dashboard/categories"),
};

// ========== Reports APIs ==========
export const reports = {
  history: () => apiRequest("/api/reports/history"),
  
  monthly: (year: number, month: number) =>
    apiRequest(`/api/reports/monthly?year=${year}&month=${month}`),
};

// ========== Behavioral Savings APIs (Refactored) ==========
export const behavioral = {
    logSavings: (data: { behaviorType: string; estimatedAmount: string }) => 
        apiRequest("/api/behavioral/savings", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    
    // Quick status of current XP vs Daily Cap
    getSummary: () => apiRequest("/api/behavioral/summary"),
    
    // Full log for the history chart
    getHistory: () => 
        apiRequest("/api/behavioral/savings", { 
            method: "GET" 
        }),
};

// ========== Settings APIs ==========
export const settings = {
  get: () => apiRequest("/api/settings"),

  update: (data: any) =>
    apiRequest("/api/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};