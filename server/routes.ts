/*import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import ConnectPg from "connect-pg-simple";
import pkg from "pg";
const { Pool } = pkg;
import bcrypt from "bcryptjs";
import { storage } from "./storage.ts";
import { insertUserSchema, insertUserProfileSchema, insertTransactionSchema, insertUserSettingsSchema } from "../shared/schema.ts";

const pgStore = ConnectPg(session);

// Setup Passport Local Strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      // If user not found or password missing
      if (!user || !user.password) {
        return done(null, false, { message: "Invalid username or password" });
      }

      // Explicitly await the comparison
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return done(null, false, { message: "Invalid username or password" });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Auth middleware
function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Helper function to check if onboarding is complete
const needsOnboarding = async (userId: string): Promise<boolean> => {
    try {
        const profile = await storage.getUserProfile(userId);
        return !profile || !profile.userType;
    } catch (e) {
        return true; 
    }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
  });

  // Session setup with explicit cookie settings for persistence
  app.use(
    session({
      store: new pgStore({ pool }),
      secret: process.env.SESSION_SECRET || "finsaver-secret-key",
      resave: false,
      saveUninitialized: false,
      proxy: true, 
      cookie: { 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // ========== Auth Routes ==========
  
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, password: hashedPassword });
      
      await storage.createUserSettings({ userId: user.id });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ 
            user: { id: user.id, username: user.username, needsOnboarding: true } 
        });
      });
    } catch (error: any) {
      console.error("REGISTRATION ERROR:", error);
      res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });

      req.login(user, async (err) => {
        if (err) return next(err);
        
        const onboardingRequired = await needsOnboarding(user.id);
        res.json({ 
            user: { 
                id: user.id, 
                username: user.username,
                needsOnboarding: onboardingRequired 
            } 
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = req.user as any;
    res.json({ user: { id: user.id, username: user.username } });
  });

  app.put("/api/auth/password", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { currentPassword, newPassword } = req.body;
      const userData = await storage.getUser(user.id);
      if (!userData) return res.status(404).json({ message: "User not found" });

      const isValid = await bcrypt.compare(currentPassword, userData.password);
      if (!isValid) return res.status(400).json({ message: "Invalid current password" });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashedPassword });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update password." });
    }
  });

  // ========== User Profile Routes ==========
  
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const profile = await storage.getUserProfile(user.id);
      const userData = await storage.getUser(user.id);
      res.json({ profile, user: userData });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const existingProfile = await storage.getUserProfile(user.id);
      if (existingProfile) {
        const updated = await storage.updateUserProfile(user.id, req.body);
        return res.json(updated);
      }
      const profileData = insertUserProfileSchema.parse({ ...req.body, userId: user.id });
      const profile = await storage.createUserProfile(profileData);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========== Transaction Routes ==========
  
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const transactions = await storage.getTransactions(user.id);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const transaction = await storage.createTransaction({ ...req.body, userId: user.id });
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========== User Settings Routes (FIX: Syncs with SettingsPage) ==========

  app.get("/api/settings", requireAuth, async (req: any, res) => {
    try {
      const settings = await storage.getUserSettings(req.user.id);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/settings", requireAuth, async (req: any, res) => {
    try {
      const updatedSettings = await storage.updateUserSettings(req.user.id, req.body);
      res.json(updatedSettings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ========== Behavioral Savings Tracker (B-SAVE) ==========

  // NEW: Fetch history for B-SAVE Chart and Rewards
  app.get("/api/behavioral/savings", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const history = await storage.getBehavioralSavings(user.id);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/behavioral/savings", requireAuth, async (req, res) => {
    try {
        const user = req.user as any;
        const { behaviorType, estimatedAmount } = req.body;
        const amount = parseFloat(estimatedAmount);

        if (!behaviorType || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: "Invalid behavior type or amount." });
        }
        
        const canLog = await storage.checkSavingsVelocity(user.id, amount); 
        if (!canLog) {
            return res.status(429).json({ message: "Daily XP limit reached!" });
        }
        
        const result = await storage.logBehavioralSavings(user.id, behaviorType, amount);
        res.json({ xpEarned: result.xpEarned, logId: result.logId });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
  });

  // ========== Financial Reports Routes ==========

  // NEW: Aggregate historical data for Reports Page charts
  app.get("/api/reports/history", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const history = await storage.getFinancialHistory(user.id);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ========== Dashboard Routes ==========
  
  app.get("/api/dashboard", requireAuth, async (req, res) => {
    try {
        const user = req.user as any;
        const { range } = req.query;
        let days = range === 'week' ? 7 : range === '15days' ? 15 : 30;

        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - days);

        const profile = await storage.getUserProfile(user.id);
        const data = await storage.getDashboardData(user.id, startDate, today);

        res.json({
            profile,
            user: { username: user.username },
            monthlyStats: data.stats,
            recentTransactions: data.recentTransactions,
            weeklySpendTrend: data.weeklySpendTrend,
            expensesByCategory: data.expensesByCategory,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import ConnectPg from "connect-pg-simple";
import pkg from "pg";
const { Pool } = pkg;
import bcrypt from "bcryptjs";
import { storage } from "./storage.ts";
import { insertUserSchema, insertUserProfileSchema, insertTransactionSchema, insertUserSettingsSchema } from "../shared/schema.ts";

const pgStore = ConnectPg(session);

// Setup Passport Local Strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user || !user.password) {
        return done(null, false, { message: "Invalid username or password" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return done(null, false, { message: "Invalid username or password" });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Auth middleware
function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Onboarding Helper
const needsOnboarding = async (userId: string): Promise<boolean> => {
    try {
        const profile = await storage.getUserProfile(userId);
        return !profile || !profile.userType;
    } catch (e) {
        return true; 
    }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
  });

  app.use(
    session({
      store: new pgStore({ pool }),
      secret: process.env.SESSION_SECRET || "finsaver-secret-key",
      resave: false,
      saveUninitialized: false,
      proxy: true, 
      cookie: { 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // ========== Auth Routes ==========
  
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) return res.status(400).json({ message: "Username already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, password: hashedPassword });
      await storage.createUserSettings({ userId: user.id });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ 
            user: { id: user.id, username: user.username, needsOnboarding: true } 
        });
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });

      req.login(user, async (err) => {
        if (err) return next(err);
        const onboardingRequired = await needsOnboarding(user.id);
        res.json({ 
            user: { id: user.id, username: user.username, needsOnboarding: onboardingRequired } 
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = req.user as any;
    res.json({ user: { id: user.id, username: user.username } });
  });

  app.put("/api/auth/password", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { currentPassword, newPassword } = req.body;
      const userData = await storage.getUser(user.id);
      if (!userData) return res.status(404).json({ message: "User not found" });

      const isValid = await bcrypt.compare(currentPassword, userData.password);
      if (!isValid) return res.status(400).json({ message: "Invalid current password" });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashedPassword });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update password." });
    }
  });

  // ========== Profile Routes (Modularized) ==========
  
  // High-speed Sidebar Summary
  app.get("/api/profile/summary", requireAuth, async (req, res) => {
    const user = req.user as any;
    const summary = await storage.getProfileSummary(user.id);
    res.json(summary);
  });

  // Granular Financial Data
  app.get("/api/profile/financial", requireAuth, async (req, res) => {
    const user = req.user as any;
    const profile = await storage.getUserProfile(user.id);
    res.json({ 
        currentBalance: profile?.currentBalance, 
        totalSavings: profile?.totalSavings 
    });
  });

  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const profile = await storage.getUserProfile(user.id);
      const userData = await storage.getUser(user.id);
      res.json({ profile, user: userData });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const existingProfile = await storage.getUserProfile(user.id);
      if (existingProfile) {
        const updated = await storage.updateUserProfile(user.id, req.body);
        return res.json(updated);
      }
      const profileData = insertUserProfileSchema.parse({ ...req.body, userId: user.id });
      const profile = await storage.createUserProfile(profileData);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========== Transaction Routes (Modularized) ==========
  
  app.get("/api/transactions/recent", requireAuth, async (req, res) => {
    const user = req.user as any;
    const transactions = await storage.getRecentTransactions(user.id, 10);
    res.json(transactions);
  });

  app.get("/api/transactions", requireAuth, async (req, res) => {
    const user = req.user as any;
    const transactions = await storage.getTransactions(user.id);
    res.json(transactions);
  });

  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const transaction = await storage.createTransaction({ ...req.body, userId: user.id });
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========== Dashboard Routes (Speed Optimized) ==========
  
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    const user = req.user as any;
    const stats = await storage.getDashboardStats(user.id);
    res.json(stats);
  });

  app.get("/api/dashboard/trend", requireAuth, async (req, res) => {
    const user = req.user as any;
    const trend = await storage.getWeeklySpendTrend(user.id);
    res.json(trend);
  });

  app.get("/api/dashboard/categories", requireAuth, async (req, res) => {
    const user = req.user as any;
    const categories = await storage.getCategoryBreakdown(user.id);
    res.json(categories);
  });

  // ========== Behavioral Savings (Modularized) ==========

  app.get("/api/behavioral/summary", requireAuth, async (req, res) => {
    const user = req.user as any;
    const summary = await storage.getBehavioralSummary(user.id);
    res.json(summary);
  });

  app.get("/api/behavioral/savings", requireAuth, async (req, res) => {
    const user = req.user as any;
    const history = await storage.getBehavioralSavings(user.id);
    res.json(history);
  });

  app.post("/api/behavioral/savings", requireAuth, async (req, res) => {
    try {
        const user = req.user as any;
        const result = await storage.logBehavioralSavings(user.id, req.body.behaviorType, parseFloat(req.body.estimatedAmount));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
  });

  // ========== Settings & Reports ==========

  app.get("/api/settings", requireAuth, async (req, res) => {
    const user = req.user as any;
    const s = await storage.getUserSettings(user.id);
    res.json(s);
  });

  app.patch("/api/settings", requireAuth, async (req, res) => {
    const user = req.user as any;
    const s = await storage.updateUserSettings(user.id, req.body);
    res.json(s);
  });

  app.get("/api/reports/history", requireAuth, async (req, res) => {
    const user = req.user as any;
    const h = await storage.getFinancialHistory(user.id);
    res.json(h);
  });

  return httpServer;
}
*/
// server/routes.ts

