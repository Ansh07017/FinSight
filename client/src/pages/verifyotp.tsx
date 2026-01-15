import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, RefreshCcw } from "lucide-react";
import authBg from "@assets/generated_images/dark_minimalist_abstract_geometric_financial_background.png";
import logoImg from "@assets/generated_images/minimalist_mint_green_rupee_logo_symbol.png";

export default function VerifyOtpPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const params = new URLSearchParams(search);
  const userId = params.get("userId");

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer logic for resend
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

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/verifyotp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      });
      if (!res.ok) throw new Error("Invalid or expired code");
      toast({ title: "Verified", description: "Taking you to onboarding..." });
      setLocation("/onboarding");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      const res = await fetch("/api/auth/resendotp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to resend");
      toast({ title: "Code Resent", description: "Please check your terminal." });
      startCountdown();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <img src={authBg} alt="Background" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-20 max-w-md text-center p-8">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <img src={logoImg} alt="Logo" className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Account Verification</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Enter the code to unlock your Finsight dashboard.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 mb-4 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <CardTitle className="text-white">Verify OTP</CardTitle>
            <CardDescription>Enter the 6-digit code sent to your email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-6">
              <Input 
                type="text" 
                placeholder="000000" 
                maxLength={6}
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                className="text-center text-3xl tracking-[0.5em] font-bold bg-secondary/50 h-16"
              />
              <div className="space-y-3">
                <Button className="w-full bg-primary text-black font-bold h-12" disabled={isVerifying || code.length !== 6}>
                  {isVerifying ? <Loader2 className="animate-spin" /> : "Verify & Continue"}
                </Button>
                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full text-xs text-muted-foreground hover:text-white" 
                  disabled={resendTimer > 0} 
                  onClick={handleResend}
                >
                  <RefreshCcw className={`mr-2 h-3 w-3 ${resendTimer > 0 ? 'animate-spin-slow' : ''}`} />
                  {resendTimer > 0 ? `Resend available in ${resendTimer}s` : "Didn't receive code? Resend"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}