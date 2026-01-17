// client/src/App.tsx

import { useEffect } from "react"; // 👈 Required to fix the React crash
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

// 1. PROTECTED ROUTE WRAPPER (Fixed: No crashing)
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { onboardingCompleted, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // ✅ FIX: Redirect inside useEffect to satisfy React rules
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setLocation("/auth");
      } else if (!onboardingCompleted) {
        setLocation("/onboarding");
      }
    }
  }, [isLoading, isAuthenticated, onboardingCompleted, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#00D4AA]" />
      </div>
    );
  }

  // ✅ SECURITY: Render nothing if not allowed
  if (!isAuthenticated || !onboardingCompleted) {
    return null;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function AppRouter() {
  return (
    <Switch>
      {/* 2. PUBLIC ROUTES */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/resetpassword" component={ResetPassword} />
      
      {/* ✅ CORRECT: NO HYPHEN here either */}
      <Route path="/verifyotp" component={VerifyOTP} />
      
      <Route path="/onboarding" component={OnboardingPage} />

      {/* 3. PROTECTED ROUTES */}
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/expenses" component={() => <ProtectedRoute component={ExpensesPage} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={ReportsPage} />} />
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