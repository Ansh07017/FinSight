// client/src/lib/api.ts

import { type InsertTransaction, type InsertUserProfile, type InsertUserSettings } from "@shared/schema";

const API_URL = "";

// --- TYPE DEFINITIONS ---
// Frontend provides data; Backend provides IDs/User context
type CreateTransactionInput = Omit<InsertTransaction, "userId" | "id" | "createdAt">;
type CreateProfileInput = Omit<InsertUserProfile, "userId" | "id">;

export async function apiRequest(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  // Global Error Interceptor
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Too many requests. Please wait a moment before trying again.");
    }
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }
  
  if (response.status === 204) {
      return null; 
  }
  return response.json();
}

// ========== Auth APIs (Complete) ==========
export const auth = {
  register: (email: string, password: string) =>
    apiRequest("/api/auth/register", { 
      method: "POST", 
      body: JSON.stringify({ email, password }) 
    }),

  login: (email: string, password: string) =>
    apiRequest("/api/auth/login", { 
      method: "POST", 
      body: JSON.stringify({ email, password }) 
    }),

  logout: () => 
    apiRequest("/api/auth/logout", { method: "POST" }),

  me: () => apiRequest("/api/auth/me"),

  // Password Management
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest("/api/auth/password", { 
      method: "PUT", 
      body: JSON.stringify({ currentPassword, newPassword }) 
    }),

  deleteAccount: (password: string) =>
    apiRequest("/api/auth/account", { 
      method: "DELETE", 
      body: JSON.stringify({ password }) 
    }),

  // OTP & Recovery
  verifyOtp: (userId: string, code: string) =>
    apiRequest("/api/auth/verifyotp", { 
      method: "POST", 
      body: JSON.stringify({ userId, code }) 
    }),

  resendOtp: (userId: string) => 
    apiRequest("/api/auth/resendotp", {
      method: "POST",
      body: JSON.stringify({ userId })
    }),

  forgotPassword: (email: string) =>
    apiRequest("/api/auth/forgotpassword", {
      method: "POST",
      body: JSON.stringify({ email })
    }),

  resetPassword: (token: string, newPassword: string, userId: string) =>
    apiRequest("/api/auth/resetpassword", {
      method: "POST",
      body: JSON.stringify({ token, newPassword, userId })
    }),
};

// ========== Profile APIs ==========
export const profile = {
  get: () => apiRequest("/api/profile"),
  
  getSummary: () => apiRequest("/api/profile/summary"),
  
  getFinancial: () => apiRequest("/api/profile/financial"),
  
  create: (data: CreateProfileInput) =>
    apiRequest("/api/profile", { 
      method: "POST", 
      body: JSON.stringify(data) 
    }),

  updateUser: (data: any) =>
    apiRequest("/api/profile/user", { 
      method: "PATCH", 
      body: JSON.stringify(data) 
    }),
};

// ========== Transaction APIs ==========
export const transactions = {
  list: () => apiRequest("/api/transactions"),

  getRecent: () => apiRequest("/api/transactions/recent"),

  create: (data: CreateTransactionInput) =>
    apiRequest("/api/transactions", { 
      method: "POST", 
      body: JSON.stringify(data) 
    }),

  delete: (id: string) =>
    apiRequest(`/api/transactions/${id}`, { method: "DELETE" }),
};

// ========== Dashboard APIs ==========
export const dashboard = {
  getStats: (period?: string) => 
    apiRequest(`/api/dashboard/stats?period=${period || '30d'}`),

  getTrend: (period?: string) => 
    apiRequest(`/api/dashboard/trend?period=${period || '30d'}`),

  getCategories: (period?: string) => 
    apiRequest(`/api/dashboard/categories?period=${period || '30d'}`),
};

// ========== Reports APIs ==========
export const reports = {
  history: () => apiRequest("/api/reports/history"),
  
  monthly: (year: number, month: number) =>
    apiRequest(`/api/reports/monthly?year=${year}&month=${month}`),
};

// ========== Behavioral Savings APIs (Growth Page) ==========
export const behavioral = {
    // 1. Log a smart choice (e.g. Skipped Coffee)
    logSavings: (data: { behaviorType: string; estimatedAmount: string }) => 
        apiRequest("/api/behavioral/savings", { 
            method: "POST", 
            body: JSON.stringify(data) 
        }),
    
    // 2. Claim Monthly Bonus (Crucial for Gamification)
    claimBonus: () => 
        apiRequest("/api/growth/claim-bonus", { method: "POST" }),

    // 3. Stats for the "Recent Wins" card
    getSummary: () => apiRequest("/api/behavioral/summary"),
    
    // 4. Full history list
    getHistory: () => apiRequest("/api/behavioral/savings"), 
};

// ========== Leaderboard APIs ==========
export const leaderboard = {
  get: () => apiRequest("/api/leaderboard"),
};

// ========== Settings APIs ==========
export const settings = {
  get: () => apiRequest("/api/settings"),

  update: (data: Partial<InsertUserSettings>) =>
    apiRequest("/api/settings", { 
      method: "PATCH", 
      body: JSON.stringify(data) 
    }),
};