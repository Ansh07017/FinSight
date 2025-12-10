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
 

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING,
});

const db = drizzle(pool, { schema });


export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

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

  // Analytics methods
  getMonthlyStats(userId: string, year: number, month: number): Promise<{
    income: number;
    expense: number;
    savings: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
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

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(schema.transactions)
      .values(transaction)
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

  // Analytics methods
  async getMonthlyStats(
    userId: string,
    year: number,
    month: number
  ): Promise<{ income: number; expense: number; savings: number }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, userId),
          sql`${schema.transactions.date} >= ${startDate}`,
          sql`${schema.transactions.date} <= ${endDate}`
        )
      );

    let income = 0;
    let expense = 0;

    transactions.forEach((tx) => {
      const amount = parseFloat(tx.amount);
      if (tx.type === "income") {
        income += amount;
      } else {
        expense += amount;
      }
    });

    const savings = income - expense;

    return { income, expense, savings };
  }
}

export const storage = new DatabaseStorage();
