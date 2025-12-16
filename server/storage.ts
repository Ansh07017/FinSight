import * as dotenv from 'dotenv';
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, and, desc, sql, gte,lt } from "drizzle-orm";
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

  // User Profile methods
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, data: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
    
  // Transaction methods
  getTransactions(userId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;

  // User Settings methods
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: string, data: Partial<InsertUserSettings>): Promise<UserSettings | undefined>;

  getDashboardData(userId: string, startDate: Date, endDate: Date): Promise<{
    income: number;
    expense: number;
    savings: number;
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
        
        const newXp = Math.min(amount * XP_RATE_PER_RUPEE, DAILY_XP_CAP);
        
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
        }).returning({ id: schema.behavioralSavings.id });

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

  // FIX 3: Implementation for createTransaction (Ensuring amount is handled as a string for Drizzle)
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(schema.transactions)
      .values(transaction as any) // Type cast to bypass strictness if Zod forces number type, relying on client submission being a string
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

  async updateUserSettings(
    userId: string,
    data: Partial<InsertUserSettings>
  ): Promise<UserSettings | undefined> {
    const [settings] = await db
      .update(schema.userSettings)
      .set(data)
      .where(eq(schema.userSettings.userId, userId))
      .returning();
    return settings;
  }

  // FIX 4: New comprehensive method for Dashboard data fetching
  async getDashboardData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
        // 1. Fetch all relevant transactions in the range
        const transactions = await db.select()
            .from(schema.transactions)
            .where(
                and(
                    eq(schema.transactions.userId, userId),
                    sql`${schema.transactions.date} >= ${startDate}`,
                    sql`${schema.transactions.date} <= ${endDate}`
                )
            )
            .orderBy(desc(schema.transactions.date));

        let income = 0;
        let expense = 0;
        const categoryMap = new Map<string, number>();
        const weeklyMap = new Map<number, number>(); // 0=Sun, 6=Sat

        transactions.forEach((tx) => {
            const amount = parseFloat(tx.amount);

            if (tx.type === "income") {
                income += amount;
            } else {
                expense += amount;

                // Aggregate by Category
                categoryMap.set(tx.category, (categoryMap.get(tx.category) || 0) + amount);
                if (tx.date !== null) {
                    // We must use the date, so we assert its type after the null check
                    const txDate = new Date(tx.date as Date); 
                    const dayIndex = txDate.getDay(); 
                    weeklyMap.set(dayIndex, (weeklyMap.get(dayIndex) || 0) + amount);
                }
            }
        });
        
        // --- Format Chart Data ---

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
            // FIX: Removed the old, redundant getMonthlyStats method
            stats: { 
                income, 
                expense, 
                savings: income - expense 
            },
            weeklySpendTrend,
            expensesByCategory,
            recentTransactions: transactions.slice(0, 10),
        };
    }

}

export const storage = new DatabaseStorage();