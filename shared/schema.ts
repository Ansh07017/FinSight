// shared/schema.ts

import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  decimal, 
  timestamp, 
  boolean, 
  index, 
  json // <--- Added json import for session table
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==========================================
// 1. TABLE DEFINITIONS
// ==========================================

// --- AUTHENTICATION ---
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password"), 
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone").unique(),
  googleId: text("google_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(), 
  
  // Security Fields
  resetToken: text("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
  verificationCode: text("verification_code"), 
  verificationCodeExpires: timestamp("verification_code_expires"),
  isVerified: boolean("is_verified").default(false).notNull(),
});

// --- PROFILE & GAMIFICATION HUB ---
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  userType: text("user_type").notNull(), 
  currentBalance: decimal("current_balance", { precision: 12, scale: 2 }).default("0"),
  totalSavings: decimal("total_savings", { precision: 12, scale: 2 }).default("0"),
  salaryAmount: decimal("salary_amount", { precision: 12, scale: 2 }),
  salaryDate: integer("salary_date"), 
  
  // Gamification Engine
  rewardPoints: integer("reward_points").default(0),
  tier: text("tier").default("The Spark"), 
  
  // Goal Engine
  goalType: text("goal_type").$type<'monthly_amount' | 'percentage_income'>().default('monthly_amount'),
  targetValue: varchar("target_value"), 
}, (table) => {
  return {
    profileUserIdIdx: index("profile_user_id_idx").on(table.userId),
  };
});

// --- BEHAVIORAL LOGS (The "Smart Choices" History) ---
export const behavioralSavings = pgTable("behavioral_savings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  behaviorType: text("behavior_type").notNull(), 
  estimatedAmount: decimal("estimated_amount", { precision: 12, scale: 2 }).notNull(),
  xpAwarded: integer("xp_awarded").default(0),
  
  loggedAt: timestamp("logged_at").defaultNow(), 
}, (table) => {
  return {
    bsUserIdIdx: index("bs_user_id_idx").on(table.userId),
    bsLoggedAtIdx: index("bs_logged_at_idx").on(table.loggedAt), 
  };
});

// --- TRANSACTIONS (Core Ledger) ---
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
}, (table) => {
  return {
    txUserIdIdx: index("tx_user_id_idx").on(table.userId), 
    txDateIdx: index("tx_date_idx").on(table.date),        
    txTypeIdx: index("tx_type_idx").on(table.type),        
  };
});

// --- SETTINGS (Preferences) ---
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  expenseAlerts: boolean("expense_alerts").default(true),
  weeklyReport: boolean("weekly_report").default(true),
  rewardUpdates: boolean("reward_updates").default(false),
  biometricLogin: boolean("biometric_login").default(false),
  
  currency: text("currency").default("INR"),
});

// --- SESSIONS (For connect-pg-simple) ---
export const sessions = pgTable("session", {
  sid: varchar("sid").primaryKey().notNull(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

// ==========================================
// 2. ZOD SCHEMAS (Validation Layer)
// ==========================================

export const insertUserSchema = createInsertSchema(users, {
  password: z.string().min(8, "Password must be at least 8 characters").nullable().optional(),
  email: z.string().email("Invalid email address"),
}).omit({ 
  id: true, 
  createdAt: true,
  resetToken: true,
  resetTokenExpires: true,
  verificationCode: true,
  verificationCodeExpires: true
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ 
  id: true 
});

export const insertBehavioralSavingsSchema = createInsertSchema(behavioralSavings).omit({ 
  id: true, 
  loggedAt: true 
});
// Export Alias to match routes usage
export const insertBehavioralLogSchema = insertBehavioralSavingsSchema;

export const insertTransactionSchema = createInsertSchema(transactions, {
  amount: z.string()
    .min(1, "Amount is required.")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, { message: "Amount must be a valid positive number." }),
  date: z.union([z.string(), z.date()]).pipe(z.coerce.date()), 
}).omit({ 
  id: true, 
  createdAt: true 
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ 
  id: true 
});

// ==========================================
// 3. TYPES (Exported for Frontend Use)
// ==========================================

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type BehavioralLog = typeof behavioralSavings.$inferSelect; 
export type InsertBehavioralLog = z.infer<typeof insertBehavioralSavingsSchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;