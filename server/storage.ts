/*import * as dotenv from 'dotenv';
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, and, desc, sql, gte, lt, gt, sum } from "drizzle-orm";
import * as schema from "../shared/schema.ts";

import type {
  User,
  InsertUser,
  UserProfile,
  InsertUserProfile,
  Transaction,
  InsertTransaction,
  UserSettings,
  InsertUserSettings,
  BehavioralSaving,
} from "../shared/schema.ts";

const DAILY_XP_CAP = 500; 
const XP_RATE_PER_RUPEE = 1;

const getDayBounds = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start, end };
};

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING,
});

const db = drizzle(pool, { schema });

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByemail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  // Behavioral Methods
  checkSavingsVelocity(userId: string, amount: number): Promise<boolean>;
  logBehavioralSavings(userId: string, behaviorType: string, estimatedAmount: number): Promise<{ xpEarned: number, logId: string }>;
  getBehavioralSavings(userId: string): Promise<BehavioralSaving[]>;
  getBehavioralSummary(userId: string): Promise<{ xpToday: number; dailyCap: number }>;

  // User Profile methods
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  getProfileSummary(userId: string): Promise<{ firstName: string | null; lastName: string | null; email: string; tier: string | null }>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, data: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
    
  // Transaction methods
  getTransactions(userId: string): Promise<Transaction[]>;
  getRecentTransactions(userId: string, limit: number): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction & { userId: string }): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;

  // User Settings methods
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: string, data: Partial<InsertUserSettings> & { currency?: string }): Promise<UserSettings | undefined>;

  // Analytics & Reports
  getDashboardStats(userId: string): Promise<{ income: number; expense: number; savings: number }>;
  getWeeklySpendTrend(userId: string): Promise<Array<{ name: string, amount: number }>>;
  getCategoryBreakdown(userId: string): Promise<Array<{ name: string, value: number, color: string }>>;
  getFinancialHistory(userId: string): Promise<any>;
  getDashboardData(userId: string, startDate: Date, endDate: Date): Promise<any>;

  setResetToken(userId: string, token: string, expires: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  
  // OTP Verification
  generateOTP(userId: string): Promise<string>;
  verifyUser(userId: string, code: string): Promise<boolean>;
  
  // Leaderboard
  getLeaderboard(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // --- User & Auth ---
  async getUser(id: string) { 
    const [u] = await db.select().from(schema.users).where(eq(schema.users.id, id)); 
    return u; 
  }
  
  async getUserByemail(email: string) { 
    const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email)); 
    return u; 
  }
  
  async getUserByGoogleId(googleId: string) {
    const [u] = await db.select().from(schema.users).where(eq(schema.users.googleId, googleId));
    return u;
  }

  async createUser(insertUser: InsertUser) { 
    const [u] = await db.insert(schema.users).values(insertUser).returning(); 
    return u; 
  }

  async updateUser(id: string, data: Partial<InsertUser>) { 
    const [u] = await db.update(schema.users).set(data).where(eq(schema.users.id, id)).returning(); 
    return u; 
  }

  async setResetToken(userId: string, token: string, expires: Date): Promise<void> {
    await db.update(schema.users)
      .set({ resetToken: token, resetTokenExpires: expires })
      .where(eq(schema.users.id, userId));
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(schema.users)
      .where(and(
        eq(schema.users.resetToken, token),
        gt(schema.users.resetTokenExpires, new Date())
      ));
    return user;
  }

  async generateOTP(userId: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60000); // 10 min
    await db.update(schema.users)
      .set({ otpCode: code, otpExpires: expires })
      .where(eq(schema.users.id, userId));
    return code;
  }

  async verifyUser(userId: string, code: string): Promise<boolean> {
    const [user] = await db.select().from(schema.users)
      .where(and(
        eq(schema.users.id, userId),
        eq(schema.users.otpCode, code),
        gt(schema.users.otpExpires, new Date())
      ));
    if (!user) return false;
    await db.update(schema.users)
      .set({ isVerified: true, otpCode: null, otpExpires: null })
      .where(eq(schema.users.id, userId));
    return true;
  }

  async deleteUser(id: string): Promise<void> {
    await db.transaction(async (tx) => {
        await tx.delete(schema.transactions).where(eq(schema.transactions.userId, id));
        await tx.delete(schema.userSettings).where(eq(schema.userSettings.userId, id));
        await tx.delete(schema.userProfiles).where(eq(schema.userProfiles.userId, id));
        await tx.delete(schema.behavioralSavings).where(eq(schema.behavioralSavings.userId, id));
        await tx.delete(schema.users).where(eq(schema.users.id, id));
    });
  }

  // --- Behavioral Logic (Optimized) ---
  async checkSavingsVelocity(userId: string, amount: number): Promise<boolean> {
    const { start, end } = getDayBounds();
    // Optimized: Already uses SUM in SQL
    const [result] = await db.select({ totalXp: sql<number>`sum(${schema.behavioralSavings.xpAwarded})` })
        .from(schema.behavioralSavings)
        .where(and(eq(schema.behavioralSavings.userId, userId), gte(schema.behavioralSavings.loggedAt, start), lt(schema.behavioralSavings.loggedAt, end)));
    
    const currentXp = Number(result?.totalXp || 0);
    return (currentXp + (amount * XP_RATE_PER_RUPEE)) <= DAILY_XP_CAP;
  }

  async getBehavioralSummary(userId: string) {
    const { start, end } = getDayBounds();
    const [result] = await db.select({ totalXp: sql<number>`sum(${schema.behavioralSavings.xpAwarded})` })
        .from(schema.behavioralSavings)
        .where(and(eq(schema.behavioralSavings.userId, userId), gte(schema.behavioralSavings.loggedAt, start), lt(schema.behavioralSavings.loggedAt, end)));
    return { xpToday: Number(result?.totalXp || 0), dailyCap: DAILY_XP_CAP };
  }

  async logBehavioralSavings(userId: string, behaviorType: string, estimatedAmount: number) {
    const xpEarned = Math.round(estimatedAmount * XP_RATE_PER_RUPEE);
    const canLog = await this.checkSavingsVelocity(userId, estimatedAmount);
    if (!canLog) throw new Error("Daily limit reached.");
    
    const [newLog] = await db.insert(schema.behavioralSavings).values({ 
      userId, 
      behaviorType, 
      estimatedAmount: estimatedAmount.toString(), 
      xpAwarded: xpEarned 
    }).returning();

    await db.update(schema.userProfiles)
        .set({ rewardPoints: sql`${schema.userProfiles.rewardPoints} + ${xpEarned}` })
        .where(eq(schema.userProfiles.userId, userId));
        
    return { xpEarned, logId: newLog.id };
  }

  async getBehavioralSavings(userId: string) {
    return await db.select().from(schema.behavioralSavings).where(eq(schema.behavioralSavings.userId, userId)).orderBy(desc(schema.behavioralSavings.loggedAt));
  }

  // --- Profile Summary ---
  async getProfileSummary(userId: string) {
    // Parallel fetch for lower latency
    const [[u], [p]] = await Promise.all([
      db.select().from(schema.users).where(eq(schema.users.id, userId)),
      db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, userId))
    ]);

    return {
      firstName: u?.firstName || null,
      lastName: u?.lastName || null,
      email: u?.email || "Guest",
      tier: p?.tier || "Bronze"
    };
  }

  // --- Dashboard Methods (High-Latency Optimization) ---
  
  // OPTIMIZED: Uses SQL SUM instead of fetching all rows
  async getDashboardStats(userId: string) {
    const result = await db.select({
      type: schema.transactions.type,
      total: sql<string>`sum(cast(${schema.transactions.amount} as decimal))` 
    })
    .from(schema.transactions)
    .where(eq(schema.transactions.userId, userId))
    .groupBy(schema.transactions.type);

    let income = 0;
    let expense = 0;

    result.forEach(row => {
      const val = parseFloat(row.total);
      if (row.type === 'income') income = val;
      else if (row.type === 'expense') expense = val;
    });

    return { income, expense, savings: income - expense };
  }

  // OPTIMIZED: Uses Postgres date extraction to group by day
  async getWeeklySpendTrend(userId: string) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const result = await db.select({
        dayIndex: sql<number>`extract(dow from ${schema.transactions.date})`,
        total: sql<string>`sum(cast(${schema.transactions.amount} as decimal))`
      })
      .from(schema.transactions)
      .where(and(eq(schema.transactions.userId, userId), eq(schema.transactions.type, "expense")))
      .groupBy(sql`extract(dow from ${schema.transactions.date})`);

    // Create a zero-filled map first
    const trendMap = new Array(7).fill(0);
    
    // Fill with actual data
    result.forEach(row => {
      trendMap[row.dayIndex] = parseFloat(row.total);
    });

    return dayNames.map((name, i) => ({ name, amount: trendMap[i] }));
  }

  // OPTIMIZED: Aggregates by category in DB
  async getCategoryBreakdown(userId: string) {
    const result = await db.select({
        name: schema.transactions.category,
        value: sql<string>`sum(cast(${schema.transactions.amount} as decimal))`
    })
    .from(schema.transactions)
    .where(and(eq(schema.transactions.userId, userId), eq(schema.transactions.type, "expense")))
    .groupBy(schema.transactions.category)
    .orderBy(desc(sql`sum(cast(${schema.transactions.amount} as decimal))`));

    const colors = ['#00D4AA', '#5B5BFD', '#FF66AA', '#FFBB00', '#CC66FF']; 
    
    return result.map((row, i) => ({
        name: row.name,
        value: parseFloat(row.value),
        color: colors[i % colors.length]
    }));
  }

  async getRecentTransactions(userId: string, limit: number) {
    return await db.select().from(schema.transactions)
      .where(eq(schema.transactions.userId, userId))
      .orderBy(desc(schema.transactions.date))
      .limit(limit);
  }

  // --- Core CRUD ---
  async getUserProfile(userId: string) { 
    const [p] = await db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, userId)); 
    return p; 
  }

  async createUserProfile(p: InsertUserProfile) { 
    const [prof] = await db.insert(schema.userProfiles).values(p as any).returning(); 
    return prof; 
  }

  async updateUserProfile(userId: string, d: Partial<InsertUserProfile>) { 
    const [p] = await db.update(schema.userProfiles).set(d as any).where(eq(schema.userProfiles.userId, userId)).returning(); 
    return p; 
  }

  async getTransactions(userId: string) { 
    return db.select().from(schema.transactions).where(eq(schema.transactions.userId, userId)).orderBy(desc(schema.transactions.date)); 
  }

  async getTransaction(id: string) { 
    const [t] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, id)); 
    return t; 
  }

  async createTransaction(t: InsertTransaction & { userId: string }) {
    return await db.transaction(async (tx) => {
      // 1. Insert the transaction
      const [newTx] = await tx.insert(schema.transactions).values({
        userId: t.userId,
        type: t.type,
        title: t.title,
        amount: t.amount,
        category: t.category,
        paymentMode: t.paymentMode,
        date: t.date || new Date(),
      } as any).returning();

      // 2. Calculate balance adjustment
      const amount = parseFloat(t.amount);
      const adjustment = t.type === 'income' ? amount : -amount;

      // 3. Update the user_profiles table
      await tx.update(schema.userProfiles)
        .set({
          currentBalance: sql`${schema.userProfiles.currentBalance} + ${adjustment}`
        })
        .where(eq(schema.userProfiles.userId, t.userId));

      return newTx;
    });
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // 1. Get the transaction details before deleting it
      const [transaction] = await tx.select()
        .from(schema.transactions)
        .where(eq(schema.transactions.id, id));
  
      if (!transaction) return false;
  
      // 2. Calculate the reversal
      const amount = parseFloat(transaction.amount);
      const adjustment = transaction.type === 'income' ? -amount : amount;
  
      // 3. Update the user's balance
      await tx.update(schema.userProfiles)
        .set({
          currentBalance: sql`${schema.userProfiles.currentBalance} + ${adjustment}`
        })
        .where(eq(schema.userProfiles.userId, transaction.userId));
  
      // 4. Finally, delete the record
      const result = await tx.delete(schema.transactions)
        .where(eq(schema.transactions.id, id));
  
      return (result.rowCount ?? 0) > 0;
    });
  }

  async getUserSettings(userId: string) { const [s] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, userId)); return s; }
  async createUserSettings(s: InsertUserSettings) { const [st] = await db.insert(schema.userSettings).values(s).returning(); return st; }
  async updateUserSettings(userId: string, d: Partial<InsertUserSettings>) { const [s] = await db.update(schema.userSettings).set(d).where(eq(schema.userSettings.userId, userId)).returning(); return s; }

  // --- Reports (Optimized) ---
  
  // OPTIMIZED: Aggregates monthly data in SQL
  async getFinancialHistory(userId: string): Promise<any> {
    const result = await db.execute(sql`
      SELECT 
        TO_CHAR(date, 'Mon-yy') as month_label,
        DATE_TRUNC('month', date) as sort_date,
        SUM(CASE WHEN type = 'income' THEN CAST(amount AS DECIMAL) ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN CAST(amount AS DECIMAL) ELSE 0 END) as expense
      FROM transactions
      WHERE user_id = ${userId}
      GROUP BY TO_CHAR(date, 'Mon-yy'), DATE_TRUNC('month', date)
      ORDER BY DATE_TRUNC('month', date) DESC
    `);

    const monthlyData = result.rows.map((row: any) => {
      const inc = parseFloat(row.income);
      const exp = parseFloat(row.expense);
      return {
        month: row.month_label,
        income: inc,
        expense: exp,
        savings: inc - exp
      };
    });

    // Calculate totals from the aggregated data
    const totalSavings = monthlyData.reduce((sum, d) => sum + d.savings, 0);
    const avgIncome = monthlyData.length > 0 ? monthlyData.reduce((sum, d) => sum + d.income, 0) / monthlyData.length : 0;

    return { monthlyData, totalSavings, avgIncome };
  }

  // OPTIMIZED: Parallel Execution for Dashboard
  async getDashboardData(userId: string, startDate: Date, endDate: Date): Promise<any> {
    // Run all 4 queries in parallel to reduce Time-To-First-Byte (TTFB)
    const [statsResult, weeklyResult, categoryResult, recentTxs] = await Promise.all([
      // 1. Stats
      db.select({
        income: sql<string>`sum(case when ${schema.transactions.type} = 'income' then cast(${schema.transactions.amount} as decimal) else 0 end)`,
        expense: sql<string>`sum(case when ${schema.transactions.type} = 'expense' then cast(${schema.transactions.amount} as decimal) else 0 end)`
      }).from(schema.transactions)
        .where(and(eq(schema.transactions.userId, userId), gte(schema.transactions.date, startDate), lt(schema.transactions.date, endDate))),

      // 2. Weekly Trend
      db.select({
        dayIndex: sql<number>`extract(dow from ${schema.transactions.date})`,
        amount: sql<string>`sum(cast(${schema.transactions.amount} as decimal))`
      }).from(schema.transactions)
        .where(and(eq(schema.transactions.userId, userId), eq(schema.transactions.type, 'expense'), gte(schema.transactions.date, startDate), lt(schema.transactions.date, endDate)))
        .groupBy(sql`extract(dow from ${schema.transactions.date})`),

      // 3. Category Breakdown
      db.select({
        name: schema.transactions.category,
        value: sql<string>`sum(cast(${schema.transactions.amount} as decimal))`
      }).from(schema.transactions)
        .where(and(eq(schema.transactions.userId, userId), eq(schema.transactions.type, 'expense'), gte(schema.transactions.date, startDate), lt(schema.transactions.date, endDate)))
        .groupBy(schema.transactions.category),

      // 4. Recent Transactions
      db.select().from(schema.transactions)
        .where(and(eq(schema.transactions.userId, userId), gte(schema.transactions.date, startDate), lt(schema.transactions.date, endDate)))
        .orderBy(desc(schema.transactions.date))
        .limit(10)
    ]);

    // Process Stats
    const income = parseFloat(statsResult[0]?.income || '0');
    const expense = parseFloat(statsResult[0]?.expense || '0');

    // Process Weekly
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyMap = new Array(7).fill(0);
    weeklyResult.forEach(row => { weeklyMap[row.dayIndex] = parseFloat(row.amount); });

    // Process Categories
    const colors = ['#00D4AA', '#5B5BFD', '#FF66AA', '#FFBB00', '#CC66FF'];
    const expensesByCategory = categoryResult.map((row, i) => ({
      name: row.name,
      value: parseFloat(row.value),
      color: colors[i % colors.length]
    })).sort((a, b) => b.value - a.value);

    return {
      stats: { income, expense, savings: income - expense },
      weeklySpendTrend: dayNames.map((name, i) => ({ name, amount: weeklyMap[i] })),
      expensesByCategory,
      recentTransactions: recentTxs
    };
  }

  // --- Leaderboard (Preserved & Robust) ---
  async getLeaderboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyAgg = db.select({
        userId: schema.transactions.userId,
        income: sql<number>`SUM(CASE WHEN ${schema.transactions.type} = 'income' THEN CAST(${schema.transactions.amount} AS DECIMAL) ELSE 0 END)`.as("income"),
        expense: sql<number>`SUM(CASE WHEN ${schema.transactions.type} = 'expense' THEN CAST(${schema.transactions.amount} AS DECIMAL) ELSE 0 END)`.as("expense"),
      })
      .from(schema.transactions)
      .where(gte(schema.transactions.date, startOfMonth))
      .groupBy(schema.transactions.userId)
      .as("monthlyAgg");

    const result = await db.select({
        userId: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        savingsRate: sql<number>`
          CASE
            WHEN COALESCE(${monthlyAgg.income}, 0) > 0
            THEN ((COALESCE(${monthlyAgg.income}, 0) - COALESCE(${monthlyAgg.expense}, 0)) / ${monthlyAgg.income}) * 100
            ELSE 0
          END
        `,
      })
      .from(schema.users)
      .leftJoin(monthlyAgg, eq(schema.users.id, monthlyAgg.userId))
      .orderBy(desc(sql`
          CASE
            WHEN COALESCE(${monthlyAgg.income}, 0) > 0
            THEN ((COALESCE(${monthlyAgg.income}, 0) - COALESCE(${monthlyAgg.expense}, 0)) / ${monthlyAgg.income}) * 100
            ELSE 0
          END
      `))
      .limit(50);

    return result.map(user => ({
      userId: user.userId,
      displayName: user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user.email,
      savingsPercentage: Math.round(Number(user.savingsRate ?? 0)),
    }));
  }
}

export const storage = new DatabaseStorage();*/
// server/storage.ts

