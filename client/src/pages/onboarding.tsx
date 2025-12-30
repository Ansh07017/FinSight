import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { profile } from "@/lib/api";
import { useAuth } from "@/components/AuthContext"; // Added to refresh state
import { Briefcase, GraduationCap, ArrowRight, IndianRupee, Check, Loader2,Zap } from "lucide-react";
import logoImg from "@assets/generated_images/minimalist_mint_green_rupee_logo_symbol.png";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refreshProfile } = useAuth(); // Consume refresh helper
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<"salaried" | "unemployed">("salaried");
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [currentBalance, setCurrentBalance] = useState("");
  const [currentSavings, setCurrentSavings] = useState("");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryDate, setSalaryDate] = useState("1");

  const handleContinue = async () => {
    if (step === 1) {
      setStep(2);
    } else {
      setIsLoading(true);
      try {
        // Step 1: Create the profile on the backend
        await profile.create({
          userType,
          currentBalance: currentBalance || "0",
          totalSavings: currentSavings || "0",
          salaryAmount: userType === "salaried" ? salaryAmount : null,
          salaryDate: userType === "salaried" ? parseInt(salaryDate) : null,
        });
        
        // Step 2: IMPORTANT - Refresh AuthContext so the app knows onboarding is done
        await refreshProfile();
        
        toast({
          title: "Profile Created!",
          description: "Welcome to FinInsight. Let's start tracking your finances.",
        });
        
        // Step 3: Redirect to Dashboard
        setLocation("/");
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to save profile",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <img src={logoImg} alt="Logo" className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white tracking-tight">Setup your financial core</h1>
          <p className="text-muted-foreground">Tailoring your experience for better insights</p>
        </div>

        <Card className="bg-card border-border/50 shadow-2xl backdrop-blur-sm border-t-4 border-t-primary">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-2">
                <div className={`h-1.5 w-16 rounded-full transition-all ${step >= 1 ? 'bg-primary' : 'bg-secondary'}`} />
                <div className={`h-1.5 w-16 rounded-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-secondary'}`} />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Step {step} / 2</span>
            </div>
            <CardTitle className="text-2xl text-white">
              {step === 1 ? "Professional Status" : "Financial Snapshot"}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? "How do you primarily receive your income?" 
                : "Initial balances to bootstrap your tracking."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 1 ? (
              <RadioGroup defaultValue="salaried" onValueChange={(v) => setUserType(v as any)} className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <RadioGroupItem value="salaried" id="salaried" className="peer sr-only" />
                  <Label
                    htmlFor="salaried"
                    className="flex items-center justify-between rounded-xl border-2 border-muted bg-secondary/10 p-5 hover:bg-secondary/20 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">Salaried</div>
                        <div className="text-xs text-muted-foreground">Fixed monthly paycheck</div>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-muted flex items-center justify-center peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary">
                        <Check className="w-4 h-4 text-black opacity-0 peer-data-[state=checked]:opacity-100" />
                    </div>
                  </Label>
                </div>

                <div className="relative">
                  <RadioGroupItem value="unemployed" id="unemployed" className="peer sr-only" />
                  <Label
                    htmlFor="unemployed"
                    className="flex items-center justify-between rounded-xl border-2 border-muted bg-secondary/10 p-5 hover:bg-secondary/20 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">Varying Income</div>
                        <div className="text-xs text-muted-foreground">Student, Freelance, or Unemployed</div>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-muted flex items-center justify-center peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary">
                        <Check className="w-4 h-4 text-black opacity-0 peer-data-[state=checked]:opacity-100" />
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            ) : (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Liquid Balance</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="number" 
                        placeholder="0" 
                        className="pl-9 bg-secondary/30 border-border focus:border-primary"
                        value={currentBalance}
                        onChange={(e) => setCurrentBalance(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invested Savings</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="number" 
                        placeholder="0" 
                        className="pl-9 bg-secondary/30 border-border focus:border-primary"
                        value={currentSavings}
                        onChange={(e) => setCurrentSavings(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {userType === "salaried" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Salary Amount</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number" 
                          placeholder="0" 
                          className="pl-9 bg-secondary/30 border-border focus:border-primary"
                          value={salaryAmount}
                          onChange={(e) => setSalaryAmount(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Salary Credit Date</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        max="31" 
                        placeholder="e.g. 1" 
                        className="bg-secondary/30 border-border focus:border-primary"
                        value={salaryDate}
                        onChange={(e) => setSalaryDate(e.target.value)}
                      />
                    </div>
                    <div className="bg-primary/5 p-4 rounded-xl text-[11px] text-primary border border-primary/20 flex items-start gap-3">
                      <Zap className="w-4 h-4 shrink-0" />
                      <p className="leading-relaxed">Automated Refresh: Your balance will increment by {salaryAmount ? `₹${salaryAmount}` : 'your salary'} on day {salaryDate || "1"} of every month.</p>
                    </div>
                  </>
                )}

                {userType === "unemployed" && (
                  <div className="bg-secondary/20 p-4 rounded-xl text-xs text-muted-foreground border border-border/50 italic">
                    <p>Pro Tip: You can manually log varying income (Pocket Money, Gigs, etc.) directly from the Transactions page.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2">
            <Button 
              onClick={handleContinue} 
              className="w-full bg-primary text-black hover:bg-primary/90 font-black text-lg h-14 shadow-lg shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Finalizing...
                </>
              ) : (
                <>
                  {step === 1 ? "Continue to Snapshot" : "Launch My Dashboard"} <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}