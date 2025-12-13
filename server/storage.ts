import * as dotenv from 'dotenv';
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, and, desc, sql } from "drizzle-orm";
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
// Assuming transactions is not used here, removing the unused import
// import { transactions } from '@/lib/api.ts'; 
 

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

  // Analytics methods (Removed old getMonthlyStats)
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
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

// FIX 2: Implementation for deleteUser (Uses a transaction to ensure clean deletion)
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
    const [newProfile] = await db.insert(schema.userProfiles).values(profile).returning();
    return newProfile;
  }

  async updateUserProfile(
    userId: string,
    data: Partial<InsertUserProfile>
  ): Promise<UserProfile | undefined> {
    const [profile] = await db
      .update(schema.userProfiles)
      .set(data)
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

    // Removed the old getMonthlyStats method which is now replaced by getDashboardData
}

export const storage = new DatabaseStorage();