// client/src/pages/GrowthPage.tsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Trophy, Zap, Target, TrendingUp, Crown, Shield, 
  Coffee, Utensils, Car, ShoppingBag, Plus, Loader2, Star,
  Lock, CheckCircle2, CalendarDays, Clock,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle,CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { behavioral, profile, dashboard, settings } from "@/lib/api";

// --- 1. CONFIGURATION: MANDATORY TIME GATES ---
// Logic: You MUST have been active for 'minDays' to reach this tier, regardless of XP.
const TIERS = [
    { name: "The Spark", minXP: 0, minDays: 0, color: "text-orange-400", bg: "bg-orange-400", icon: Zap },
    { name: "The Pathfinder", minXP: 2000, minDays: 15, color: "text-blue-400", bg: "bg-blue-400", icon: Shield },
    { name: "The Strategist", minXP: 10000, minDays: 45, color: "text-yellow-400", bg: "bg-yellow-400", icon: Star },
    { name: "The Architect", minXP: 25000, minDays: 105, color: "text-slate-300", bg: "bg-slate-300", icon: Trophy }, 
    { name: "The Visionary", minXP: 50000, minDays: 225, color: "text-[#00D4AA]", bg: "bg-[#00D4AA]", icon: Crown }
];

// --- 2. HELPERS ---
const getDaysActive = (createdAt: string | undefined) => {
    if (!createdAt) return 0;
    const start = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff); // Ensure no negative days
};

const getCurrencySymbol = (code?: string) => {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
    return symbols[code || 'INR'] || '₹';
};

const safeParseFloat = (val: any) => parseFloat(val) || 0;

