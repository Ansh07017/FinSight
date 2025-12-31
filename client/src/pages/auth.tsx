// client/src/pages/auth.tsx

import React, { useState } from 'react';
import { useLocation } from 'wouter'; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
// Using the refactored granular auth API
import { auth } from "@/lib/api";
import authBg from "@assets/generated_images/dark_minimalist_abstract_geometric_financial_background.png";
import logoImg from "@assets/generated_images/minimalist_mint_green_rupee_logo_symbol.png";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc"; // RESTORED IMPORT

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  
  // Form States
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) return;
    
    setIsLoading(true);
    try {
      const response = await auth.login(loginUsername, loginPassword);
      
      if (response?.user) {
        if (response.user.needsOnboarding) {
          setLocation("/onboarding");
        } else {
          setLocation("/"); 
        }
      } else {
        throw new Error("Invalid server response format");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid username or password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUsername || !registerPassword) return;

    setIsLoading(true);
    try {
      await auth.register(registerUsername, registerPassword);
      
      toast({
        title: "Account Created",
        description: "Welcome to FinSaver! Let's get started.",
      });

      setLocation("/onboarding");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Could not create account",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reusable Google Button Component to keep code clean
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

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Hero Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
           <img src={authBg} alt="Background" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-20 max-w-md text-center p-8">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 backdrop-blur-xl border border-primary/20 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(0,212,170,0.3)]">
              <img src={logoImg} alt="Logo" className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Finsight</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Your intelligent financial companion. Break free from monolithic tracking. 
            Experience parallel analytics and real-time behavioral insights.
          </p>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="lg:hidden mx-auto w-12 h-12 mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
              <img src={logoImg} alt="Logo" className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Access Dashboard</CardTitle>
            <CardDescription>
              Secure login to your financial intelligence suite
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Enter your username" 
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="bg-secondary/50 border-border"
                      required
                    />
                  </div>

                  <div className="space-y-2 relative">
                    <Label htmlFor="login-password">Password</Label>
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
                      className="absolute right-0 top-7.25 h-9 w-9 p-0 text-muted-foreground hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-black font-semibold" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : "Sign In"}
                  </Button>
                </form>
                <GoogleAuthButton /> {/* RESTORED FOR LOGIN */}
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">New Username</Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="Choose a handle" 
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      className="bg-secondary/50 border-border"
                      required
                    />
                  </div>

                  <div className="space-y-2 relative">
                    <Label htmlFor="register-password">Password</Label>
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
                      className="absolute right-0 top-7.25 h-9 w-9 p-0 text-muted-foreground hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-black font-semibold" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing...</> : "Create Account"}
                  </Button>
                </form>
                <GoogleAuthButton /> {/* RESTORED FOR REGISTER */}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}