import { 
  users, userSettings, userProfiles, transactions, behavioralSavings,
  type User, type InsertUser, 
  type UserSettings, type InsertUserSettings,
  type UserProfile, type InsertUserProfile,
  type Transaction, type InsertTransaction,
  type BehavioralLog, type InsertBehavioralLog
} from "@shared/schema";
import { eq, desc, and, gte, lt, sql, sum } from "drizzle-orm";

// --- DB CONNECTION SETUP (Integrated) ---
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import * as dotenv from "dotenv";
import { any } from "zod";

dotenv.config();
const { Pool } = pkg;

if (!process.env.PG_CONNECTION_STRING) {
  throw new Error("PG_CONNECTION_STRING must be set in environment variables");
}

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING,
});

export const db = drizzle(pool, { schema: { 
  users, userSettings, userProfiles, transactions, behavioralSavings 
}});

// --- INTERFACE DEFINITION ---
export interface IStorage {
  // User & Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByemail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Security (OTP)
  generateOTP(userId: string): Promise<string>;
  verifyUser(userId: string, code: string): Promise<boolean>;
  setResetToken(userId: string, token: string, expires: Date): Promise<void>;

  // Profile
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile>;
  getProfileSummary(userId: string): Promise<any>;
  
  // Settings
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings>;

