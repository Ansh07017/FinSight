// client/src/pages/dashboard.tsx
/*
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, IndianRupee, TrendingUp, Target, Wallet, Loader2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Cell,LabelList } from "recharts";
import { Link } from "wouter";
// Assuming this is the correct path and import for your single dashboard API call
import { dashboard, settings } from "@/lib/api"; 
import { useToast } from "@/hooks/use-toast";

// Helper function to safely get numeric value from a string
const safeParseFloat = (value: string | number | undefined, defaultValue: number = 0) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || defaultValue;
    return defaultValue;
};

// --- NEW: Currency Symbol Helper ---
const getCurrencySymbol = (currencyCode: string | undefined) => {
    switch (currencyCode) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        default: return '₹';
    }
};

export default function Dashboard() {
    const { toast } = useToast();
    
    // Using the original monolithic query for now
    const { data, isLoading, error } = useQuery({
        queryKey: ["dashboard"],
        queryFn: dashboard.get,
    });

    // Added settings query to fetch user currency preference
    const { data: settingsData } = useQuery({
        queryKey: ["settings"],
        queryFn: settings.get,
    });

    useEffect(() => {
        if (error) {
            toast({
                variant: "destructive",
                title: "Error loading dashboard",
                description: error.message,
            });
        }
    }, [error, toast]);

    // --- Dynamic Data Mapping ---
    
   const { 
        profile: profileData = {}, 
        monthlyStats: statsData = {}, // Renamed monthlyStats to statsData for clarity
        weeklySpendTrend = [],         // Destructure chart arrays here
        expensesByCategory = [],      // Destructure chart arrays here
        recentTransactions = [],
    } = data || {};

    const currencySymbol = getCurrencySymbol(settingsData?.currency);

    // 1. Core Stats (Dynamically pulled from API response fields)
    const totalBalance = safeParseFloat(profileData.currentBalance); 
    // Assuming monthlyStats.netSavings exists or calculating it here
    const monthlySavings = safeParseFloat(statsData.savings); 
    
    // Placeholder/Mock values for data not yet provided by the current monolithic API:
    const balanceChange = 5.2; // Requires previous month's data
    const savingsStatus = monthlySavings > 0 ? "On track for goal" : "Below target";
    const rewardPoints = safeParseFloat(profileData.rewardPoints || 1200);
    const rewardTier = profileData.tier || "Gold Tier Member";
    const rewardProgress = safeParseFloat(profileData.rewardProgress || 75);
  

    // --- Loading State ---

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            
            // 1. HEADER AND ADD EXPENSE BUTTON (RESTORED) 
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
                </div>
                <Link href="/expenses">
                    <Button className="bg-primary text-black hover:bg-primary/90 font-semibold shadow-[0_0_15px_-3px_rgba(0,212,170,0.4)]">
                        Add Expense
                    </Button>
                </Link>
            </div>
            // ------------------------------------------- 

            // 2. STATS GRID 
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                // Total Balance Card 
                <Card className="bg-card border-border/50 hover:border-primary/30 transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
                        <Wallet className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white flex items-center">
                            <span className="mr-1 text-primary">{currencySymbol}</span>
                            {totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className={`text-xs mt-1 flex items-center ${balanceChange >= 0 ? 'text-success' : 'text-red-400'}`}>
                            {balanceChange >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {balanceChange >= 0 ? '+' : ''}{balanceChange.toFixed(1)}% from last month
                        </p>
                    </CardContent>
                </Card>
                
                // Monthly Savings Card 
                <Card className="bg-card border-border/50 hover:border-accent/30 transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Savings</CardTitle>
                        <Target className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white flex items-center">
                            <span className="mr-1 text-accent">{currencySymbol}</span>
                            {monthlySavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className={`text-xs mt-1 flex items-center ${monthlySavings > 0 ? 'text-success' : 'text-red-400'}`}>
                            {monthlySavings > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {savingsStatus}
                        </p>
                    </CardContent>
                </Card>
                
                // Reward Points Card 
                <Card className="bg-card border-border/50 hover:border-purple-500/30 transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Reward Points</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{rewardPoints.toLocaleString()} XP</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {rewardTier}
                        </p>
                        <div className="w-full bg-secondary/50 h-1.5 mt-3 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full" style={{ width: `${rewardProgress}%` }} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            // 3. CHARTS SECTION 
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                // Monthly Spend Trend
                <Card className="bg-card border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-white">Monthly Spend Trend</CardTitle>
                        <CardDescription>Expenses over the last 4 weeks</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {weeklySpendTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weeklySpendTrend}>
                                        <defs>
                                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#00D4AA" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="#666" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false} 
                                        />
                                        <YAxis 
                                            stroke="#666" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false}
                                            tickFormatter={(value) => `${currencySymbol}${value}`} 
                                        />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Spent']}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="amount" 
                                            stroke="#00D4AA" 
                                            strokeWidth={2}
                                            fillOpacity={1} 
                                            fill="url(#colorAmount)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    No data available
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                // Spend by Category 
                <Card className="bg-card border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-white">Spend by Category</CardTitle>
                        <CardDescription>Where your money goes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {expensesByCategory.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={expensesByCategory} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                                        <XAxis type="number" hide />
                                        <YAxis 
                                            dataKey="name" 
                                            type="category" 
                                            stroke="#888" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false}
                                            width={70}
                                        />
                                        <Tooltip 
                                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                            contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px' }}
                                            formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Amount']}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                            {expensesByCategory.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                            <LabelList 
                                            dataKey="value" 
                                            position="right" 
                                            fill="#FFFFFF" // White color for visibility
                                            fontSize={12}
                                            // Format the label to include the currency symbol
                                            formatter={(value: number) => `${currencySymbol}${value.toLocaleString()}`}
                                        />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    No data available
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            // 4. RECENT TRANSACTIONS 
            <Card className="bg-card border-border/50">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentTransactions.length > 0 ? (
                            recentTransactions.map((tx: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                                            {tx.type === 'income' ? '💰' : '💸'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{tx.title || tx.category}</p>
                                            <p className="text-sm text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className={`font-medium flex items-center ${tx.type === 'income' ? 'text-success' : 'text-white'}`}>
                                        <span className="mr-0.5">{currencySymbol}</span>
                                        {safeParseFloat(tx.amount).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                No recent transactions
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}*/
// client/src/pages/dashboard.tsx

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, IndianRupee, TrendingUp, Target, Wallet, Loader2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Cell, LabelList } from "recharts";
import { Link } from "wouter";
// Updated to use granular API functions defined in our refactored api.ts
import { dashboard, settings, profile, transactions } from "@/lib/api"; 
import { useToast } from "@/hooks/use-toast";

