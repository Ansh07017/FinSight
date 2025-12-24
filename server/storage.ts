import * as dotenv from 'dotenv';
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, and, desc, sql, gte, lt } from "drizzle-orm";
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

const DAILY_XP_CAP = 500; // Max XP a user can earn from B-SAVE per day
const XP_RATE_PER_RUPEE = 1; // 1 XP per rupee saved (e.g., 50 estimated amount = 50 XP)

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

// FIX 1: Update the IStorage interface with the new dashboard method signature
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  checkSavingsVelocity(userId: string, amount: number): Promise<boolean>;
  logBehavioralSavings(userId: string, behaviorType: string, estimatedAmount: number): Promise<{ xpEarned: number, logId: string }>;
  // NEW: Added for B-SAVE and Rewards sync
  getBehavioralSavings(userId: string): Promise<BehavioralSaving[]>;

  // User Profile methods
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, data: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
    
  // Transaction methods
  getTransactions(userId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction & { userId: string }): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;

  // User Settings methods
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  // UPDATED: Added currency support for settings updates
  updateUserSettings(userId: string, data: Partial<InsertUserSettings> & { currency?: string }): Promise<UserSettings | undefined>;

  // NEW: Reports Engine
  getFinancialHistory(userId: string): Promise<any>;

  getDashboardData(userId: string, startDate: Date, endDate: Date): Promise<{
    stats: {
        income: number;
        expense: number;
        savings: number;
    };
    weeklySpendTrend: Array<{ name: string, amount: number }>;
    expensesByCategory: Array<{ name: string, value: number, color: string }>;
    recentTransactions: Transaction[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async checkSavingsVelocity(userId: string, amount: number): Promise<boolean> {
        const { start, end } = getDayBounds();

        // 1. Calculate current B-SAVE XP earned today
        const result = await db.select({ totalXp: sql<number>`sum(${schema.behavioralSavings.xpAwarded})` })
            .from(schema.behavioralSavings)
            .where(and(
                eq(schema.behavioralSavings.userId, userId),
                gte(schema.behavioralSavings.loggedAt, start),
                lt(schema.behavioralSavings.loggedAt, end)
            ));

        const currentXp = result[0]?.totalXp || 0;
        
        const newXp = amount * XP_RATE_PER_RUPEE;
        
        // 3. Check if new XP will exceed the cap
        return (currentXp + newXp) <= DAILY_XP_CAP;
    }

    async logBehavioralSavings(userId: string, behaviorType: string, estimatedAmount: number): Promise<{ xpEarned: number, logId: string }> {
        
        // Use the checkSavingsVelocity helper to prevent abuse
        const canLog = await this.checkSavingsVelocity(userId, estimatedAmount);
        if (!canLog) {
            // Throw an error that the route handler will catch and convert to 429
            throw new Error("Daily limit reached. Cannot log more behavioral savings today.");
        }
        
        // Calculate XP earned (capped by the daily cap logic inside checkSavingsVelocity)
        const xpEarned = Math.round(estimatedAmount * XP_RATE_PER_RUPEE);

        // 1. Log the behavioral saving
        const [newLog] = await db.insert(schema.behavioralSavings).values({
            userId,
            behaviorType,
            estimatedAmount: estimatedAmount.toString(),
            xpAwarded: xpEarned,
        }).returning();

        // 2. Update the user's total reward points in the userProfiles table
        await db.update(schema.userProfiles)
            .set({ 
                rewardPoints: sql`${schema.userProfiles.rewardPoints} + ${xpEarned}` 
            })
            .where(eq(schema.userProfiles.userId, userId));
            
        return { 
            xpEarned, 
            logId: newLog.id 
        };
    }

  // NEW: Fetch history for the Chart and Rewards Page
  async getBehavioralSavings(userId: string): Promise<BehavioralSaving[]> {
    return await db
      .select()
      .from(schema.behavioralSavings)
      .where(eq(schema.behavioralSavings.userId, userId))
      .orderBy(desc(schema.behavioralSavings.loggedAt));
  }

  // NEW: Aggregate Monthly Data for Reports Page
  async getFinancialHistory(userId: string): Promise<any> {
    const txs = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userId))
      .orderBy(desc(schema.transactions.date));

    const monthlyMap = new Map();

    txs.forEach((tx) => {
      if (!tx.date) return;
      const date = new Date(tx.date);
      const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      
      if (!monthlyMap.has(monthYear)) {
        monthlyMap.set(monthYear, { month: monthYear, income: 0, expense: 0, savings: 0 });
      }

      const data = monthlyMap.get(monthYear);
      const amount = parseFloat(tx.amount);

      if (tx.type === 'income') {
        data.income += amount;
      } else {
        data.expense += amount;
      }
      data.savings = data.income - data.expense;
    });

    const monthlyData = Array.from(monthlyMap.values()).reverse();
    const totalIncome = monthlyData.reduce((sum, d) => sum + d.income, 0);
    const totalExpense = monthlyData.reduce((sum, d) => sum + d.expense, 0);
    const avgIncome = monthlyData.length > 0 ? totalIncome / monthlyData.length : 0;
    const avgSavingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    return {
      monthlyData,
      avgIncome,
      avgSavingsRate,
      totalSavings: totalIncome - totalExpense,
      avgIncomeChange: 0 
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.transaction(async (tx) => {
        const userId = id;
        
        // Delete all linked data first (necessary if CASCADE DELETE is not set)
        await tx.delete(schema.transactions).where(eq(schema.transactions.userId, userId));
        await tx.delete(schema.userSettings).where(eq(schema.userSettings.userId, userId));
        await tx.delete(schema.userProfiles).where(eq(schema.userProfiles.userId, userId));
        await tx.delete(schema.behavioralSavings).where(eq(schema.behavioralSavings.userId, userId));
        
        // Delete the master user record
        await tx.delete(schema.users).where(eq(schema.users.id, userId));
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(schema.users)
      .set(data)
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  // User Profile methods
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db.insert(schema.userProfiles).values(profile as any).returning();
    return newProfile;
  }

  async updateUserProfile(
    userId: string,
    data: Partial<InsertUserProfile>
  ): Promise<UserProfile | undefined> {
    const [profile] = await db
      .update(schema.userProfiles)
      .set(data as any)
      .where(eq(schema.userProfiles.userId, userId))
      .returning();
    return profile;
  }



  // Transaction methods
  async getTransactions(userId: string): Promise<Transaction[]> {
    return db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userId))
      .orderBy(desc(schema.transactions.date));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.id, id));
    return transaction;
  }

  async createTransaction(transaction: InsertTransaction & { userId: string }): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(schema.transactions)
      .values(transaction as any)
      .returning();
    return newTransaction;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const result = await db.delete(schema.transactions).where(eq(schema.transactions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // User Settings methods
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(schema.userSettings)
      .where(eq(schema.userSettings.userId, userId));
    return settings;
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [newSettings] = await db.insert(schema.userSettings).values(settings).returning();
    return newSettings;
  }

  // UPDATED: Full implementation to support currency field update
  async updateUserSettings(
    userId: string,
    data: Partial<InsertUserSettings> & { currency?: string }
  ): Promise<UserSettings | undefined> {
    const [settings] = await db
      .update(schema.userSettings)
      .set(data)
      .where(eq(schema.userSettings.userId, userId))
      .returning();
    return settings;
  }

  // Dashboard logic
  async getDashboardData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
        // 1. Fetch all relevant transactions in the range
        const transactionsList = await db.select()
            .from(schema.transactions)
            .where(
                and(
                    eq(schema.transactions.userId, userId),
                    gte(schema.transactions.date, startDate),
                    lt(schema.transactions.date, endDate)
                )
            )
            .orderBy(desc(schema.transactions.date));

        let income = 0;
        let expense = 0;
        const categoryMap = new Map<string, number>();
        const weeklyMap = new Map<number, number>(); // 0=Sun, 6=Sat

        transactionsList.forEach((tx) => {
            const amount = parseFloat(tx.amount);

            if (tx.type === "income") {
                income += amount;
            } else {
                expense += amount;

                // Aggregate by Category
                categoryMap.set(tx.category, (categoryMap.get(tx.category) || 0) + amount);
                if (tx.date !== null) {
                    const txDate = new Date(tx.date); 
                    const dayIndex = txDate.getDay(); 
                    weeklyMap.set(dayIndex, (weeklyMap.get(dayIndex) || 0) + amount);
                }
            }
        });
        
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklySpendTrend = dayNames.map((name, dayIndex) => ({
            name,
            amount: weeklyMap.get(dayIndex) || 0,
        }));
        
        const categoryColors = ['#00D4AA', '#5B5BFD', '#FF66AA', '#FFBB00', '#CC66FF']; 
        const expensesByCategory = Array.from(categoryMap.entries())
            .map(([category, value], index) => ({
                name: category,
                value: value,
                color: categoryColors[index % categoryColors.length],
            }))
            .sort((a, b) => b.value - a.value);

        return {
            stats: { 
                income, 
                expense, 
                savings: income - expense 
            },
            weeklySpendTrend,
            expensesByCategory,
            recentTransactions: transactionsList.slice(0, 10),
        };
    }
}

export const storage = new DatabaseStorage();