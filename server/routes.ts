// server/routes.ts

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import ConnectPg from "connect-pg-simple";
import pkg from "pg";
import bcrypt from "bcryptjs";
import rateLimit from 'express-rate-limit';

import { storage } from "./storage";
import { sendEmail } from "./lib/mail";
import { 
  insertUserSchema, 
  insertUserProfileSchema, 
  insertTransactionSchema, 
  insertBehavioralLogSchema
} from "@shared/schema";

const pgStore = ConnectPg(session);
const { Pool } = pkg;

// =========================================================
//  GAMIFICATION ENGINE (Server-Side Authority)
// =========================================================

// 1. TIER CALCULATION
const calculateTier = (xp: number, createdAt: Date | null) => {
    const now = new Date().getTime();
    const startDate = createdAt ? new Date(createdAt) : new Date();
    const start = startDate.getTime();
    
    const daysActive = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
    
    if (xp >= 50000 && daysActive >= 225) return "The Visionary";
    if (xp >= 25000 && daysActive >= 105) return "The Architect";
    if (xp >= 10000 && daysActive >= 45)  return "The Strategist";
    if (xp >= 2000  && daysActive >= 15)  return "The Pathfinder";
    
    return "The Spark";
};

// 2. EFFICIENCY MULTIPLIER
const calculateEfficiencyMultiplier = async (userId: string) => {
    const stats = await storage.getDashboardStats(userId);
    const income = Number(stats.income);
    const savings = Number(stats.savings);
    
    if (income <= 0) return 1.0;
    
    const rate = (savings / income) * 100;
    if (rate > 30) return 1.5; 
    if (rate > 20) return 1.2; 
    return 1.0; 
};

// --- RATE LIMITERS ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 3,
  message: { message: "Please wait before requesting another code." },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- PASSPORT CONFIG ---
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await storage.getUserByemail(email);
    if (!user || !user.password) return done(null, false, { message: "Invalid credentials" });
    if (!user.isVerified) return done(null, false, { message: "Please verify your account first." });
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? done(null, user) : done(null, false, { message: "Invalid credentials" });
  } catch (err) { return done(err); }
}));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackURL: "/api/auth/google/callback",
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await storage.getUserByGoogleId(profile.id);
      if (!user) {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email found in Google profile"));
        user = await storage.getUserByemail(email);
        if (user) {
          user = await storage.updateUser(user.id, { googleId: profile.id });
        } else {
          user = await storage.createUser({
            email, googleId: profile.id, firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "", password: null, 
          });
          await storage.createUserSettings({ userId: user.id });
        }
      }
      return done(null, user);
    } catch (err) { return done(err); }
  }
));

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) { done(error); }
});

// --- MIDDLEWARE ---
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
}

// Blocks users without passwords (Social Logins)
async function requirePasswordUser(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;
  const userData = await storage.getUser(user.id);
  if (!userData) return res.status(404).json({ message: "User not found" });
  if (!userData.password) return res.status(400).json({ message: "Action not allowed for social accounts. Please create a password in settings." });
  (req as any).fullUser = userData; 
  next();
}