// Helper function to safely get numeric value from a string
const safeParseFloat = (value: string | number | undefined, defaultValue: number = 0) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || defaultValue;
    return defaultValue;
};

// --- NEW: Currency Symbol Helper ---
const getCurrencySymbol = (currencyCode: string | undefined) => {
    switch (currencyCode) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        default: return '₹';
    }
};

export default function Dashboard() {
    const { toast } = useToast();
    
    // ========== PARALLEL API QUERIES ==========
    
    // 1. Fetch Core Stats (Income, Expense, Savings)
    const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: dashboard.getStats,
    });

    // 2. Fetch Weekly Spend Trend (Area Chart)
    const { data: weeklySpendTrend, isLoading: trendLoading } = useQuery({
        queryKey: ["dashboard-trend"],
        queryFn: dashboard.getTrend,
    });

    // 3. Fetch Category Breakdown (Bar Chart)
    const { data: expensesByCategory, isLoading: catLoading } = useQuery({
        queryKey: ["dashboard-categories"],
        queryFn: dashboard.getCategories,
    });

    // 4. Fetch Recent Transactions (Limit 10)
    const { data: recentTransactions, isLoading: txLoading } = useQuery({
        queryKey: ["transactions-recent"],
        queryFn: transactions.getRecent,
    });

    // 5. Fetch Profile/Financial for Balance and Tier
    const { data: profileResponse, isLoading: profileLoading } = useQuery({
        queryKey: ["profile-full"],
        queryFn: profile.get,
    });

    // 6. Fetch User Settings for Currency Sync
    const { data: settingsData } = useQuery({
        queryKey: ["settings"],
        queryFn: settings.get,
    });

    useEffect(() => {
        if (statsError) {
            toast({
                variant: "destructive",
                title: "Error loading dashboard",
                description: (statsError as Error).message,
            });
        }
    }, [statsError, toast]);

    // Data Mapping from Parallel Responses
    const currencySymbol = getCurrencySymbol(settingsData?.currency);
    const profileData = profileResponse?.profile || {};
    const totalBalance = safeParseFloat(profileData.currentBalance); 
    const monthlySavings = safeParseFloat(statsData?.savings); 
    
    const balanceChange = 5.2; 
    const savingsStatus = monthlySavings > 0 ? "On track for goal" : "Below target";
    const rewardPoints = safeParseFloat(profileData.rewardPoints || 0);
    const rewardTier = profileData.tier || "Bronze Tier Member";
    const rewardProgress = Math.min((rewardPoints / 5000) * 100, 100); 

    // Global loading state for initial paint
    const isInitialLoading = statsLoading && profileLoading;

    if (isInitialLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            
            {/* 1. HEADER AND ADD EXPENSE BUTTON */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
                </div>
                <Link href="/expenses">
                    <Button className="bg-primary text-black hover:bg-primary/90 font-semibold shadow-[0_0_15px_-3px_rgba(0,212,170,0.4)]">
                        Add Expense
                    </Button>
                </Link>
            </div>

            {/* 2. STATS GRID (Populates as data arrives) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Balance Card */}
                <Card className="bg-card border-border/50 hover:border-primary/30 transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
                        <Wallet className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white flex items-center">
                            <span className="mr-1 text-primary">{currencySymbol}</span>
                            {totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className={`text-xs mt-1 flex items-center ${balanceChange >= 0 ? 'text-success' : 'text-red-400'}`}>
                            {balanceChange >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {balanceChange >= 0 ? '+' : ''}{balanceChange.toFixed(1)}% from last month
                        </p>
                    </CardContent>
                </Card>
                
                {/* Monthly Savings Card */}
                <Card className="bg-card border-border/50 hover:border-accent/30 transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Savings</CardTitle>
                        <Target className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white flex items-center">
                            {statsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <span className="mr-1 text-accent">{currencySymbol}</span>}
                            {monthlySavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className={`text-xs mt-1 flex items-center ${monthlySavings > 0 ? 'text-success' : 'text-red-400'}`}>
                            {monthlySavings > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {savingsStatus}
                        </p>
                    </CardContent>
                </Card>
                
                {/* Reward Points Card */}
                <Card className="bg-card border-border/50 hover:border-purple-500/30 transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Reward Points</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{rewardPoints.toLocaleString()} XP</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {rewardTier}
                        </p>
                        <div className="w-full bg-secondary/50 h-1.5 mt-3 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${rewardProgress}%` }} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Spend Trend Chart */}
                <Card className="bg-card border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-white">Monthly Spend Trend</CardTitle>
                        <CardDescription>Expenses over the last 4 weeks</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {trendLoading ? (
                                <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>
                            ) : weeklySpendTrend && weeklySpendTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weeklySpendTrend}>
                                        <defs>
                                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#00D4AA" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis 
                                            stroke="#666" fontSize={12} tickLine={false} axisLine={false}
                                            tickFormatter={(value) => `${currencySymbol}${value}`} 
                                        />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Spent']}
                                        />
                                        <Area type="monotone" dataKey="amount" stroke="#00D4AA" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Spend by Category Chart */}
                <Card className="bg-card border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-white">Spend by Category</CardTitle>
                        <CardDescription>Where your money goes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {catLoading ? (
                                <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>
                            ) : expensesByCategory && expensesByCategory.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={expensesByCategory} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} tickLine={false} axisLine={false} width={70} />
                                        <Tooltip 
                                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                            contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px' }}
                                            formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Amount']}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                            {expensesByCategory.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                            <LabelList 
                                                dataKey="value" position="right" fill="#FFFFFF" fontSize={12}
                                                formatter={(value: number) => `${currencySymbol}${value.toLocaleString()}`}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 4. RECENT TRANSACTIONS SECTION */}
            <Card className="bg-card border-border/50">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {txLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                        ) : recentTransactions && recentTransactions.length > 0 ? (
                            recentTransactions.map((tx: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                                            {tx.type === 'income' ? '💰' : '💸'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{tx.title || tx.category}</p>
                                            <p className="text-sm text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className={`font-medium flex items-center ${tx.type === 'income' ? 'text-success' : 'text-white'}`}>
                                        <span className="mr-0.5">{currencySymbol}</span>
                                        {safeParseFloat(tx.amount).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-8">No recent transactions</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}