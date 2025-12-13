/*import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  userType: text("user_type").notNull(), // 'salaried' or 'unemployed'
  currentBalance: decimal("current_balance", { precision: 12, scale: 2 }).default("0"),
  totalSavings: decimal("total_savings", { precision: 12, scale: 2 }).default("0"),
  salaryAmount: decimal("salary_amount", { precision: 12, scale: 2 }),
  salaryDate: integer("salary_date"), // Day of month (1-31)
  rewardPoints: integer("reward_points").default(0),
  tier: text("tier").default("Bronze"), // Bronze, Silver, Gold, Platinum
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'income' or 'expense'
  title: text("title").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  paymentMode: text("payment_mode").notNull(),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  expenseAlerts: boolean("expense_alerts").default(true),
  weeklyReport: boolean("weekly_report").default(true),
  rewardUpdates: boolean("reward_updates").default(false),
  biometricLogin: boolean("biometric_login").default(false),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
*/

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  userType: text("user_type").notNull(), // 'salaried' or 'unemployed'
  currentBalance: decimal("current_balance", { precision: 12, scale: 2 }).default("0"),
  totalSavings: decimal("total_savings", { precision: 12, scale: 2 }).default("0"),
  salaryAmount: decimal("salary_amount", { precision: 12, scale: 2 }),
  salaryDate: integer("salary_date"), // Day of month (1-31)
  rewardPoints: integer("reward_points").default(0),
  tier: text("tier").default("Bronze"), // Bronze, Silver, Gold, Platinum
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'income' or 'expense'
  title: text("title").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  paymentMode: text("payment_mode").notNull(),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  expenseAlerts: boolean("expense_alerts").default(true),
  weeklyReport: boolean("weekly_report").default(true),
  rewardUpdates: boolean("reward_updates").default(false),
  biometricLogin: boolean("biometric_login").default(false),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
});

// =========================================================================================
// FIX: Override default types for amount and date to enforce number and Date object
// =========================================================================================
export const insertTransactionSchema = createInsertSchema(transactions, {
    amount: z.string()
        .min(1, "Amount is required.")
        .refine((val) => {
            const num = parseFloat(val);
            return !isNaN(num) && num > 0;
        }, {
            message: "Amount must be a valid positive number.",
        }),
    date: z.preprocess((arg) => {
        if (typeof arg === 'string' || arg instanceof Date) {
            const date = new Date(arg);
            return isNaN(date.getTime()) ? arg : date;
        }
        return arg;
    },z.date()), 
}).omit({
  id: true,
  createdAt: true,
});
// =========================================================================================

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;