const needsOnboarding = async (userId: string): Promise<boolean> => {
  try {
    const profile = await storage.getUserProfile(userId);
    return !profile || !profile.userType; 
  } catch { return true; }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Express> {
  const pool = new Pool({ connectionString: process.env.PG_CONNECTION_STRING });
  
  app.set("trust proxy", 1);
  app.use(session({
    store: new pgStore({ pool, tableName: 'session', createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || "finsaver-secret-key",
    resave: false, saveUninitialized: false, proxy: true,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" },
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // ========== AUTH ROUTES ==========
  app.post("/api/auth/login", loginLimiter, (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Auth failed" });
      req.login(user, async (err) => {
        if (err) return next(err);
        const onboarding = await needsOnboarding(user.id);
        res.json({ user: { id: user.id, email: user.email, needsOnboarding: onboarding } });
      });
    })(req, res, next);
  });

  app.post("/api/auth/register", otpLimiter, async (req, res) => {
    try {
      const parsedBody = insertUserSchema.parse(req.body);
      if (!parsedBody.password) return res.status(400).json({ message: "Password required" });
      
      const { email, password } = parsedBody;
      if (await storage.getUserByemail(email)) return res.status(400).json({ message: "Email exists" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ email, password: hashedPassword, isVerified: false });
      const otp = await storage.generateOTP(user.id);

      await sendEmail(email, 'Verify FinSight', 
        `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:8px;">
           <h2>Welcome to FinSight!</h2><p>Your verification code:</p>
           <h1 style="color:#00D4AA;background:#f9f9f9;padding:10px;display:inline-block;">${otp}</h1>
         </div>`);
      res.status(201).json({ userId: user.id, requiresVerification: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => res.json({ message: "Logged out" }));
  });

  // 1. UPDATED ME ROUTE: Returns hasPassword flag
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = req.user as any;
    const fullUser = await storage.getUser(user.id);
    res.json({ 
        user: { 
            id: user.id, 
            email: user.email,
            // Boolean flag for Settings page
            hasPassword: !!fullUser?.password 
        } 
    });
  });

  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  app.get("/api/auth/google/callback", passport.authenticate("google", { failureRedirect: "/auth" }),
    async (req, res) => {
      const user = req.user as any;
      const onboarding = await needsOnboarding(user.id);
      res.redirect(onboarding ? "/onboarding" : "/");
    }
  );

  // ========== ACCOUNT RECOVERY ==========
  app.post("/api/auth/verifyotp", async (req, res) => {
    const { userId, code } = req.body;
    if (await storage.verifyUser(userId, code)) {
      const user = await storage.getUser(userId);
      if (user) return req.login(user, () => res.json({ message: "Verified" }));
    }
    res.status(400).json({ message: "Invalid code" });
  });

  app.post("/api/auth/resendotp", otpLimiter, async (req, res) => {
    const { userId } = req.body;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = await storage.generateOTP(user.id);
    await sendEmail(user.email, 'Your New Verification Code', 
      `<p>Your new verification code is: <strong>${otp}</strong></p>`);
    res.json({ message: "OTP resent" });
  });

  // --- UPDATED FORGOT PASSWORD ROUTE (Hybrid Logic) ---
  app.post("/api/auth/forgotpassword", otpLimiter, async (req, res) => {
    const { email } = req.body;
    const user = await storage.getUserByemail(email);
    
    // FIX: Only block if user doesn't exist OR (is Google user AND has NO password)
    // This allows "Hybrid" users (Google + Password) to reset their password.
    if (!user || (user.googleId && !user.password)) {
      return res.status(404).json({ message: "User not found or uses Google login" });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await storage.setResetToken(user.id, otp, new Date(Date.now() + 3600000));
    
    await sendEmail(email, 'Reset Password', 
      `<div style="font-family:sans-serif; padding:20px;">
         <h2>Password Reset Request</h2>
         <p>Use the code below to reset your password:</p>
         <h1 style="color:#00D4AA; background:#f4f4f5; padding:10px; display:inline-block; letter-spacing: 5px;">${otp}</h1>
         <p style="color:#666; font-size:12px; margin-top:20px;">If you didn't request this, you can safely ignore this email.</p>
       </div>`
    );
    res.json({ message: "Code sent", userId: user.id });
  });

  app.post("/api/auth/resetpassword", async (req, res) => {
    const { token, newPassword, userId } = req.body;
    const user = await storage.getUser(userId);
    if (!user || user.resetToken !== token || new Date() > (user.resetTokenExpires || 0)) return res.status(400).json({ message: "Invalid code" });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await storage.updateUser(user.id, { password: hashedPassword, resetToken: null, resetTokenExpires: null });
    res.json({ message: "Password updated" });
  });

  // 2. DELETE ACCOUNT: Strictly Enforces Password
  // We keep 'requirePasswordUser' here. If a Google user tries this, 
  // they get 400 and are told to set a password first.
  app.delete("/api/auth/account", requireAuth, requirePasswordUser, async (req, res) => {
    const { password } = req.body;
    const user = (req as any).fullUser;

    if (!await bcrypt.compare(password, user.password)) {
        return res.status(400).json({ message: "Invalid password" });
    }
    
    await storage.deleteUser(user.id);
    req.logout(() => res.status(204).send());
  });

  // 3. UPDATE PASSWORD (Hybrid Logic)
  // Removed 'requirePasswordUser' so Google users can access this to set their first password
  app.put("/api/auth/password", requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = (req.user as any).id;
    const user = await storage.getUser(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Scenario A: User HAS a password (Standard Change)
    if (user.password) {
        if (!currentPassword) return res.status(400).json({ message: "Current password is required." });
        
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid current password." });
    }
    // Scenario B: User has NO password (Google user first-time setup) -> Skip check

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await storage.updateUser(user.id, { password: hashedPassword });
    
    res.status(200).json({ message: "Password updated successfully" });
  });

  // ========== CORE DATA ROUTES ==========

  // Profile
  app.get("/api/profile", requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const [profile, user] = await Promise.all([storage.getUserProfile(userId), storage.getUser(userId)]);
    res.json({ profile, user });
  });

  app.get("/api/profile/summary", requireAuth, async (req, res) => {
    res.json(await storage.getProfileSummary((req.user as any).id));
  });

  app.post("/api/profile", requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const existing = await storage.getUserProfile(userId);
    if (existing) return res.json(await storage.updateUserProfile(userId, req.body));
    
    const parseResult = insertUserProfileSchema.safeParse({ ...req.body, userId });
    if (!parseResult.success) {
        return res.status(400).json(parseResult.error);
    }
    res.json(await storage.createUserProfile(parseResult.data));
  });

  app.patch("/api/profile/user", requireAuth, async (req, res) => {
    res.json(await storage.updateUser((req.user as any).id, req.body));
  });

  // Transactions
  app.get("/api/transactions", requireAuth, async (req, res) => {
    res.json(await storage.getTransactions((req.user as any).id));
  });

  app.get("/api/transactions/recent", requireAuth, async (req, res) => {
    res.json(await storage.getRecentTransactions((req.user as any).id, 10));
  });

  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const data = insertTransactionSchema.parse({ ...req.body, userId: (req.user as any).id });
      res.json(await storage.createTransaction(data));
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.delete("/api/transactions/:id", requireAuth, async (req, res) => {
    const success = await storage.deleteTransaction(req.params.id);
    success ? res.status(204).send() : res.status(404).json({ message: "Not found" });
  });

  // Dashboard
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    res.json(await storage.getDashboardStats((req.user as any).id, req.query.period as string));
  });
  
  app.get("/api/dashboard/trend", requireAuth, async (req, res) => {
    res.json(await storage.getWeeklySpendTrend((req.user as any).id, req.query.period as string));
  });
  
  app.get("/api/dashboard/categories", requireAuth, async (req, res) => {
    res.json(await storage.getCategoryBreakdown((req.user as any).id, req.query.period as string));
  });

  // =========================================================
  //  GROWTH & BEHAVIORAL LOGIC 
  // =========================================================

  app.get("/api/behavioral/savings", requireAuth, async (req, res) => {
    res.json(await storage.getBehavioralLogs((req.user as any).id));
  });

app.post("/api/behavioral/savings", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const parseResult = insertBehavioralLogSchema.safeParse(req.body);
      if (!parseResult.success) return res.status(400).json(parseResult.error);

      const { behaviorType, estimatedAmount } = parseResult.data;
      
      const multiplier = await calculateEfficiencyMultiplier(userId);
      
      let baseXp = 0;
      switch (behaviorType) {
          case "Skipped Coffee": baseXp = 50; break;
          case "Took Metro/Walk": baseXp = 30; break;
          case "Cooked at Home": baseXp = 100; break;
          case "Delayed Impulse": baseXp = 150; break;
          default: baseXp = Math.floor(parseFloat(estimatedAmount as string) * 0.1 + 10); 
      }

      let xpEarned = Math.floor(baseXp * multiplier);

      if (xpEarned > 250) xpEarned = 250;

      const canEarn = await storage.checkDailyXPCap(userId);
      if(!canEarn) xpEarned = 0; 

      const log = await storage.createBehavioralLog({
        userId,
        behaviorType,
        estimatedAmount: estimatedAmount as string,
        xpAwarded: xpEarned
      });

      const currentProfile = await storage.getUserProfile(userId);
      const newTotalXP = (currentProfile?.rewardPoints || 0) + xpEarned;

      const user = await storage.getUser(userId);
      const newTier = calculateTier(newTotalXP, user ? user.createdAt : null);

      await storage.updateUserProfile(userId, {
        rewardPoints: newTotalXP,
        tier: newTier
      });

      res.status(201).json({ ...log, xpEarned, newTier, totalXP: newTotalXP, multiplierApplied: multiplier });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/growth/claim-bonus", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const stats = await storage.getDashboardStats(userId, "30d");
      const profile = await storage.getUserProfile(userId);
      
      if (!profile?.targetValue || Number(profile.targetValue) <= 0) {
        return res.status(400).json({ message: "No goal set." });
      }

      const savings = Number(stats.savings);
      const target = Number(profile.targetValue);
      
      if (savings < target) {
        return res.status(400).json({ message: "Goal not met yet." });
      }

      const logs = await storage.getBehavioralLogs(userId);
      const currentMonth = new Date().getMonth();
      
      const alreadyClaimed = logs.some(log => 
        log.behaviorType === "Monthly Goal Bonus" && 
        (log.loggedAt ? new Date(log.loggedAt).getMonth() : -1) === currentMonth
      );

      if (alreadyClaimed) {
        return res.status(400).json({ message: "Bonus already claimed for this month." });
      }

      const bonusXP = 1000;
      await storage.createBehavioralLog({
        userId,
        behaviorType: "Monthly Goal Bonus",
        estimatedAmount: savings.toString(),
        xpAwarded: bonusXP
      });

      const newTotalXP = (profile.rewardPoints || 0) + bonusXP;
      const user = await storage.getUser(userId);
      
      const newTier = calculateTier(newTotalXP, user ? user.createdAt : null);

      await storage.updateUserProfile(userId, { rewardPoints: newTotalXP, tier: newTier });

      res.json({ message: "Bonus claimed!", xpEarned: bonusXP, newTier });

    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/behavioral/summary", requireAuth, async (req, res) => {
    res.json(await storage.getBehavioralSummary((req.user as any).id));
  });

  // Settings & Reports
  app.get("/api/settings", requireAuth, async (req, res) => res.json(await storage.getUserSettings((req.user as any).id)));
  app.patch("/api/settings", requireAuth, async (req, res) => res.json(await storage.updateUserSettings((req.user as any).id, req.body)));
  app.get("/api/reports/history", requireAuth, async (req, res) => res.json(await storage.getFinancialHistory((req.user as any).id)));
  app.get("/api/leaderboard", requireAuth, async (req, res) => res.json(await storage.getLeaderboard()));

  return app;
}