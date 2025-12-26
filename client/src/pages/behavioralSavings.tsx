// client/src/pages/BehavioralSavingsPage.tsx
/*
import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Zap, CheckCircle, TrendingUp, Target, History, Calendar, Info } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { behavioral } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface LogSavingsSuccessData {
    message: string;
    xpEarned: number;
    logId: string;
}

interface LogSavingsVariables {
    estimatedAmount: string;
    behaviorType: string;
    customDescription?: string;
}

const QUICK_BEHAVIORS = [
    { type: 'packed_lunch', label: 'Packed Lunch (₹100)', value: "100" },
    { type: 'walked_to_work', label: 'Walked/Cycled (₹50)', value: "50" },
    { type: 'reused_item', label: 'Reused/Repaired (₹200)', value: "200" },
    { type: 'avoided_impulse', label: 'Avoided Impulse (₹500)', value: "500" },
];

const DAILY_XP_CAP = 500;

export default function BehavioralSavingsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [estimatedAmount, setEstimatedAmount] = useState('');
    const [behaviorType, setBehaviorType] = useState('');
    const [customDescription, setCustomDescription] = useState('');
    const [timeRange, setTimeRange] = useState('7');

    const { data: savingsHistory, isLoading: historyLoading } = useQuery({
        queryKey: ["behavioral-history"],
        queryFn: async () => {
            const res = await fetch("/api/behavioral/savings"); 
            if (!res.ok) return [];
            return res.json();
        }
    });

    const filteredHistory = useMemo(() => {
        if (!savingsHistory || !Array.isArray(savingsHistory)) return [];
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(timeRange));
        
        return [...savingsHistory]
            .filter((log: any) => new Date(log.loggedAt) >= cutoff)
            .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());
    }, [savingsHistory, timeRange]);

    const xpToday = useMemo(() => {
        if (!savingsHistory || !Array.isArray(savingsHistory)) return 0;
        const today = new Date().toDateString();
        return savingsHistory
            .filter((log: any) => new Date(log.loggedAt).toDateString() === today)
            .reduce((sum: number, log: any) => sum + (log.xpAwarded || 0), 0);
    }, [savingsHistory]);

    const xpProgress = Math.min(Math.round((xpToday / DAILY_XP_CAP) * 100), 100);

    const logSavingsMutation = useMutation<LogSavingsSuccessData, Error, LogSavingsVariables>({
        mutationFn: (data) => behavioral.logSavings(data),
        onSuccess: (data) => {
            toast({
                title: "✅ Win Logged!",
                description: `You earned ${data.xpEarned} XP instantly!`,
            });
            setEstimatedAmount('');
            setBehaviorType('');
            setCustomDescription('');
            queryClient.invalidateQueries({ queryKey: ["behavioral-history"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
        // CRITICAL UPDATE: Handle daily limit error response
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Logging Denied",
                description: error.message || "Daily limit reached. Try again tomorrow!",
            });
        },
    });

    const handleLogSubmission = (e: React.FormEvent) => {
        e.preventDefault();
        const finalBehaviorType = customDescription || behaviorType;
        logSavingsMutation.mutate({
            behaviorType: finalBehaviorType,
            estimatedAmount: estimatedAmount,
        });
    };

    const selectQuickBehavior = (b: typeof QUICK_BEHAVIORS[0]) => {
        setBehaviorType(b.type);
        setCustomDescription('');
        setEstimatedAmount(b.value);
    }

    return (
        <div className="space-y-6 max-w-screen-2xl mx-auto p-4 h-full overflow-y-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <TrendingUp className="w-7 h-7 text-primary" />
                    B-SAVE Tracker <span className="text-xl text-muted-foreground">(Daily Wins)</span>
                </h1>
                
                <div className="flex items-center gap-2 bg-secondary/20 p-1 rounded-lg border border-border/50">
                    <Calendar className="w-4 h-4 text-muted-foreground ml-2" />
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[140px] border-none bg-transparent focus:ring-0 text-xs">
                            <SelectValue placeholder="Select Range" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                            <SelectItem value="7">Last 7 Days</SelectItem>
                            <SelectItem value="15">Last 15 Days</SelectItem>
                            <SelectItem value="30">Last 30 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="bg-card border-border/50 shadow-xl overflow-hidden min-h-[500px]">
                <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                    
                    <div className="p-6 border-b lg:border-b-0 lg:border-r border-border/50 space-y-6">
                        <CardHeader className="px-0 pt-0">
                            <CardTitle className="text-white flex items-center gap-2 text-xl">
                                <Zap className="w-5 h-5 text-primary" />
                                Log Your Behavioral Win
                            </CardTitle>
                            <CardDescription>Enter your smart choices to earn XP.</CardDescription>
                        </CardHeader>
                        
                        <form onSubmit={handleLogSubmission} className="space-y-4">
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Quick Log Behavior</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {QUICK_BEHAVIORS.map((b) => (
                                        <Button
                                            key={b.type}
                                            type="button"
                                            variant={behaviorType === b.type ? "default" : "outline"}
                                            className={`justify-start h-auto p-3 text-xs transition-all ${
                                                behaviorType === b.type 
                                                ? 'bg-primary text-black font-bold hover:bg-primary/90' 
                                                : 'border-border bg-secondary/20 hover:bg-secondary/40 text-white'
                                            }`}
                                            onClick={() => selectQuickBehavior(b)}
                                        >
                                            <CheckCircle className="w-3 h-3 mr-2 shrink-0" />
                                            {b.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="custom-description">Custom Description</Label>
                                <Textarea 
                                    id="custom-description"
                                    placeholder="What did you save on today?"
                                    value={customDescription}
                                    onChange={(e) => {
                                        setCustomDescription(e.target.value);
                                        setBehaviorType('');
                                    }}
                                    className="bg-secondary/20 border-border focus:border-primary h-24 resize-none transition-all" 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Estimated Savings (₹)</Label>
                                <Input 
                                    id="amount"
                                    type="number"
                                    placeholder="Amount"
                                    value={estimatedAmount}
                                    onChange={(e) => setEstimatedAmount(e.target.value)} 
                                    className="bg-secondary/20 border-border focus:border-primary" 
                                    required
                                />
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full bg-primary text-black hover:bg-primary/90 font-bold py-6 text-lg shadow-lg shadow-primary/20 transition-all"
                                disabled={logSavingsMutation.isPending || !estimatedAmount}
                            >
                                {logSavingsMutation.isPending ? <Loader2 className="animate-spin" /> : "Log Win & Get Instant XP"}
                            </Button>
                        </form>
                    </div>

                    <div className="p-6 bg-secondary/5 flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground flex items-center gap-1 uppercase tracking-wider text-[10px]">
                                        <Target className="w-3 h-3" /> Daily XP Status
                                    </Label>
                                    <div className="text-3xl font-black text-white">
                                        {xpToday} <span className="text-sm font-normal text-muted-foreground">/ {DAILY_XP_CAP} XP</span>
                                    </div>
                                </div>
                                <div className="text-primary font-bold">{xpProgress}%</div>
                            </div>
                            <Progress value={xpProgress} className="h-3 bg-secondary/30" indicatorClassName="bg-primary" />
                            
                            {xpToday >= DAILY_XP_CAP && (
                                <div className="flex items-center gap-2 text-[10px] text-primary bg-primary/10 p-2 rounded border border-primary/20 animate-pulse">
                                    <Info className="w-3 h-3" />
                                    Daily XP Cap reached!
                                </div>
                            )}
                        </div>

                        <div className="h-[280px] w-full flex flex-col space-y-2">
                            <Label className="text-muted-foreground flex items-center gap-1 uppercase tracking-wider text-[10px]">
                                <TrendingUp className="w-3 h-3" /> Savings Trend (Last {timeRange} Days)
                            </Label>
                            <div className="flex-1 bg-secondary/5 rounded-xl border border-border/30 p-2 overflow-hidden">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={filteredHistory}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#00D4AA" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis 
                                            dataKey="loggedAt" 
                                            tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            stroke="#888"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis hide domain={[0, 'auto']} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', fontSize: '12px' }}
                                            itemStyle={{ color: '#00D4AA' }}
                                            labelFormatter={(val) => new Date(val).toLocaleDateString()}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="estimatedAmount" 
                                            stroke="#00D4AA" 
                                            fillOpacity={1} 
                                            fill="url(#colorValue)" 
                                            strokeWidth={3}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pb-8">
                <History className="w-3 h-3" />
                <span>Self-reported wins have a daily cap of {DAILY_XP_CAP} XP.</span>
            </div>
        </div>
    );
}*/
// client/src/pages/BehavioralSavingsPage.tsx

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Zap, CheckCircle, TrendingUp, Target, History, Calendar, Info } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { behavioral, settings } from "@/lib/api"; // Updated imports
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface LogSavingsSuccessData {
    message: string;
    xpEarned: number;
    logId: string;
}

