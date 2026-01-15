import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==========================================
// 1. Table Definitions
// ==========================================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  // UPDATED: Password is now nullable to support Google OAuth users
  password: text("password"), 
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone").unique(),
  googleId: text("google_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  resetToken: text("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
  isVerified: boolean("is_verified").default(false).notNull(),
  otpCode: text("otp_code"),
  otpExpires: timestamp("otp_expires"),
});

export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  userType: text("user_type").notNull(), 
  currentBalance: decimal("current_balance", { precision: 12, scale: 2 }).default("0"),
  totalSavings: decimal("total_savings", { precision: 12, scale: 2 }).default("0"),
  salaryAmount: decimal("salary_amount", { precision: 12, scale: 2 }),
  salaryDate: integer("salary_date"), 
  rewardPoints: integer("reward_points").default(0),
  tier: text("tier").default("Bronze"), 
  goalType: text("goal_type").$type<'monthly_amount' | 'percentage_income'>().default('monthly_amount'),
  targetValue: varchar("target_value"),
});

export const behavioralSavings = pgTable("behavioral_savings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  behaviorType: text("behavior_type").notNull(), 
  estimatedAmount: decimal("estimated_amount", { precision: 12, scale: 2 }).notNull(),
  xpAwarded: integer("xp_awarded").default(0),
  loggedAt: timestamp("logged_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text("type").$type<'income' | 'expense'>().notNull(), 
  title: text("title").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  paymentMode: text("payment_mode").notNull(),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  expenseAlerts: boolean("expense_alerts").default(true),
  weeklyReport: boolean("weekly_report").default(true),
  rewardUpdates: boolean("reward_updates").default(false),
  biometricLogin: boolean("biometric_login").default(false),
  currency: text("currency").default("INR"),
});

// ==========================================
// 2. Zod Schemas (Validation)
// ==========================================

// UPDATED: insertUserSchema now correctly handles optional passwords
export const insertUserSchema = createInsertSchema(users, {
  password: z.string().min(8, "Password must be at least 8 characters").nullable().optional(),
  email: z.string().email("Invalid email address"),
}).omit({ 
  id: true, 
  createdAt: true 
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ 
  id: true 
});

export const insertBehavioralSavingsSchema = createInsertSchema(behavioralSavings).omit({ 
  id: true, 
  loggedAt: true 
});

export const insertTransactionSchema = createInsertSchema(transactions, {
  amount: z.string()
    .min(1, "Amount is required.")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, { message: "Amount must be a valid positive number." }),
  date: z.coerce.date().default(() => new Date()), 
}).omit({ 
  id: true, 
  createdAt: true 
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ 
  id: true 
});

// ==========================================
// 3. Types
// ==========================================

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type BehavioralSaving = typeof behavioralSavings.$inferSelect;
export type InsertBehavioralSavings = z.infer<typeof insertBehavioralSavingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;