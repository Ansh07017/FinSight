// client/src/pages/auth.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter'; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; 
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/api";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

// Assets
import authBg from "@assets/generated_images/dark_minimalist_abstract_geometric_financial_background.png";
import logoImg from "@assets/generated_images/minimalist_mint_green_rupee_logo_symbol.png";

export default function AuthPage() {
  // 1. Hooks & Routing
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // 2. UI State
  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 3. Form Data State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  // 4. Password Reset State
  const [resetEmail, setResetEmail] = useState("");
  const [resetStage, setResetStage] = useState<"email" | "otp">("email");
  const [otpCode, setOtpCode] = useState("");
  const [userIdForReset, setUserIdForReset] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  
  // 5. Timer Logic (Synchronous Flow)
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendTimer(45);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 6. ERROR HANDLER (Centralized)
  const handleAuthError = (error: any, defaultMsg: string) => {
    const isRateLimited = error.status === 429 || error.message?.includes("Too many requests");
    toast({
      variant: "destructive",
      title: isRateLimited ? "Security Delay" : "Action Failed",
      description: isRateLimited 
        ? "Too many attempts. Please wait before trying again." 
        : (error.message || defaultMsg),
    });
  };

  // 7. LOGIN HANDLER

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    
    setIsLoading(true); // Start spinner
    
    try {
      const response = await auth.login(loginEmail, loginPassword);
      
      if (response?.user) {

        const nextPath = response.user.needsOnboarding ? "/onboarding" : "/";
        
        window.location.href = nextPath;  
      }
    } catch (error: any) {
      setIsLoading(false);
      handleAuthError(error, "Invalid email or password");
 } 
    
 };

 // 8. REGISTER HANDLER (Optimized)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail || !registerPassword) return;

    setIsLoading(true); 

    try {
      const response = await auth.register(registerEmail, registerPassword);
      
      // ✅ Success! 
      toast({
        title: "Verification Required",
        description: "Please check your email for the 6-digit code.",
      });
      
      setLocation(`/verifyotp?userId=${response.userId}`);

    } catch (error: any) {
      // ❌ Error! Now we stop the spinner so they can retry.
      console.error("Registration error:", error);
      setIsLoading(false); 
      handleAuthError(error, "Could not create account");
    }
  };

  // 9. PASSWORD RESET HANDLER
  const handleForgotPassword = async () => {
    if (!resetEmail) return;
    
    setIsResetting(true);
    try {
      const response = await fetch("/api/auth/forgotpassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error("Too many requests. Please wait.");
        const data = await response.json();
        throw new Error(data.message || "Failed to send code");
      }

      const data = await response.json();
      
      // Sequential State Updates
      setUserIdForReset(data.userId);
      setResetStage("otp");
      startCountdown();
      
      toast({ title: "OTP Sent", description: "Check your email." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsResetting(false);
    }
  };

  // 10. HELPER COMPONENT (Google Button)
  const GoogleAuthButton = () => (
    <>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <Button 
        variant="outline" 
        type="button"
        className="w-full border-border/50 bg-secondary/30 hover:bg-secondary/50 text-white" 
        onClick={() => window.location.href = "/api/auth/google"}
      >
        <FcGoogle className="mr-2 h-5 w-5" />
        Continue with Google
      </Button>
    </>
  );

  // 11. MAIN RENDER
  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side: Hero Image */}
      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
           <img src={authBg} alt="Background" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-20 max-w-md text-center p-8">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 backdrop-blur-xl border border-primary/20 flex items-center justify-center">
              <img src={logoImg} alt="Logo" className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Finsight</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Your intelligent financial companion. Experience real-time behavioral insights.
          </p>
        </div>
      </div>

      {/* Right Side: Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-white">Access Dashboard</CardTitle>
            <CardDescription>Secure login to your financial intelligence suite</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              {/* LOGIN TAB */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email" 
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="bg-secondary/50 border-border"
                      required
                    />
                  </div>

                  <div className="space-y-2 relative">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="login-password">Password</Label>

                      {/* Forgot Password Dialog */}
                      <Dialog 
                        open={isDialogOpen} 
                        onOpenChange={(open) => {
                          setIsDialogOpen(open);
                          // Reset dialog state on close
                          if (!open) {
                            setTimeout(() => {
                              setResetStage("email");
                              setOtpCode("");
                              if (timerRef.current) clearInterval(timerRef.current);
                              setResendTimer(0);
                            }, 300);
                          }
                        }}>
                        <DialogTrigger asChild>
                          <button type="button" className="text-xs text-primary hover:underline">
                            Forgot Password?
                          </button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border shadow-2xl sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle className="text-white">
                              {resetStage === "email" ? "Reset Password" : "Verify OTP"}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                              {resetStage === "email" 
                                ? "Enter your email address to receive a 6-digit reset code." 
                                : "Enter the 6-digit code sent to your email."}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4 py-4">
                            {resetStage === "email" ? (
                              <>
                                <div className="space-y-2">
                                  <Label>Email Address</Label>
                                  <Input
                                    type="email"
                                    placeholder="email@example.com"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    className="bg-secondary/50 border-border"
                                  />
                                </div>
                                <Button onClick={handleForgotPassword} className="w-full bg-primary text-black" disabled={isResetting}>
                                  {isResetting ? <Loader2 className="animate-spin" /> : "Send Reset Code"}
                                </Button>
                              </>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  <Label>Verification Code</Label>
                                  <Input
                                    type="text"
                                    placeholder="000000"
                                    maxLength={6}
                                    className="text-center text-2xl tracking-widest bg-secondary/50"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                  />
                                </div>
                                <Button 
                                  className="w-full bg-primary text-black font-bold" 
                                  disabled={otpCode.length !== 6} 
                                  onClick={() => {
                                    if (otpCode.length === 6) {
                                      setLocation(`/resetpassword?token=${otpCode}&userId=${userIdForReset}`);
                                    }
                                  }}
                                >
                                  Verify & Continue
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  className="w-full text-xs" 
                                  disabled={resendTimer > 0 || isResetting} 
                                  onClick={handleForgotPassword}
                                >
                                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend Code"}
                                </Button>
                              </>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••" 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="bg-secondary/50 border-border pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full p-2 text-muted-foreground hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-primary text-black font-semibold" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "Sign In"}
                  </Button>
                </form>
                <GoogleAuthButton />
              </TabsContent>
              
              {/* REGISTER TAB */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email">New Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Choose a handle" 
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="bg-secondary/50 border-border"
                      required
                    />
                  </div>

                  <div className="space-y-2 relative">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimum 8 characters" 
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="bg-secondary/50 border-border pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full p-2 text-muted-foreground hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full bg-primary text-black font-semibold" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "Create Account"}
                  </Button>
                </form>
                <GoogleAuthButton />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}