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