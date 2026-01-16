// client/src/pages/resetpassword.tsx

import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import authBg from "@assets/generated_images/dark_minimalist_abstract_geometric_financial_background.png";
import logoImg from "@assets/generated_images/minimalist_mint_green_rupee_logo_symbol.png";
import { auth } from "@/lib/api"; // <--- Import the optimized API wrapper

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  
  const params = new URLSearchParams(search);
  const token = params.get("token"); 
  const userId = params.get("userId");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidLink, setIsValidLink] = useState(true);

  // 1. Validate Link immediately on load
  useEffect(() => {
    if (!token || !userId) {
      setIsValidLink(false);
    }
  }, [token, userId]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 8) {
        return toast({ variant: "destructive", title: "Password too weak", description: "Must be at least 8 characters." });
    }

    if (newPassword !== confirmPassword) {
      return toast({ variant: "destructive", title: "Passwords do not match" });
    }

    setIsSubmitting(true);
    try {
      // 2. Use the consistent API wrapper
      // Note: We pass userId here because your backend route expects it for verification
      await auth.resetPassword(token!, newPassword, userId!);

      toast({ title: "Success", description: "Password updated! You can now login." });
      
      // Small delay for UX
      setTimeout(() => setLocation("/auth"), 1000);
      
    } catch (error: any) {
      toast({ variant: "destructive", title: "Reset Failed", description: error.message || "Link invalid or expired." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Invalid Link State (UX Improvement)
  if (!isValidLink) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-red-500/20 bg-card/50">
           <CardContent className="flex flex-col items-center text-center p-8 gap-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <h2 className="text-xl font-bold text-white">Invalid Link</h2>
              <p className="text-muted-foreground">This password reset link is missing required information or is invalid.</p>
              <Button onClick={() => setLocation("/auth")} variant="outline" className="mt-4">
                Back to Login
              </Button>
           </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Hero Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <img src={authBg} alt="Background" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-20 max-w-md text-center p-8">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-[#00D4AA]/10 backdrop-blur-xl border border-[#00D4AA]/20 flex items-center justify-center">
              <img src={logoImg} alt="Logo" className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Secure Reset</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Update your credentials to regain access to your intelligent financial suite.
          </p>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 mb-4 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center text-[#00D4AA]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Create New Password</CardTitle>
            <CardDescription>Enter a strong password to secure your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="bg-secondary/50 border-border"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="bg-secondary/50 border-border"
                  required 
                />
              </div>
              <Button className="w-full bg-[#00D4AA] text-black font-bold h-12 hover:bg-[#00D4AA]/90" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Update & Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}