export default function GrowthPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // 3. STATE
    const [customAmount, setCustomAmount] = useState("");
    const [customNote, setCustomNote] = useState("");
    
    // 4. DATA FETCHING
    const { data: profileResponse, isLoading: profileLoading } = useQuery({
        queryKey: ["profile-full"],
        queryFn: profile.get,
    });

    const { data: statsData } = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: () => dashboard.getStats("30d"),
    });

    const { data: settingsData } = useQuery({
        queryKey: ["settings"],
        queryFn: settings.get,
    });

    const { data: behavioralHistory, isLoading: histLoading } = useQuery({
        queryKey: ["behavioral-history"],
        queryFn: behavioral.getHistory,
    });

    // 5. TIER CALCULATION ENGINE
    const currencySymbol = getCurrencySymbol(settingsData?.currency);
    const profileData = profileResponse?.profile || {};
    const userData = profileResponse?.user || {};
    
    const currentXP = safeParseFloat(profileData.rewardPoints);
    const daysActive = getDaysActive(userData.createdAt);

    // Logic: Find the highest tier where BOTH conditions are met
    const currentTierIndex = TIERS.slice().reverse().findIndex(t => currentXP >= t.minXP && daysActive >= t.minDays);
    const actualIndex = currentTierIndex >= 0 ? (TIERS.length - 1 - currentTierIndex) : 0;
    
    const currentTier = TIERS[actualIndex];
    const nextTier = TIERS[actualIndex + 1] || null;

    // Progress Visualization
    let progressPercent = 100;
    let barrierReason = ""; // "xp" | "time" | "both"

    if (nextTier) {
        const xpRange = nextTier.minXP - currentTier.minXP;
        const xpProgress = Math.max(0, currentXP - currentTier.minXP);
        
        // Progress bar visually tracks XP (the effort), but locks if time isn't met
        progressPercent = Math.min((xpProgress / xpRange) * 100, 100);

        const xpLeft = nextTier.minXP - currentXP;
        const daysLeft = nextTier.minDays - daysActive;

        if (xpLeft > 0 && daysLeft > 0) barrierReason = "both";
        else if (xpLeft > 0) barrierReason = "xp";
        else if (daysLeft > 0) barrierReason = "time";
    }

    // 6. GOAL & EFFICIENCY
    const targetValue = safeParseFloat(profileData.targetValue);
    const monthlySavings = safeParseFloat(statsData?.savings);
    const goalType = profileData.goalType || "monthly_amount";
    
    let goalProgress = 0;
    if (targetValue > 0) {
        if (goalType === "monthly_amount") {
            goalProgress = (monthlySavings / targetValue) * 100;
        } else {
            const income = safeParseFloat(statsData?.income) || 1;
            const targetAmt = (targetValue / 100) * income;
            goalProgress = (monthlySavings / targetAmt) * 100;
        }
    }
    const isGoalMet = goalProgress >= 100;

    const efficiencyRate = statsData?.income > 0 ? (statsData.savings / statsData.income) * 100 : 0;
    const xpMultiplier = efficiencyRate > 30 ? 1.5 : (efficiencyRate > 20 ? 1.2 : 1.0);

    // 7. MUTATIONS
    const logBehaviorMutation = useMutation({
        mutationFn: behavioral.logSavings,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["profile-full"] });
            queryClient.invalidateQueries({ queryKey: ["behavioral-history"] });
            toast({ 
                title: `+${data.xpEarned} XP Earned!`, 
                description: "Great discipline! Your streak is growing." 
            });
            setCustomAmount("");
            setCustomNote("");
        },
        onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message })
    });

    const handleQuickLog = (type: string, amount: number) => {
        logBehaviorMutation.mutate({ behaviorType: type, estimatedAmount: amount.toString() });
    };

    const handleCustomLog = () => {
        if (!customAmount || isNaN(Number(customAmount))) return toast({ variant: "destructive", title: "Invalid Amount" });
        logBehaviorMutation.mutate({ behaviorType: customNote || "Custom Saving", estimatedAmount: customAmount });
    };

    if (profileLoading || histLoading) {
        return <div className="flex justify-center h-[80vh] items-center"><Loader2 className="animate-spin text-[#00D4AA] w-10 h-10" /></div>;
    }

    return (
        <div className="space-y-8 pb-10 max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Growth & Rewards</h1>
                    <p className="text-muted-foreground">Track habits, hit goals, and unlock tiers through consistency.</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Time Badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/20 rounded-lg border border-border/50">
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-mono font-bold text-white">{daysActive} Days Active</span>
                    </div>
                    {/* Efficiency Badge */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary/20 rounded-xl border border-border/50">
                        <TrendingUp className={`w-4 h-4 ${efficiencyRate > 20 ? 'text-[#00D4AA]' : 'text-muted-foreground'}`} />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Efficiency</span>
                            <span className="text-xs font-bold text-white">{xpMultiplier}x Multiplier</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* LEFT COLUMN: STATUS & GOALS */}
                <div className="space-y-8">
                    
                    {/* 1. HERO TIER CARD */}
                    <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]">
                        <div className={`absolute top-0 right-0 w-64 h-64 opacity-10 blur-3xl rounded-full ${currentTier.bg}`} />
                        
                        <CardHeader className="relative z-10 pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className={`text-2xl font-black ${currentTier.color} flex items-center gap-2`}>
                                        <currentTier.icon className="w-6 h-6" />
                                        {currentTier.name}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">Current Financial Persona</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-white">{currentXP.toLocaleString()}</span>
                                    <span className="text-xs font-bold text-muted-foreground block">TOTAL XP</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10 space-y-6">
                            
                            {/* PROGRESS & GATES */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    <span>
                                        {nextTier ? `Path to ${nextTier.name}` : "Highest Tier Achieved"}
                                    </span>
                                    {nextTier && (
                                        <span className={barrierReason === 'time' || barrierReason === 'both' ? "text-orange-400 flex items-center gap-1" : "text-white"}>
                                            {barrierReason === 'time' ? (
                                                <><Lock className="w-3 h-3" /> Time Locked</>
                                            ) : (
                                                `${currentXP} / ${nextTier.minXP} XP`
                                            )}
                                        </span>
                                    )}
                                </div>
                                <Progress value={progressPercent} className="h-3 bg-secondary/50" indicatorClassName={barrierReason === 'time' ? "bg-orange-400" : currentTier.bg} />
                                
                                {/* Status Messages */}
                                {barrierReason === 'time' && nextTier && (
                                    <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 p-2.5 rounded text-xs text-orange-300">
                                        <Clock className="w-4 h-4 shrink-0" />
                                        <span>
                                            <strong>XP Met!</strong> Wait {nextTier.minDays - daysActive} more days to unlock {nextTier.name}.
                                        </span>
                                    </div>
                                )}
                                {barrierReason === 'both' && nextTier && (
                                    <p className="text-[10px] text-muted-foreground text-right">
                                        Need {nextTier.minXP - currentXP} XP & {nextTier.minDays - daysActive} Days more.
                                    </p>
                                )}
                            </div>
                            
                            {/* Unlocks Grid */}
                            <div className="grid grid-cols-3 gap-2 pt-2">
                                <div className="bg-white/5 p-3 rounded-lg text-center border border-white/5">
                                    <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                                    <p className="text-[10px] text-muted-foreground">Leaderboard</p>
                                    <p className="text-xs font-bold text-white">Unlocked</p>
                                </div>
                                <div className={`p-3 rounded-lg text-center border ${efficiencyRate > 20 ? 'bg-[#00D4AA]/10 border-[#00D4AA]/20' : 'bg-white/5 border-white/5 opacity-50'}`}>
                                    <Zap className="w-5 h-5 mx-auto mb-1 text-[#00D4AA]" />
                                    <p className="text-[10px] text-muted-foreground">Multiplier</p>
                                    <p className="text-xs font-bold text-white">{efficiencyRate > 20 ? "Active" : "Locked"}</p>
                                </div>
                                <div className={`p-3 rounded-lg text-center border ${currentTier.minDays >= 90 ? 'bg-purple-500/10 border-purple-500/20' : 'bg-white/5 border-white/5 opacity-50'}`}>
                                    <Crown className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                                    <p className="text-[10px] text-muted-foreground">Elite Status</p>
                                    <p className="text-xs font-bold text-white">{currentTier.minDays >= 90 ? "Active" : "Locked"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. MONTHLY GOAL TRACKER */}
                    <Card className="bg-card border-border/50 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Target className="w-5 h-5 text-blue-500" /> Monthly Goal
                            </CardTitle>
                            <CardDescription>
                                Target: {targetValue > 0 
                                    ? (goalType === 'monthly_amount' ? `${currencySymbol}${targetValue}` : `${targetValue}% of Income`) 
                                    : "Not Set"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="relative flex items-center justify-center py-4">
                                <div className="relative w-40 h-40">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="80" cy="80" r="70" stroke="#333" strokeWidth="12" fill="transparent" />
                                        <circle 
                                            cx="80" cy="80" r="70" 
                                            stroke={isGoalMet ? "#00D4AA" : "#3b82f6"} 
                                            strokeWidth="12" 
                                            fill="transparent" 
                                            strokeDasharray={440} 
                                            strokeDashoffset={440 - (Math.min(goalProgress, 100) / 100) * 440} 
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={`text-3xl font-black ${isGoalMet ? 'text-[#00D4AA]' : 'text-white'}`}>
                                            {Math.round(goalProgress)}%
                                        </span>
                                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Achieved</span>
                                    </div>
                                </div>
                            </div>
                            
                            <Button 
                                className={`w-full font-bold ${isGoalMet ? 'bg-[#00D4AA] text-black hover:bg-[#00D4AA]/90' : 'bg-secondary text-muted-foreground hover:bg-secondary'}`}
                                disabled={!isGoalMet} 
                            >
                                {isGoalMet ? "Claim 1000 XP Bonus! 🎉" : `${currencySymbol}${monthlySavings} / ${currencySymbol}${targetValue || 0} Saved`}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: ACTION CENTER */}
                <div className="space-y-8">
                    
                    {/* 3. LOGGING CENTER */}
                    <Card className="bg-card border-border/50 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-white">Log Smart Choices</CardTitle>
                            <CardDescription>Did you resist an impulse buy? Log it to earn XP.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            
                            <div className="grid grid-cols-2 gap-3">
                                <Button 
                                    variant="outline" 
                                    className="h-auto py-4 flex flex-col gap-2 border-border/50 hover:bg-[#00D4AA]/10 hover:border-[#00D4AA] group transition-all"
                                    onClick={() => handleQuickLog("Skipped Coffee", 250)}
                                    disabled={logBehaviorMutation.isPending}
                                >
                                    <Coffee className="w-6 h-6 text-muted-foreground group-hover:text-[#00D4AA]" />
                                    <span className="text-xs font-bold">Skipped Coffee</span>
                                    <span className="text-[10px] text-muted-foreground">+50 XP</span>
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="h-auto py-4 flex flex-col gap-2 border-border/50 hover:bg-blue-500/10 hover:border-blue-500 group transition-all"
                                    onClick={() => handleQuickLog("Dining In", 800)}
                                    disabled={logBehaviorMutation.isPending}
                                >
                                    <Utensils className="w-6 h-6 text-muted-foreground group-hover:text-blue-500" />
                                    <span className="text-xs font-bold">Cooked at Home</span>
                                    <span className="text-[10px] text-muted-foreground">+100 XP</span>
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="h-auto py-4 flex flex-col gap-2 border-border/50 hover:bg-purple-500/10 hover:border-purple-500 group transition-all"
                                    onClick={() => handleQuickLog("Public Transport", 150)}
                                    disabled={logBehaviorMutation.isPending}
                                >
                                    <Car className="w-6 h-6 text-muted-foreground group-hover:text-purple-500" />
                                    <span className="text-xs font-bold">Took Metro/Walk</span>
                                    <span className="text-[10px] text-muted-foreground">+30 XP</span>
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="h-auto py-4 flex flex-col gap-2 border-border/50 hover:bg-orange-500/10 hover:border-orange-500 group transition-all"
                                    onClick={() => handleQuickLog("Delayed Purchase", 2000)}
                                    disabled={logBehaviorMutation.isPending}
                                >
                                    <ShoppingBag className="w-6 h-6 text-muted-foreground group-hover:text-orange-500" />
                                    <span className="text-xs font-bold">Delayed Impulse</span>
                                    <span className="text-[10px] text-muted-foreground">+150 XP</span>
                                </Button>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-border/30">
                                <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Custom Save</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground font-mono">{currencySymbol}</span>
                                        <Input 
                                            placeholder="Amount Saved" 
                                            className="pl-8 bg-secondary/50 border-border" 
                                            type="number"
                                            value={customAmount}
                                            onChange={(e) => setCustomAmount(e.target.value)}
                                        />
                                    </div>
                                    <Input 
                                        placeholder="What did you skip?" 
                                        className="flex-[2] bg-secondary/50 border-border" 
                                        value={customNote}
                                        onChange={(e) => setCustomNote(e.target.value)}
                                    />
                                    <Button size="icon" className="bg-[#00D4AA] text-black hover:bg-[#00D4AA]/90" onClick={handleCustomLog} disabled={logBehaviorMutation.isPending}>
                                        {logBehaviorMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. RECENT HISTORY */}
                    <Card className="bg-card border-border/50 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-white">Recent Wins</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Array.isArray(behavioralHistory) && behavioralHistory.length > 0 ? (
                                    behavioralHistory.slice(0, 5).map((log: any) => (
                                        <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-transparent hover:border-[#00D4AA]/30 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#00D4AA]/10 flex items-center justify-center text-[#00D4AA]">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{log.behaviorType}</p>
                                                    <p className="text-xs text-muted-foreground">Saved {currencySymbol}{log.estimatedAmount}</p>
                                                </div>
                                            </div>
                                            <div className="text-xs font-bold text-[#00D4AA] bg-[#00D4AA]/10 px-2 py-1 rounded">
                                                +{log.xpAwarded} XP
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted-foreground py-6 text-sm italic">
                                        No habits logged yet. Start today!
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}