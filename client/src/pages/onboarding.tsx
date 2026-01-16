// client/src/pages/OnboardingPage.tsx

// 1. IMPORTS
import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Briefcase, GraduationCap, ArrowRight, Check, Loader2, Zap, Target 
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { profile } from "@/lib/api";
import { useAuth } from "@/components/AuthContext";
import logoImg from "@assets/generated_images/minimalist_mint_green_rupee_logo_symbol.png";

// 2. TYPES
interface OnboardingData {
  userType: "salaried" | "unemployed";
  currentBalance: string;
  totalSavings: string;
  salaryAmount: string;
  salaryDate: string;
  goalType: "monthly_amount" | "percentage_income";
  targetValue: string;
}

export default function OnboardingPage() {
  // 3. HOOKS
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  
  // 4. UI STATE
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // 5. FORM STATE (Consolidated for sync access)
  const [formData, setFormData] = useState<OnboardingData>({
    userType: "salaried",
    currentBalance: "",
    totalSavings: "",
    salaryAmount: "",
    salaryDate: "1",
    goalType: "monthly_amount",
    targetValue: ""
  });

  // 6. HANDLERS
  const updateField = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Validation Logic per step can go here if needed
    if (step < 3) {
      setStep(prev => prev + 1);
    } else {
      submitProfile();
    }
  };

  const submitProfile = async () => {
    setIsLoading(true);
    try {
      // 1. Send all data to backend (Profile + Goal + Initial Balance)
      await profile.create({
        userType: formData.userType,
        currentBalance: formData.currentBalance || "0",
        totalSavings: formData.totalSavings || "0",
        salaryAmount: formData.userType === "salaried" ? formData.salaryAmount : null,
        salaryDate: formData.userType === "salaried" ? parseInt(formData.salaryDate) : null,
        goalType: formData.goalType,
        targetValue: formData.targetValue
      });
      
      // 2. Refresh Auth Context so Layout knows user is onboarded
      await refreshProfile();
      
      toast({
        title: "Setup Complete! 🚀",
        description: "Your financial dashboard is ready.",
      });
      
      // 3. Redirect to Dashboard
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 7. RENDER
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-8 animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
             <div className="w-16 h-16 rounded-2xl bg-[#00D4AA]/10 border border-[#00D4AA]/20 flex items-center justify-center">
                <img src={logoImg} alt="Logo" className="w-8 h-8" />
             </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Setup your financial core</h1>
          <p className="text-muted-foreground">Tailoring your experience for better insights</p>
        </div>

        <Card className="bg-card border-border/50 shadow-2xl backdrop-blur-sm border-t-4 border-t-[#00D4AA]">
          <CardHeader>
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-1.5 w-12 rounded-full transition-all duration-300 ${step >= i ? 'bg-[#00D4AA]' : 'bg-secondary'}`} />
                ))}
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Step {step} / 3</span>
            </div>
            
            <CardTitle className="text-2xl text-white">
              {step === 1 && "Professional Status"}
              {step === 2 && "Financial Snapshot"}
              {step === 3 && "Set Your Goal"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "How do you primarily receive your income?"}
              {step === 2 && "Initial balances to bootstrap your tracking."}
              {step === 3 && "Define a monthly savings target to track progress."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 min-h-[280px]">
            
            {/* STEP 1: USER TYPE */}
            {step === 1 && (
              <RadioGroup value={formData.userType} onValueChange={(v) => updateField("userType", v)} className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <RadioGroupItem value="salaried" id="salaried" className="peer sr-only" />
                  <Label htmlFor="salaried" className="flex items-center justify-between rounded-xl border-2 border-muted bg-secondary/10 p-5 hover:bg-secondary/20 peer-data-[state=checked]:border-[#00D4AA] peer-data-[state=checked]:bg-[#00D4AA]/5 cursor-pointer transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">Salaried</div>
                        <div className="text-xs text-muted-foreground">Fixed monthly paycheck</div>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-muted flex items-center justify-center peer-data-[state=checked]:border-[#00D4AA] peer-data-[state=checked]:bg-[#00D4AA]">
                        <Check className="w-4 h-4 text-black opacity-0 peer-data-[state=checked]:opacity-100" />
                    </div>
                  </Label>
                </div>

                <div className="relative">
                  <RadioGroupItem value="unemployed" id="unemployed" className="peer sr-only" />
                  <Label htmlFor="unemployed" className="flex items-center justify-between rounded-xl border-2 border-muted bg-secondary/10 p-5 hover:bg-secondary/20 peer-data-[state=checked]:border-[#00D4AA] peer-data-[state=checked]:bg-[#00D4AA]/5 cursor-pointer transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">Varying Income</div>
                        <div className="text-xs text-muted-foreground">Student, Freelance, or Unemployed</div>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-muted flex items-center justify-center peer-data-[state=checked]:border-[#00D4AA] peer-data-[state=checked]:bg-[#00D4AA]">
                        <Check className="w-4 h-4 text-black opacity-0 peer-data-[state=checked]:opacity-100" />
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            )}

            {/* STEP 2: FINANCIAL SNAPSHOT */}
            {step === 2 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Liquid Balance</Label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      className="bg-secondary/30 border-border focus:border-[#00D4AA]"
                      value={formData.currentBalance}
                      onChange={(e) => updateField("currentBalance", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invested Savings</Label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      className="bg-secondary/30 border-border focus:border-[#00D4AA]"
                      value={formData.totalSavings}
                      onChange={(e) => updateField("totalSavings", e.target.value)}
                    />
                  </div>
                </div>

                {formData.userType === "salaried" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Salary</Label>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        className="bg-secondary/30 border-border focus:border-[#00D4AA]"
                        value={formData.salaryAmount}
                        onChange={(e) => updateField("salaryAmount", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Salary Credit Date (1-31)</Label>
                      <Input 
                        type="number" 
                        min="1" max="31"
                        placeholder="e.g. 1" 
                        className="bg-secondary/30 border-border focus:border-[#00D4AA]"
                        value={formData.salaryDate}
                        onChange={(e) => updateField("salaryDate", e.target.value)}
                      />
                    </div>
                    <div className="bg-[#00D4AA]/5 p-4 rounded-xl text-[11px] text-[#00D4AA] border border-[#00D4AA]/20 flex items-start gap-3">
                      <Zap className="w-4 h-4 shrink-0" />
                      <p className="leading-relaxed">
                        Automated Refresh: Your balance will increment by {formData.salaryAmount || 'your salary'} on day {formData.salaryDate || "1"} of every month.
                      </p>
                    </div>
                  </>
                )}
                {formData.userType === "unemployed" && (
                  <div className="bg-secondary/20 p-4 rounded-xl text-xs text-muted-foreground border border-border/50 italic">
                    <p>Pro Tip: You can manually log varying income (Pocket Money, Gigs, etc.) directly from the Transactions page.</p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: SET GOAL */}
            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                    <Tabs value={formData.goalType} onValueChange={(v) => updateField("goalType", v)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-secondary/50 border border-border/50">
                            <TabsTrigger value="monthly_amount">Fixed Amount</TabsTrigger>
                            <TabsTrigger value="percentage_income">% of Income</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
                            {formData.goalType === 'monthly_amount' ? 'Target Amount' : 'Target Percentage'}
                        </Label>
                        <div className="relative">
                            <Target className="absolute left-3 top-2.5 h-4 w-4 text-[#00D4AA]" />
                            <Input 
                                type="number" 
                                value={formData.targetValue} 
                                onChange={e => updateField("targetValue", e.target.value)} 
                                className="bg-secondary/50 border-border pl-10 text-lg" 
                                placeholder={formData.goalType === "monthly_amount" ? "5000" : "20"} 
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 text-xs text-blue-400">
                    <p className="font-bold mb-1">Why set a goal?</p>
                    <p className="opacity-80">This target will appear on your Dashboard progress bar and determine your Reward Tier progression.</p>
                </div>
              </div>
            )}

          </CardContent>
          
          <CardFooter className="pt-2">
            <Button 
              onClick={handleNext} 
              className="w-full bg-[#00D4AA] text-black hover:bg-[#00D4AA]/90 font-black text-lg h-14 shadow-lg shadow-[#00D4AA]/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Finalizing...
                </>
              ) : (
                <>
                  {step < 3 ? "Continue" : "Launch My Dashboard"} <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}