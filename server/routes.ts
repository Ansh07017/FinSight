// server/routes.ts (The entire file, focusing on Auth routes)

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

// Setup Passport
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
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

// Helper function to check if onboarding is complete (FIX)
const needsOnboarding = async (userId: string): Promise<boolean> => {
    try {
        const profile = await storage.getUserProfile(userId);
        // Onboarding is needed if the profile is missing, or if userType is not set
        return !profile || !profile.userType;
    } catch (e) {
        // If storage fails to find the profile, assume onboarding is required
        return true; 
    }
}


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session setup
  const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
  });

  app.use(
    session({
      store: new pgStore({ pool }),
      secret: process.env.SESSION_SECRET || "finsaver-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // ========== Auth Routes ==========
  
  // Change Password (Task 1: Confirmed Server-side fix)
  app.put("/api/auth/password", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Both current and new passwords are required" });
      }

      // 1. Get user with password hash (using the storage layer)
      const userData = await storage.getUser(user.id);
      if (!userData) return res.status(404).json({ message: "User not found" });

      // 2. Verify current password
      const isValid = await bcrypt.compare(currentPassword, userData.password);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid current password" });
      }

      // 3. Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashedPassword });
      return res.status(204).send()
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Failed to update password." });
    }
  });

  // Delete Account
  app.delete("/api/auth/account", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ message: "Password is required to confirm deletion" });
      }

      const userData = await storage.getUser(user.id);
    if (!userData) {
    return res.status(404).json({ message: "User not found" });
    }
      const isValid = await bcrypt.compare(password, userData.password);
      if (!isValid) {
        return res.status(400).json({ message: "Incorrect password. Deletion cancelled." });
      }

      
      await storage.deleteUser(user.id);

      req.logout((err) => {
        if (err) return res.status(500).json({ message: "Account deleted, but logout failed" });
        res.json({ message: "Account permanently deleted" });
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });


  // Register (FIXED: Added async and needsOnboarding flag)
  app.post("/api/auth/register", async (req, res, next) => {
    
    try {
      const { username, password } = insertUserSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, password: hashedPassword });
      
      // Create default settings
      await storage.createUserSettings({ userId: user.id });

      req.login(user, async (err) => { // Must be async here
        if (err) return next(err);
        res.json({ user: { id: user.id, username: user.username, needsOnboarding: true } }); // Always true after register
      });
    } catch (error: any) {
 
console.error("REGISTRATION TIMEOUT/FAILURE. FULL ERROR OBJECT:", error); 
    }
  });

  // Login (FIXED: Added async and needsOnboarding flag)
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => { // Must be async here
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message });

      req.login(user, async (err) => { // Must be async here
        if (err) return next(err);
        
        const onboardingRequired = await needsOnboarding(user.id);

        res.json({ 
            user: { 
                id: user.id, 
                username: user.username,
                needsOnboarding: onboardingRequired // Dynamic check
            } 
        });
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = req.user as any;
    res.json({ user: { id: user.id, username: user.username } });
  });

  // ========== User Profile Routes ==========
  
  // Get user profile
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const profile = await storage.getUserProfile(user.id);
      const userData = await storage.getUser(user.id);
      
      res.json({ 
        profile,
        user: {
          id: userData?.id,
          username: userData?.username,
          firstName: userData?.firstName,
          lastName: userData?.lastName,
          email: userData?.email,
          phone: userData?.phone,
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create/Update user profile (onboarding)
  app.post("/api/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const existingProfile = await storage.getUserProfile(user.id);
        const { goalType, targetValue } = req.body; 
        if (targetValue !== undefined && targetValue !== null) {
            const numericValue = parseFloat(targetValue);

            if (isNaN(numericValue) || numericValue <= 0) {
                return res.status(400).json({ message: "Target value must be a positive number." });
            }

            if (goalType === 'percentage_income' && numericValue > 100) {
                return res.status(400).json({ message: "Savings percentage cannot exceed 100%." });
            }
            
        }
      if (existingProfile) {
        const updated = await storage.updateUserProfile(user.id, req.body);
        return res.json(updated);
      }

      const profileData = insertUserProfileSchema.parse({
        ...req.body,
        userId: user.id,
      });
      const profile = await storage.createUserProfile(profileData);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update user details
  app.patch("/api/profile/user", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const updated = await storage.updateUser(user.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========== Transaction Routes ==========
  
  // Get all transactions
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const transactions = await storage.getTransactions(user.id);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create transaction
  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        userId: user.id,
      });
      const transaction = await storage.createTransaction(transactionData);
      
      // Update current balance in profile
      const profile = await storage.getUserProfile(user.id);
      if (profile) {
        const currentBalance = parseFloat(profile.currentBalance || "0");
        const amount = parseFloat(transaction.amount);
        const newBalance = transaction.type === "income" 
          ? currentBalance + amount 
          : currentBalance - amount;
        
        await storage.updateUserProfile(user.id, {
          currentBalance: newBalance.toString(),
        });
      }
      
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete transaction
  app.delete("/api/transactions/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const transaction = await storage.getTransaction(req.params.id);
      
      if (!transaction || transaction.userId !== user.id) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      const deleted = await storage.deleteTransaction(req.params.id);
      res.json({ success: deleted });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

// server/routes.ts (Insert this block after the Transaction Routes)

// ========== Behavioral Savings Tracker (B-SAVE) Routes ==========

app.post("/api/behavioral/savings", requireAuth, async (req, res) => {
    try {
        const user = req.user as any;
        // The client sends: behaviorType, estimatedAmount
        const { behaviorType, estimatedAmount } = req.body;

        // 1. Basic Validation (Reused from previous step)
        const amount = parseFloat(estimatedAmount);
        if (!behaviorType || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: "Invalid behavior type or estimated amount." });
        }
        
        // 2. Implement Velocity Cap (Check if storage allows the log)
        const canLog = await storage.checkSavingsVelocity(user.id, amount); 
        if (!canLog) {
            // Note: The storage layer throws an error that includes "Daily limit"
            return res.status(429).json({ 
                message: "Daily XP limit reached for behavioral savings. Check back tomorrow!" 
            });
        }
        
        // 3. Log the saving and calculate/award Instant XP
        // Assumes storage.logBehavioralSavings returns { xpEarned: number, logId: string }
        const result = await storage.logBehavioralSavings(user.id, behaviorType, amount);
        
        // 4. Send back the success and earned XP (This is the JSON the client expects)
        res.json({ 
            message: "Behavioral saving logged successfully.",
            xpEarned: result.xpEarned,
            logId: result.logId
        });

    } catch (error: any) {
        // If the error contains 'Daily limit' from storage.logBehavioralSavings, return 429
        if (error.message.includes("Daily limit")) {
             return res.status(429).json({ message: error.message });
        }
        // General server error fallback (returns JSON, not HTML)
        res.status(500).json({ message: error.message || "Failed to log behavioral saving." });
    }
});

  // ========== Dashboard Routes ==========
  
  // Get dashboard data
app.get("/api/dashboard", requireAuth, async (req, res) => {
    try {
        const user = req.user as any;
        const { range } = req.query; // Get the range filter from the client (e.g., 'week', '15days', 'month')

        let daysToSubtract = 30; // Default to 'month' (30 days)

        switch (range) {
            case 'week':
                daysToSubtract = 7;
                break;
            case '10days':
                daysToSubtract = 10;
                break;
            case '15days':
                daysToSubtract = 15;
                break;
            case 'month':
            default:
                daysToSubtract = 30;
                break;
        }

        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - daysToSubtract); // Calculate start date

        // --- Fetch Data ---
        const profile = await storage.getUserProfile(user.id);
        
        // Using the new, comprehensive storage method
        const dashboardData = await storage.getDashboardData(
            user.id,
            startDate,
            today
        );

        res.json({
            profile,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
            },
            
            monthlyStats: dashboardData.stats,
            recentTransactions: dashboardData.recentTransactions,
            weeklySpendTrend: dashboardData.weeklySpendTrend,
            expensesByCategory: dashboardData.expensesByCategory,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

  // ========== Reports Routes (FIXED CALLS) ==========

  // ========== Reports Routes ==========
  
  // Get monthly report
app.get("/api/reports/monthly", requireAuth, async (req, res) => {
    try {
        const user = req.user as any;
        const { year, month } = req.query;
        
        if (!year || !month) {
            return res.status(400).json({ message: "Year and month are required" });
        }

        const yearInt = parseInt(year as string);
        const monthInt = parseInt(month as string);

        const startDate = new Date(yearInt, monthInt - 1, 1);
        const endDate = new Date(yearInt, monthInt, 0, 23, 59, 59);
        
        // Use the comprehensive dashboard data getter
        const reportData = await storage.getDashboardData(
            user.id,
            startDate,
            endDate
        );

        // Return the core stats expected by the old report endpoint
        res.json(reportData.stats); 
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

  // Get last 6 months report
app.get("/api/reports/history", requireAuth, async (req, res) => {
    try {
        const user = req.user as any;
        const now = new Date();
        const reports = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            
            const yearInt = date.getFullYear();
            const monthInt = date.getMonth() + 1;
            
            const startDate = new Date(yearInt, monthInt - 1, 1);
            const endDate = new Date(yearInt, monthInt, 0, 23, 59, 59);

            // Use the comprehensive dashboard data getter
            const reportData = await storage.getDashboardData(
                user.id,
                startDate,
                endDate
            );

            reports.push({
                month: date.toLocaleString("en-US", { month: "long" }),
                year: date.getFullYear(),
                ...reportData.stats, // Only send the core income/expense/savings stats
            });
        }

        res.json(reports);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

  // ========== Settings Routes ==========
  
  // Get user settings
  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const settings = await storage.getUserSettings(user.id);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update user settings
  app.patch("/api/settings", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const updated = await storage.updateUserSettings(user.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  

  return httpServer;
}