  // Transactions
  getTransactions(userId: string): Promise<Transaction[]>;
  getRecentTransactions(userId: string, limit: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;

  // Dashboard (With Date Filtering)
  getDashboardStats(userId: string, period?: string): Promise<{ income: number, expense: number, savings: number }>;
  getWeeklySpendTrend(userId: string, period?: string): Promise<{ name: string, amount: number }[]>;
  getCategoryBreakdown(userId: string, period?: string): Promise<{ name: string, value: number, color: string }[]>;
  
  // Reports
  getFinancialHistory(userId: string): Promise<{ monthlyData: any[], totalSavings: number }>;

  // Growth & Gamification
  createBehavioralLog(log: InsertBehavioralLog & { userId: string, xpAwarded: number }): Promise<BehavioralLog>;
  getBehavioralLogs(userId: string): Promise<BehavioralLog[]>;
  getBehavioralSummary(userId: string): Promise<any>;
  checkDailyXPCap(userId: string): Promise<boolean>;
  
  // Leaderboard
  getLeaderboard(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {

  // --- HELPER: Date Filter Logic ---
  private getDateFilter(period: string = '30d') {
    const now = new Date();
    const daysMap: Record<string, number> = {
      '7d': 7, '15d': 15, '30d': 30, '3m': 90, '1y': 365
    };
    const days = daysMap[period] || 30;
    const pastDate = new Date();
    pastDate.setDate(now.getDate() - days);
    return pastDate;
  }

  // --- USER AUTH CORE ---
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByemail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // Explicit 'any' type for transaction object
    await db.transaction(async (tx: any) => {
       await tx.delete(transactions).where(eq(transactions.userId, id));
       await tx.delete(userSettings).where(eq(userSettings.userId, id));
       await tx.delete(userProfiles).where(eq(userProfiles.userId, id));
       await tx.delete(behavioralSavings).where(eq(behavioralSavings.userId, id));
       await tx.delete(users).where(eq(users.id, id));
    });
  }

  // --- OTP & SECURITY ---
  async generateOTP(userId: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await db.update(users).set({ 
      verificationCode: code, 
      verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000) 
    }).where(eq(users.id, userId));
    return code;
  }

  async verifyUser(userId: string, code: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || user.verificationCode !== code || !user.verificationCodeExpires) return false;
    if (new Date() > user.verificationCodeExpires) return false;

    await db.update(users).set({ 
      isVerified: true, verificationCode: null, verificationCodeExpires: null 
    }).where(eq(users.id, userId));
    return true;
  }