import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import ConnectPg from "connect-pg-simple";
import pkg from "pg";
const { Pool } = pkg;
import bcrypt from "bcryptjs";
import { storage } from "./storage.ts";
import { insertUserSchema, insertUserProfileSchema, insertTransactionSchema, insertUserSettingsSchema } from "../shared/schema.ts";

const pgStore = ConnectPg(session);

// Setup Passport Local Strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user || !user.password) {
        return done(null, false, { message: "Invalid username or password" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return done(null, false, { message: "Invalid username or password" });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Auth middleware
function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Onboarding Helper
const needsOnboarding = async (userId: string): Promise<boolean> => {
    try {
        const profile = await storage.getUserProfile(userId);
        return !profile || !profile.userType;
    } catch (e) {
        return true; 
    }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Express> {
  const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
  });
  app.set("trust proxy", 1);
  app.use(
    session({
      store: new pgStore({ pool }),
      secret: process.env.SESSION_SECRET || "finsaver-secret-key",
      resave: false,
      saveUninitialized: false,
      proxy: true, 
      cookie: { 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // ========== Auth Routes ==========
  
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) return res.status(400).json({ message: "Username already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, password: hashedPassword });
      await storage.createUserSettings({ userId: user.id });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ 
            user: { id: user.id, username: user.username, needsOnboarding: true } 
        });
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });

      req.login(user, async (err) => {
        if (err) return next(err);
        const onboardingRequired = await needsOnboarding(user.id);
        res.json({ 
            user: { id: user.id, username: user.username, needsOnboarding: onboardingRequired } 
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = req.user as any; // Type cast to resolve TS error
    res.json({ user: { id: user.id, username: user.username } });
  });

  // ADDED: Missing Delete Account Route to fix "Deletion Failed"
  app.delete("/api/auth/account", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { password } = req.body;
      
      const userData = await storage.getUser(user.id);
      if (!userData) return res.status(404).json({ message: "User not found" });

      const isValid = await bcrypt.compare(password, userData.password);
      if (!isValid) return res.status(400).json({ message: "Invalid password to confirm deletion" });

      await storage.deleteUser(user.id); // Ensure deleteUser is implemented in storage.ts
      
      req.logout((err) => {
        if (err) return res.status(500).json({ message: "Error during logout" });
        res.status(204).send();
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete account" });
    }
  });

  app.put("/api/auth/password", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { currentPassword, newPassword } = req.body;
      const userData = await storage.getUser(user.id);
      if (!userData) return res.status(404).json({ message: "User not found" });

      const isValid = await bcrypt.compare(currentPassword, userData.password);
      if (!isValid) return res.status(400).json({ message: "Invalid current password" });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashedPassword });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update password." });
    }
  });

  // ========== Profile Routes (Modularized) ==========
  
  // High-speed Sidebar Summary
  app.get("/api/profile/summary", requireAuth, async (req, res) => {
    const user = req.user as any;
    const summary = await storage.getProfileSummary(user.id);
    res.json(summary);
  });

  // Granular Financial Data
  app.get("/api/profile/financial", requireAuth, async (req, res) => {
    const user = req.user as any;
    const profile = await storage.getUserProfile(user.id);
    res.json({ 
        currentBalance: profile?.currentBalance, 
        totalSavings: profile?.totalSavings 
    });
  });

  // ADDED: Route for Settings Page profile updates
  app.patch("/api/profile/user", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const updatedUser = await storage.updateUser(user.id, req.body);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update profile details" });
    }
  });

  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const profile = await storage.getUserProfile(user.id);
      const userData = await storage.getUser(user.id);
      res.json({ profile, user: userData });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const existingProfile = await storage.getUserProfile(user.id);
      if (existingProfile) {
        const updated = await storage.updateUserProfile(user.id, req.body);
        return res.json(updated);
      }
      const profileData = insertUserProfileSchema.parse({ ...req.body, userId: user.id });
      const profile = await storage.createUserProfile(profileData);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========== Transaction Routes (Modularized) ==========
  
  app.get("/api/transactions/recent", requireAuth, async (req, res) => {
    const user = req.user as any;
    const transactions = await storage.getRecentTransactions(user.id, 10);
    res.json(transactions);
  });

  app.get("/api/transactions", requireAuth, async (req, res) => {
    const user = req.user as any;
    const transactions = await storage.getTransactions(user.id);
    res.json(transactions);
  });

  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const transaction = await storage.createTransaction({ ...req.body, userId: user.id });
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========== Dashboard Routes (Speed Optimized) ==========
  
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    const user = req.user as any;
    const stats = await storage.getDashboardStats(user.id);
    res.json(stats);
  });

  app.get("/api/dashboard/trend", requireAuth, async (req, res) => {
    const user = req.user as any;
    const trend = await storage.getWeeklySpendTrend(user.id);
    res.json(trend);
  });

  app.get("/api/dashboard/categories", requireAuth, async (req, res) => {
    const user = req.user as any;
    const categories = await storage.getCategoryBreakdown(user.id);
    res.json(categories);
  });

  // ========== Behavioral Savings (Modularized) ==========

  app.get("/api/behavioral/summary", requireAuth, async (req, res) => {
    const user = req.user as any;
    const summary = await storage.getBehavioralSummary(user.id);
    res.json(summary);
  });

  app.get("/api/behavioral/savings", requireAuth, async (req, res) => {
    const user = req.user as any;
    const history = await storage.getBehavioralSavings(user.id);
    res.json(history);
  });

  app.post("/api/behavioral/savings", requireAuth, async (req, res) => {
    try {
        const user = req.user as any;
        const result = await storage.logBehavioralSavings(user.id, req.body.behaviorType, parseFloat(req.body.estimatedAmount));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
  });

  // ========== Settings & Reports ==========

  app.get("/api/settings", requireAuth, async (req, res) => {
    const user = req.user as any;
    const s = await storage.getUserSettings(user.id);
    res.json(s);
  });

  app.patch("/api/settings", requireAuth, async (req, res) => {
    const user = req.user as any;
    const s = await storage.updateUserSettings(user.id, req.body);
    res.json(s);
  });

  app.get("/api/reports/history", requireAuth, async (req, res) => {
    const user = req.user as any;
    const h = await storage.getFinancialHistory(user.id);
    res.json(h);
  });

  return app;
}