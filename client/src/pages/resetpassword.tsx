// client/src/pages/resetpassword.tsx
import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck } from "lucide-react";
import authBg from "@assets/generated_images/dark_minimalist_abstract_geometric_financial_background.png";
import logoImg from "@assets/generated_images/minimalist_mint_green_rupee_logo_symbol.png";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  
  const params = new URLSearchParams(search);
  const token = params.get("token"); // This is the 6-digit OTP from the email
  const userId = params.get("userId");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast({ variant: "destructive", title: "Passwords do not match" });
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/resetpassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword, userId }),
      });

      if (!res.ok) throw new Error("Verification failed or code expired");

      toast({ title: "Success", description: "Password updated! You can now login." });
      setLocation("/auth");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Hero Branding (Matching Auth Page) */}
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
            <div className="mx-auto w-12 h-12 mb-4 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
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
              <Button className="w-full bg-primary text-black font-bold h-12" disabled={isSubmitting || !token}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Update & Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}