// client/src/App.tsx
/*
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth";
import ExpensesPage from "@/pages/expenses";
import BehavioralSavings from "@/pages/behavioralSavings";
import RewardsPage from "@/pages/rewards";
import SettingsPage from "@/pages/settings";
import ReportsPage from "@/pages/reports";
import OnboardingPage from "@/pages/onboarding";
import { AuthProvider } from "@/components/AuthContext"; 
import Layout from "@/components/layout"; 


function AppRouter() {
  return (
    <Switch>
      // 1. UNPROTECTED ROUTES 
      <Route path="/auth" component={AuthPage} />
      <Route path="/onboarding" component={OnboardingPage} />

      // 2. EXPLICIT ROOT ROUTE (This MUST be the highest priority protected route) 
      <Route path="/">
        <Layout>
          <Dashboard />
        </Layout>
      </Route>

     
      <Route path="/:rest*">
        <Layout>
          // Inner switch for all non-root routes 
          <Switch>
            <Route path="/expenses" component={ExpensesPage} />
            <Route path="/rewards" component={RewardsPage} />
            <Route path="/reports" component={ReportsPage} />
            <Route path="/behavioralSavings" component={BehavioralSavings} />
            <Route path="/settings" component={SettingsPage} />
            
            // Fallback route inside the Layout 
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
      
      // 4. Global Fallback 
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
*/
// client/src/App.tsx

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth";
import ExpensesPage from "@/pages/expenses";
import BehavioralSavings from "@/pages/behavioralSavings";
import RewardsPage from "@/pages/rewards";
import SettingsPage from "@/pages/settings";
import ReportsPage from "@/pages/reports";
import OnboardingPage from "@/pages/onboarding";
import { AuthProvider } from "@/components/AuthContext"; 
import Layout from "@/components/layout"; 

function AppRouter() {
  return (
    <Switch>
      {/* 1. PUBLIC & ONBOARDING ROUTES (No Layout shell) */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/onboarding" component={OnboardingPage} />

      {/* 2. PROTECTED ROUTES (Wrapped in Layout) */}
      <Route path="/">
        <Layout><Dashboard /></Layout>
      </Route>
      <Route path="/expenses">
        <Layout><ExpensesPage /></Layout>
      </Route>
      <Route path="/behavioralSavings">
        <Layout><BehavioralSavings /></Layout>
      </Route>
      <Route path="/rewards">
        <Layout><RewardsPage /></Layout>
      </Route>
      <Route path="/reports">
        <Layout><ReportsPage /></Layout>
      </Route>
      <Route path="/settings">
        <Layout><SettingsPage /></Layout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;