  async setResetToken(userId: string, token: string, expires: Date): Promise<void> {
    await db.update(users).set({ resetToken: token, resetTokenExpires: expires }).where(eq(users.id, userId));
  }

  // --- PROFILE ---
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db.insert(userProfiles).values(profile as any).returning();
    return newProfile;
  }

  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const [updated] = await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId)).returning();
    return updated;
  }

  async getProfileSummary(userId: string): Promise<any> {
    const [result] = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      tier: userProfiles.tier,
      onboardingCompleted: userProfiles.userType
    })
    .from(users)
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .where(eq(users.id, userId));
    return result || {};
  }

  // --- SETTINGS ---
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [newSettings] = await db.insert(userSettings).values(settings).returning();
    return newSettings;
  }

  async updateUserSettings(userId: string, data: Partial<UserSettings>): Promise<UserSettings> {
    const [updated] = await db.update(userSettings).set(data).where(eq(userSettings.userId, userId)).returning();
    return updated;
  }

  // --- TRANSACTIONS ---
  async getTransactions(userId: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.date));
  }

  async getRecentTransactions(userId: string, limit: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.date)).limit(limit);
  }

  async createTransaction(t: InsertTransaction): Promise<Transaction> {
    // Explicit 'any' type for transaction object
    return await db.transaction(async (tx: any) => {
      const [newTx] = await tx.insert(transactions).values(t).returning();
      
      const profile = await this.getUserProfile(t.userId);
      if (profile) {
        const current = parseFloat(profile.currentBalance?.toString() || "0");
        const amount = parseFloat(t.amount.toString());
        const newBalance = t.type === "income" ? current + amount : current - amount;
        await tx.update(userProfiles).set({ currentBalance: newBalance.toString() }).where(eq(userProfiles.userId, t.userId));
      }
      return newTx;
    });
  }

  async deleteTransaction(id: string): Promise<boolean> {
    // Explicit 'any' type for transaction object
    return await db.transaction(async (tx: any) => {
      const [txData] = await tx.select().from(transactions).where(eq(transactions.id, id));
      if (!txData) return false;

      const profile = await this.getUserProfile(txData.userId);
      if (profile) {
        const current = parseFloat(profile.currentBalance?.toString() || "0");
        const amount = parseFloat(txData.amount.toString());
        const newBalance = txData.type === "income" ? current - amount : current + amount;
        await tx.update(userProfiles).set({ currentBalance: newBalance.toString() }).where(eq(userProfiles.userId, txData.userId));
      }

      const result = await tx.delete(transactions).where(eq(transactions.id, id)).returning();
      return result.length > 0;
    });
  }

  // --- DASHBOARD (High Performance Aggregation) ---
  
  async getDashboardStats(userId: string, period?: string): Promise<{ income: number, expense: number, savings: number }> {
    const dateLimit = this.getDateFilter(period);
    
    const [result] = await db.select({
      income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN CAST(${transactions.amount} AS DECIMAL) ELSE 0 END), 0)`,
      expense: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN CAST(${transactions.amount} AS DECIMAL) ELSE 0 END), 0)`
    })
    .from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      gte(transactions.date, dateLimit)
    ));

    const income = Number(result?.income || 0);
    const expense = Number(result?.expense || 0);
    return { income, expense, savings: income - expense };
  }

  async getWeeklySpendTrend(userId: string, period?: string): Promise<{ name: string, amount: number }[]> {
    const dateLimit = this.getDateFilter(period);
    
    const results = await db.select({
      day: sql<number>`EXTRACT(DOW FROM ${transactions.date})`,
      amount: sql<number>`SUM(CAST(${transactions.amount} AS DECIMAL))`
    })
    .from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      eq(transactions.type, 'expense'),
      gte(transactions.date, dateLimit)
    ))
    .groupBy(sql`EXTRACT(DOW FROM ${transactions.date})`);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map = new Array(7).fill(0);
    // Explicitly type 'r' as any
    results.forEach((r: any) => { map[r.day] = Number(r.amount); });

    return dayNames.map((name, i) => ({ name, amount: map[i] }));
  }

  async getCategoryBreakdown(userId: string, period?: string): Promise<{ name: string, value: number, color: string }[]> {
    const dateLimit = this.getDateFilter(period);
    
    const results = await db.select({
      name: transactions.category,
      value: sql<number>`SUM(CAST(${transactions.amount} AS DECIMAL))`
    })
    .from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      eq(transactions.type, 'expense'),
      gte(transactions.date, dateLimit)
    ))
    .groupBy(transactions.category)
    .orderBy(desc(sql`SUM(CAST(${transactions.amount} AS DECIMAL))`));

    const COLORS = ["#00D4AA", "#3b82f6", "#ef4444", "#eab308", "#a855f7", "#f97316"];
    // Explicitly type 'r' as any
    return results.map((r: any, i: number) => ({
      name: r.name,
      value: Number(r.value),
      color: COLORS[i % COLORS.length]
    }));
  }

  // --- REPORTS ---
  async getFinancialHistory(userId: string): Promise<{ monthlyData: any[], totalSavings: number }> {
    const results = await db.execute(sql`
      SELECT 
        TO_CHAR(date, 'Mon-YYYY') as label,
        TO_CHAR(date, 'YYYY-MM') as sort_key,
        SUM(CASE WHEN type = 'income' THEN CAST(amount AS DECIMAL) ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN CAST(amount AS DECIMAL) ELSE 0 END) as expense
      FROM transactions
      WHERE user_id = ${userId}
      GROUP BY label, sort_key
      ORDER BY sort_key ASC
    `);

    // Explicitly type 'row' as any
    const monthlyData = results.rows.map((row: any) => ({
      month: row.label,
      income: Number(row.income),
      expense: Number(row.expense),
      savings: Number(row.income) - Number(row.expense)
    }));

    const profile = await this.getUserProfile(userId);
    const totalSavings = Number(profile?.totalSavings || 0);

    return { monthlyData, totalSavings };
  }

  // --- GAMIFICATION & BEHAVIORAL LOGS ---
  
  async checkDailyXPCap(userId: string): Promise<boolean> {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    
    const [result] = await db.select({
      totalXP: sql<number>`COALESCE(SUM(${behavioralSavings.xpAwarded}), 0)`
    })
    .from(behavioralSavings)
    .where(and(
      eq(behavioralSavings.userId, userId),
      gte(behavioralSavings.loggedAt, startOfDay)
    ));

    return Number(result.totalXP) < 500; 
  }

  async createBehavioralLog(log: InsertBehavioralLog & { userId: string, xpAwarded: number }): Promise<BehavioralLog> {
    const [newLog] = await db.insert(behavioralSavings).values(log).returning();
    return newLog;
  }

  async getBehavioralLogs(userId: string): Promise<BehavioralLog[]> {
    return await db.select().from(behavioralSavings)
      .where(eq(behavioralSavings.userId, userId))
      .orderBy(desc(behavioralSavings.loggedAt));
  }

  async getBehavioralSummary(userId: string): Promise<any> {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);

    const [stats] = await db.select({
      count: sql<number>`count(*)`,
      totalSaved: sql<number>`SUM(CAST(${behavioralSavings.estimatedAmount} AS DECIMAL))`,
      todayXP: sql<number>`SUM(CASE WHEN ${behavioralSavings.loggedAt} >= ${startOfDay} THEN ${behavioralSavings.xpAwarded} ELSE 0 END)`
    })
    .from(behavioralSavings)
    .where(eq(behavioralSavings.userId, userId));

    return {
      habitsLogged: Number(stats?.count || 0),
      potentialWealth: Number(stats?.totalSaved || 0),
      xpToday: Number(stats?.todayXP || 0),
      dailyCap: 500
    };
  }

  // --- LEADERBOARD ---
  async getLeaderboard(): Promise<any[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyStats = db.select({
      userId: transactions.userId,
      income: sql<number>`SUM(CASE WHEN ${transactions.type} = 'income' THEN CAST(${transactions.amount} AS DECIMAL) ELSE 0 END)`.as('m_income'),
      expense: sql<number>`SUM(CASE WHEN ${transactions.type} = 'expense' THEN CAST(${transactions.amount} AS DECIMAL) ELSE 0 END)`.as('m_expense')
    })
    .from(transactions)
    .where(gte(transactions.date, startOfMonth))
    .groupBy(transactions.userId)
    .as('monthly_stats');

    const result = await db.select({
      id: userProfiles.userId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      tier: userProfiles.tier,
      points: userProfiles.rewardPoints,
      income: monthlyStats.income,
      expense: monthlyStats.expense
    })
    .from(userProfiles)
    .leftJoin(users, eq(userProfiles.userId, users.id))
    .leftJoin(monthlyStats, eq(userProfiles.userId, monthlyStats.userId))
    .orderBy(desc(userProfiles.rewardPoints))
    .limit(50);

    // Explicitly type 'u' as any
    return result.map((u: any) => {
      const inc = Number(u.income || 0);
      const exp = Number(u.expense || 0);
      const savingsRate = inc > 0 ? ((inc - exp) / inc) * 100 : 0;

      return {
        userId: u.id,
        displayName: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.email?.split('@')[0] || 'User'),
        savingsPercentage: Math.round(savingsRate),
        tier: u.tier,
        points: u.points
      };
    });
  }
}

export const storage = new DatabaseStorage();