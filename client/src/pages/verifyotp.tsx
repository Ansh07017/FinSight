// client/src/pages/verifyotp.tsx

import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, RefreshCcw, ArrowLeft } from "lucide-react";
import authBg from "@assets/generated_images/dark_minimalist_abstract_geometric_financial_background.png";
import logoImg from "@assets/generated_images/minimalist_mint_green_rupee_logo_symbol.png";
import { auth } from "@/lib/api"; // <--- Import the optimized API wrapper

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

  // 1. Guard: Ensure User ID exists
  useEffect(() => {
    if (!userId) {
      toast({ variant: "destructive", title: "Error", description: "Invalid session. Please login again." });
      setLocation("/auth");
    }
    
    // Cleanup timer on unmount
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [userId, setLocation, toast]);

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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || !userId) return;

    setIsVerifying(true);
    try {
      // 2. Use API Wrapper
      await auth.verifyOtp(userId, code);
      
      toast({ title: "Verified", description: "Taking you to onboarding..." });
      // Small delay for UX transition
      setTimeout(() => setLocation("/onboarding"), 800);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: error.message || "Invalid or expired code." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || !userId) return;
    
    try {
      // 3. Use API Wrapper
      await auth.resendOtp(userId);
      
      toast({ title: "Code Resent", description: "Please check your email (and spam folder)." });
      startCountdown();

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

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
          <h1 className="text-4xl font-bold text-white mb-4">Account Verification</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Enter the code to unlock your FinSight dashboard.
          </p>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="absolute top-6 left-6 text-muted-foreground hover:text-white"
          onClick={() => setLocation("/auth")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
        </Button>

        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 mb-4 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center text-[#00D4AA]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Verify OTP</CardTitle>
            <CardDescription>Enter the 6-digit code sent to your email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex justify-center">
                <Input 
                    type="text" 
                    placeholder="000000" 
                    maxLength={6}
                    value={code} 
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))} // Only allow numbers
                    className="text-center text-3xl tracking-[0.5em] font-bold bg-secondary/50 h-16 w-full max-w-[300px] border-[#00D4AA]/20 focus:border-[#00D4AA] transition-colors"
                />
              </div>
              
              <div className="space-y-3">
                <Button 
                    className="w-full bg-[#00D4AA] text-black font-bold h-12 hover:bg-[#00D4AA]/90 shadow-[0_0_15px_rgba(0,212,170,0.3)]" 
                    disabled={isVerifying || code.length !== 6}
                >
                  {isVerifying ? <Loader2 className="animate-spin" /> : "Verify & Continue"}
                </Button>
                
                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full text-xs text-muted-foreground hover:text-white hover:bg-white/5" 
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