// client/src/App.tsx

import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/components/AuthContext"; 
import { Loader2 } from "lucide-react";

// --- LAYOUT ---
import Layout from "@/components/layout"; 

// --- PAGES ---
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth";
import ExpensesPage from "@/pages/expenses";
import SettingsPage from "@/pages/settings";
import ReportsPage from "@/pages/reports";
import OnboardingPage from "@/pages/onboarding";
import ResetPassword from "@/pages/resetpassword";
import LeaderBoardPage from "@/pages/leaderboard";
import VerifyOTP from "@/pages/verifyotp";
import GrowthPage from "@/pages/growth"; 

// 1. PROTECTED ROUTE WRAPPER
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  // FIX: Destructure 'onboardingCompleted' directly from useAuth
  const { onboardingCompleted, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#00D4AA]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/auth");
    return null;
  }

  // FIX: Use the boolean flag from context instead of checking userProfile directly
  if (!onboardingCompleted) {
    setLocation("/onboarding");
    return null;
  }

  // If all good, render the Layout + Page
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function AppRouter() {
  return (
    <Switch>
      {/* 2. PUBLIC ROUTES (No Layout) */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/resetpassword" component={ResetPassword} />
      <Route path="/verifyotp" component={VerifyOTP} />
      
      {/* Onboarding is protected but has its own layout logic usually, 
          or we can leave it outside the main Layout */}
      <Route path="/onboarding" component={OnboardingPage} />

      {/* 3. PROTECTED ROUTES (Wrapped in Layout via ProtectedRoute) */}
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/expenses" component={() => <ProtectedRoute component={ExpensesPage} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={ReportsPage} />} />
      
      {/* The New Consolidated Page */}
      <Route path="/growth" component={() => <ProtectedRoute component={GrowthPage} />} />
      
      <Route path="/leaderboard" component={() => <ProtectedRoute component={LeaderBoardPage} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />

      {/* 4. CATCH-ALL */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppRouter />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;