interface LogSavingsVariables {
    estimatedAmount: string;
    behaviorType: string;
    customDescription?: string;
}

// Currency Symbol Helper
const getCurrencySymbol = (currencyCode: string | undefined) => {
    switch (currencyCode) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        default: return '₹';
    }
};

const DAILY_XP_CAP = 500;

export default function BehavioralSavingsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [estimatedAmount, setEstimatedAmount] = useState('');
    const [behaviorType, setBehaviorType] = useState('');
    const [customDescription, setCustomDescription] = useState('');
    const [timeRange, setTimeRange] = useState('7');

    // 1. MODULAR FETCH: Fetch History and Summary in parallel
    const { data: savingsHistory = [], isLoading: historyLoading } = useQuery({
        queryKey: ["behavioral-history"],
        queryFn: behavioral.getHistory,
    });

    const { data: summaryData } = useQuery({
        queryKey: ["behavioral-summary"],
        queryFn: behavioral.getSummary,
    });

    const { data: userSettings } = useQuery({
        queryKey: ["settings"],
        queryFn: settings.get,
    });

    const currencySymbol = getCurrencySymbol(userSettings?.currency);

    // Dynamic Quick Behaviors using User Currency
    const QUICK_BEHAVIORS = [
        { type: 'packed_lunch', label: `Packed Lunch (${currencySymbol}100)`, value: "100" },
        { type: 'walked_to_work', label: `Walked/Cycled (${currencySymbol}50)`, value: "50" },
        { type: 'reused_item', label: `Reused/Repaired (${currencySymbol}200)`, value: "200" },
        { type: 'avoided_impulse', label: `Avoided Impulse (${currencySymbol}500)`, value: "500" },
    ];

    const filteredHistory = useMemo(() => {
        if (!Array.isArray(savingsHistory)) return [];
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(timeRange));
        
        return [...savingsHistory]
            .filter((log: any) => new Date(log.loggedAt) >= cutoff)
            .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());
    }, [savingsHistory, timeRange]);

    // Use summaryData for current XP progress (Faster than calculating on client)
    const xpToday = summaryData?.xpToday || 0;
    const xpProgress = Math.min(Math.round((xpToday / DAILY_XP_CAP) * 100), 100);

    const logSavingsMutation = useMutation<LogSavingsSuccessData, Error, LogSavingsVariables>({
        mutationFn: (data) => behavioral.logSavings(data),
        onSuccess: (data) => {
            toast({
                title: "✅ Win Logged!",
                description: `You earned ${data.xpEarned} XP instantly!`,
            });
            setEstimatedAmount('');
            setBehaviorType('');
            setCustomDescription('');
            // Invalidate granular queries
            queryClient.invalidateQueries({ queryKey: ["behavioral-history"] });
            queryClient.invalidateQueries({ queryKey: ["behavioral-summary"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Logging Denied",
                description: error.message || "Daily limit reached. Try again tomorrow!",
            });
        },
    });

    const handleLogSubmission = (e: React.FormEvent) => {
        e.preventDefault();
        const finalBehaviorType = customDescription || behaviorType;
        logSavingsMutation.mutate({
            behaviorType: finalBehaviorType,
            estimatedAmount: estimatedAmount,
        });
    };

    const selectQuickBehavior = (b: any) => {
        setBehaviorType(b.type);
        setCustomDescription('');
        setEstimatedAmount(b.value);
    }

    if (historyLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-screen-2xl mx-auto p-4 h-full overflow-y-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <TrendingUp className="w-7 h-7 text-primary" />
                    B-SAVE Tracker <span className="text-xl text-muted-foreground">(Daily Wins)</span>
                </h1>
                
                <div className="flex items-center gap-2 bg-secondary/20 p-1 rounded-lg border border-border/50">
                    <Calendar className="w-4 h-4 text-muted-foreground ml-2" />
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[140px] border-none bg-transparent focus:ring-0 text-xs">
                            <SelectValue placeholder="Select Range" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                            <SelectItem value="7">Last 7 Days</SelectItem>
                            <SelectItem value="15">Last 15 Days</SelectItem>
                            <SelectItem value="30">Last 30 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="bg-card border-border/50 shadow-xl overflow-hidden min-h-[500px]">
                <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                    
                    <div className="p-6 border-b lg:border-b-0 lg:border-r border-border/50 space-y-6">
                        <CardHeader className="px-0 pt-0">
                            <CardTitle className="text-white flex items-center gap-2 text-xl">
                                <Zap className="w-5 h-5 text-primary" />
                                Log Your Behavioral Win
                            </CardTitle>
                            <CardDescription>Enter your smart choices to earn XP.</CardDescription>
                        </CardHeader>
                        
                        <form onSubmit={handleLogSubmission} className="space-y-4">
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Quick Log Behavior</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {QUICK_BEHAVIORS.map((b) => (
                                        <Button
                                            key={b.type}
                                            type="button"
                                            variant={behaviorType === b.type ? "default" : "outline"}
                                            className={`justify-start h-auto p-3 text-xs transition-all ${
                                                behaviorType === b.type 
                                                ? 'bg-primary text-black font-bold hover:bg-primary/90' 
                                                : 'border-border bg-secondary/20 hover:bg-secondary/40 text-white'
                                            }`}
                                            onClick={() => selectQuickBehavior(b)}
                                        >
                                            <CheckCircle className="w-3 h-3 mr-2 shrink-0" />
                                            {b.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="custom-description">Custom Description</Label>
                                <Textarea 
                                    id="custom-description"
                                    placeholder="What did you save on today?"
                                    value={customDescription}
                                    onChange={(e) => {
                                        setCustomDescription(e.target.value);
                                        setBehaviorType('');
                                    }}
                                    className="bg-secondary/20 border-border focus:border-primary h-24 resize-none transition-all" 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Estimated Savings ({currencySymbol})</Label>
                                <Input 
                                    id="amount"
                                    type="number"
                                    placeholder="Amount"
                                    value={estimatedAmount}
                                    onChange={(e) => setEstimatedAmount(e.target.value)} 
                                    className="bg-secondary/20 border-border focus:border-primary" 
                                    required
                                />
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full bg-primary text-black hover:bg-primary/90 font-bold py-6 text-lg shadow-lg shadow-primary/20 transition-all"
                                disabled={logSavingsMutation.isPending || !estimatedAmount}
                            >
                                {logSavingsMutation.isPending ? <Loader2 className="animate-spin" /> : "Log Win & Get Instant XP"}
                            </Button>
                        </form>
                    </div>

                    <div className="p-6 bg-secondary/5 flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground flex items-center gap-1 uppercase tracking-wider text-[10px]">
                                        <Target className="w-3 h-3" /> Daily XP Status
                                    </Label>
                                    <div className="text-3xl font-black text-white">
                                        {xpToday} <span className="text-sm font-normal text-muted-foreground">/ {DAILY_XP_CAP} XP</span>
                                    </div>
                                </div>
                                <div className="text-primary font-bold">{xpProgress}%</div>
                            </div>
                            <Progress value={xpProgress} className="h-3 bg-secondary/30" indicatorClassName="bg-primary" />
                            
                            {xpToday >= DAILY_XP_CAP && (
                                <div className="flex items-center gap-2 text-[10px] text-primary bg-primary/10 p-2 rounded border border-primary/20 animate-pulse">
                                    <Info className="w-3 h-3" />
                                    Daily XP Cap reached!
                                </div>
                            )}
                        </div>

                        <div className="h-[280px] w-full flex flex-col space-y-2">
                            <Label className="text-muted-foreground flex items-center gap-1 uppercase tracking-wider text-[10px]">
                                <TrendingUp className="w-3 h-3" /> Savings Trend (Last {timeRange} Days)
                            </Label>
                            <div className="flex-1 bg-secondary/5 rounded-xl border border-border/30 p-2 overflow-hidden">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={filteredHistory}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#00D4AA" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis 
                                            dataKey="loggedAt" 
                                            tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            stroke="#888"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis 
                                            stroke="#888"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => `${currencySymbol}${val}`} 
                                        />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                                            itemStyle={{ color: '#00D4AA' }}
                                            labelFormatter={(val) => new Date(val).toLocaleDateString()}
                                            formatter={(value: number) => [`${currencySymbol}${value}`, 'Savings']}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="estimatedAmount" 
                                            stroke="#00D4AA" 
                                            fillOpacity={1} 
                                            fill="url(#colorValue)" 
                                            strokeWidth={3}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pb-8">
                <History className="w-3 h-3" />
                <span>Self-reported wins have a daily cap of {DAILY_XP_CAP} XP.</span>
            </div>
        </div>
    );
}