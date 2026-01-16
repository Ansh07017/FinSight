// client/src/pages/dashboard.tsx

// 1. IMPORTS
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Target, 
  Wallet, 
  Loader2, 
  Calendar,
  Filter
} from "lucide-react";
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  BarChart, 
  Bar, 
  Cell, 
  LabelList,
  CartesianGrid 
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { dashboard, settings, profile, transactions } from "@/lib/api"; 

// 2. HELPERS
const safeParseFloat = (value: string | number | undefined, defaultValue: number = 0) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || defaultValue;
    return defaultValue;
};

const getCurrencySymbol = (currencyCode: string | undefined) => {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
    return symbols[currencyCode || 'INR'] || '₹';
};

export default function Dashboard() {
    const { toast } = useToast();
    
    // 3. UI STATE
    const [dateRange, setDateRange] = useState("30d");

    // 4. QUERIES (Data Fetching)
    
    // Note: We pass 'dateRange' to the API function so the server filters the data
    const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
        queryKey: ["dashboard-stats", dateRange], 
        queryFn: () => dashboard.getStats(dateRange), // FIXED: Passing the arg
    });

    const { data: weeklySpendTrend, isLoading: trendLoading } = useQuery({
        queryKey: ["dashboard-trend", dateRange],
        queryFn: () => dashboard.getTrend(dateRange), // FIXED
    });

    const { data: expensesByCategory, isLoading: catLoading } = useQuery({
        queryKey: ["dashboard-categories", dateRange],
        queryFn: () => dashboard.getCategories(dateRange), // FIXED
    });

    const { data: recentTransactions, isLoading: txLoading } = useQuery({
        queryKey: ["transactions-recent"],
        queryFn: transactions.getRecent,
    });

    const { data: profileResponse, isLoading: profileLoading } = useQuery({
        queryKey: ["profile-full"],
        queryFn: profile.get,
    });

    const { data: settingsData } = useQuery({
        queryKey: ["settings"],
        queryFn: settings.get,
    });

    // 5. EFFECTS (Error Handling)
    useEffect(() => {
        if (statsError) {
            toast({
                variant: "destructive",
                title: "Dashboard Error",
                description: "Could not load financial data. Please try again.",
            });
        }
    }, [statsError, toast]);

    // 6. LOGIC & TRANSFORMATION
    const currencySymbol = getCurrencySymbol(settingsData?.currency);
    const profileData = profileResponse?.profile || {};
    
    const currentBalance = safeParseFloat(profileData.currentBalance); 
    const monthlySavings = safeParseFloat(statsData?.savings);
    const monthlyIncome = safeParseFloat(statsData?.income);
    
    // Goal Calculation Logic
    const targetValue = safeParseFloat(profileData.targetValue);
    const goalType = profileData.goalType || 'monthly_amount';
    
    let goalProgress = 0;
    let goalLabel = "";

    if (targetValue > 0) {
        if (goalType === 'monthly_amount') {
            goalProgress = (monthlySavings / targetValue) * 100;
            goalLabel = `${currencySymbol}${monthlySavings.toLocaleString()} / ${currencySymbol}${targetValue.toLocaleString()}`;
        } else {
            // Percentage of Income Goal
            const targetAmount = (targetValue / 100) * (monthlyIncome || 1); // Avoid division by zero
            goalProgress = (monthlySavings / targetAmount) * 100;
            goalLabel = `${goalProgress.toFixed(1)}% / ${targetValue}% of Income`;
        }
    }
    
    // Visual clamping (0-100%) so the bar doesn't break layout
    const visualProgress = Math.min(Math.max(goalProgress, 0), 100);
    const isGoalMet = goalProgress >= 100;

    const rewardPoints = safeParseFloat(profileData.rewardPoints || 0);
    const rewardTier = profileData.tier || "Bronze";
    
    // 7. LOADING STATE
    const isInitialLoading = statsLoading && profileLoading;

    if (isInitialLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-10 h-10 animate-spin text-[#00D4AA]" />
            </div>
        );
    }

    // 8. RENDER
    return (
        <div className="space-y-8 pb-10">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[140px] bg-secondary/50 border-border">
                            <Calendar className="w-4 h-4 mr-2 text-[#00D4AA]" />
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-white">
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="15d">Last 15 Days</SelectItem>
                            <SelectItem value="30d">This Month</SelectItem>
                            <SelectItem value="3m">Last Quarter</SelectItem>
                            <SelectItem value="1y">Yearly</SelectItem>
                        </SelectContent>
                    </Select>

                    <Link href="/expenses">
                        <Button className="bg-[#00D4AA] text-black hover:bg-[#00D4AA]/90 font-bold shadow-[0_0_20px_-5px_rgba(0,212,170,0.3)]">
                            <ArrowUpRight className="w-5 h-5 mr-1" /> Add Expense
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Balance */}
                <Card className="bg-card border-border/50 hover:border-[#00D4AA]/30 transition-all duration-300 group shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Balance</CardTitle>
                        <Wallet className="h-4 w-4 text-[#00D4AA] group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white flex items-center">
                            <span className="text-xl mr-1 text-[#00D4AA] font-sans">{currencySymbol}</span>
                            {currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Available across all accounts</p>
                    </CardContent>
                </Card>
                
                {/* Savings & Goals */}
                <Card className="bg-card border-border/50 hover:border-blue-500/30 transition-all duration-300 group shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Monthly Savings</CardTitle>
                        <Target className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white flex items-center">
                            <span className="text-xl mr-1 text-blue-500 font-sans">{currencySymbol}</span>
                            {monthlySavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        
                        {/* Goal Progress Bar */}
                        <div className="mt-3 space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                <span className={isGoalMet ? "text-[#00D4AA]" : (monthlySavings >= 0 ? "text-blue-400" : "text-red-400")}>
                                    {targetValue > 0 ? (isGoalMet ? "Goal Met! 🎉" : `${Math.round(goalProgress)}% of Goal`) : "No Goal Set"}
                                </span>
                                <span className="text-muted-foreground">{targetValue > 0 ? goalLabel : "Set a target in Settings"}</span>
                            </div>
                            <Progress 
                                value={visualProgress} 
                                className="h-2 bg-secondary" 
                                indicatorClassName={isGoalMet ? "bg-[#00D4AA]" : (monthlySavings < 0 ? "bg-red-500" : "bg-blue-500")} 
                            />
                        </div>
                    </CardContent>
                </Card>
                
                {/* Rewards */}
                <Card className="bg-card border-border/50 hover:border-purple-500/30 transition-all duration-300 group shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Rewards</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{rewardPoints.toLocaleString()} <span className="text-sm text-muted-foreground font-normal">XP</span></div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest border border-purple-500/20 px-2 py-0.5 rounded-md bg-purple-500/5">
                                {rewardTier}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Trend Chart */}
                <Card className="bg-card border-border/50 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[#00D4AA]" />
                            Spending Trend
                        </CardTitle>
                        <CardDescription>Daily expenses over the last {dateRange}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {trendLoading ? (
                                <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-muted-foreground" /></div>
                            ) : weeklySpendTrend && weeklySpendTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weeklySpendTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#00D4AA" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="#666" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false}
                                            dy={10} 
                                        />
                                        <YAxis 
                                            stroke="#666" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false}
                                            tickFormatter={(value) => `${currencySymbol}${value}`} 
                                        />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ color: '#fff', fontWeight: 600 }}
                                            labelStyle={{ color: '#a1a1aa' }}
                                            formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Spent']}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="amount" 
                                            stroke="#00D4AA" 
                                            strokeWidth={3} 
                                            fillOpacity={1} 
                                            fill="url(#colorAmount)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                    <Filter className="w-8 h-8 opacity-20" />
                                    <p>No activity in this period</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Categories Chart */}
                <Card className="bg-card border-border/50 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-500" />
                            Top Categories
                        </CardTitle>
                        <CardDescription>Breakdown by expense type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {catLoading ? (
                                <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-muted-foreground" /></div>
                            ) : expensesByCategory && expensesByCategory.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                        data={expensesByCategory} 
                                        layout="vertical" 
                                        margin={{ left: 0, right: 50, top: 0, bottom: 0 }} // Added right margin for overflow
                                        barSize={20}
                                    >
                                        <XAxis type="number" hide />
                                        <YAxis 
                                            dataKey="name" 
                                            type="category" 
                                            stroke="#888" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false} 
                                            width={100} 
                                        />
                                        <Tooltip 
                                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ color: '#fff', fontWeight: 600 }}
                                            formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Amount']}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {expensesByCategory.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                            <LabelList 
                                                dataKey="value" 
                                                position="right" 
                                                fill="#ffffff" 
                                                fontSize={12}
                                                fontWeight={600}
                                                formatter={(value: number) => `${currencySymbol}${value.toLocaleString()}`}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                    <Filter className="w-8 h-8 opacity-20" />
                                    <p>No expenses recorded</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 4. Recent Transactions */}
            <Card className="bg-card border-border/50 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold text-white">Recent Transactions</CardTitle>
                    <Link href="/expenses">
                        <Button variant="ghost" className="text-xs text-[#00D4AA] hover:text-[#00D4AA] hover:bg-[#00D4AA]/10">View All</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {txLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                        ) : recentTransactions && recentTransactions.length > 0 ? (
                            recentTransactions.map((tx: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 hover:bg-secondary/40 border border-transparent hover:border-[#00D4AA]/30 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-inner ${tx.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                            {tx.type === 'income' ? <ArrowDownRight className="w-5 h-5 text-green-500" /> : <ArrowUpRight className="w-5 h-5 text-red-500" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{tx.title || "Untitled"}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                                                    {tx.category}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`font-black text-base flex items-center ${tx.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                                        <span className="mr-0.5 text-xs font-sans opacity-70">{currencySymbol}</span>
                                        {safeParseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-10 italic bg-secondary/10 rounded-xl border border-dashed border-border/50">
                                No recent activity found
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}