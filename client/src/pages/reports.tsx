// client/src/pages/ReportsPage.tsx

// 1. IMPORTS
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Legend, AreaChart, Area, CartesianGrid 
} from "recharts";
import { 
  Wallet, PieChart, Loader2, Download, 
  Printer, Share2, FileText, Copy, Check,Calendar 
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { reports, profile, settings } from "@/lib/api";

// 2. HELPERS
const getCurrencySymbol = (code?: string) => {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
    return symbols[code || 'INR'] || '₹';
};

const safeParseFloat = (val: any) => parseFloat(val) || 0;

const calculatePercentage = (savings: number, income: number) => {
  if (income <= 0) return "0.0";
  return ((savings / income) * 100).toFixed(1);
};

export default function ReportsPage() {
    // 3. HOOKS
    const { toast } = useToast();
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [copied, setCopied] = useState(false);
    
    // 4. DATA FETCHING
    const { data: profileResponse, isLoading: profileLoading } = useQuery({
        queryKey: ["profile-full"],
        queryFn: profile.get,
    });

    const { data: historyData, isLoading: historyLoading } = useQuery({
        queryKey: ["reports-history"],
        queryFn: reports.history,
    });

    const { data: settingsData } = useQuery({
        queryKey: ["settings"],
        queryFn: settings.get,
    });

    // 5. DATA PROCESSING
    const currencySymbol = getCurrencySymbol(settingsData?.currency);
    const profileData = profileResponse?.profile || {};
    
    // Financial Health (From Onboarding)
    const liquidBalance = safeParseFloat(profileData.currentBalance);
    const investedSavings = safeParseFloat(profileData.totalSavings);
    const netWorth = liquidBalance + investedSavings;

    // Chart Data
    const monthlyData = useMemo(() => {
        if (!historyData?.monthlyData) return [];
        return [...historyData.monthlyData].reverse().slice(0, 12); 
    }, [historyData]);

    const avgSavingsRate = historyData?.monthlyData?.length 
        ? (historyData.monthlyData.reduce((acc: number, curr: any) => acc + (curr.income > 0 ? (curr.savings / curr.income) : 0), 0) / historyData.monthlyData.length) * 100 
        : 0;

    // 6. ACTION HANDLERS

    // Generate CSV Content
    const generateCSV = () => {
        const headers = ["Month", "Income", "Expense", "Savings", "Savings Rate (%)"];
        const rows = monthlyData.map((row: any) => [
            row.month, row.income, row.expense, row.savings, calculatePercentage(row.savings, row.income)
        ]);
        return "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    };

    const handleExportCSV = () => {
        if (!monthlyData.length) return toast({ variant: "destructive", title: "No Data", description: "Nothing to export yet." });
        const encodedUri = encodeURI(generateCSV());
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `finsight_report_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Exported", description: "CSV downloaded successfully." });
    };

    const handlePrint = () => window.print();

    // Native Web Share / Copy Fallback
    const handleShare = async () => {
        const summary = `📊 Finsight Report (${year})\n\n💰 Net Worth: ${currencySymbol}${netWorth.toLocaleString()}\n🏦 Savings Rate: ${avgSavingsRate.toFixed(1)}%\n📈 Total Saved: ${currencySymbol}${safeParseFloat(historyData?.totalSavings).toLocaleString()}\n\nTracked via Finsight.`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Financial Report ${year}`,
                    text: summary,
                });
                toast({ title: "Shared", description: "Report shared successfully." });
            } catch (error) {
                // User cancelled or share failed
            }
        } else {
            // Fallback for desktop browsers without share support
            navigator.clipboard.writeText(summary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast({ title: "Copied", description: "Summary copied to clipboard." });
        }
    };

    // 7. LOADING
    if (profileLoading || historyLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                <Loader2 className="w-10 h-10 animate-spin text-[#00D4AA]" />
            </div>
        );
    }

    // 8. RENDER
    return (
        <div className="space-y-8 pb-10 max-w-7xl mx-auto print:max-w-none">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Financial Reports</h1>
                    <p className="text-muted-foreground">Deep dive into your assets and cash flow.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-[120px] bg-secondary/50 border-border">
                            <Calendar className="w-4 h-4 mr-2 text-[#00D4AA]" />
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-white">
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* SECTION 1: FINANCIAL OVERVIEW GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Net Worth */}
                <Card className="bg-card border-border/50 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#00D4AA] group-hover:w-2 transition-all" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Net Worth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl lg:text-3xl font-black text-white flex items-center gap-2">
                            {currencySymbol}{netWorth.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Liquid + Invested</p>
                    </CardContent>
                </Card>

                {/* Liquid Assets */}
                <Card className="bg-card border-border/50 shadow-lg group">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Liquid Assets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                            <Wallet className="w-5 h-5 text-blue-500" />
                            {currencySymbol}{liquidBalance.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Available Balance</p>
                    </CardContent>
                </Card>

                {/* Invested */}
                <Card className="bg-card border-border/50 shadow-lg group">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Invested</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white flex items-center gap-2 group-hover:text-purple-400 transition-colors">
                            <PieChart className="w-5 h-5 text-purple-500" />
                            {currencySymbol}{investedSavings.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Savings Reserves</p>
                    </CardContent>
                </Card>

                {/* --- NEW: REPORT ACTIONS CARD --- */}
                <Card className="bg-gradient-to-br from-card to-secondary/10 border-border/50 shadow-lg print:hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-white uppercase tracking-wider flex items-center gap-2">
                            <Download className="w-4 h-4 text-[#00D4AA]" /> Report Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-2 pt-1">
                        <Button size="icon" variant="outline" className="h-10 w-10 border-border/60 hover:bg-[#00D4AA]/10 hover:text-[#00D4AA] hover:border-[#00D4AA]" onClick={handleExportCSV} title="Download CSV">
                            <FileText className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-10 w-10 border-border/60 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500" onClick={handlePrint} title="Print PDF">
                            <Printer className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-10 w-10 border-border/60 hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500" onClick={handleShare} title="Share Report">
                            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* SECTION 2: CHARTS */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-secondary/50 border border-border/50 mb-6 print:hidden">
                    <TabsTrigger value="overview">Cash Flow</TabsTrigger>
                    <TabsTrigger value="savings">Savings Analysis</TabsTrigger>
                </TabsList>

                {/* TAB 1: Income vs Expense */}
                <TabsContent value="overview" className="space-y-6">
                    <Card className="bg-card border-border/50 shadow-xl">
                        <CardHeader className="border-b border-border/20 bg-secondary/5">
                            <CardTitle className="text-lg font-bold text-white">Income vs Expense</CardTitle>
                            <CardDescription>Monthly cash flow comparison</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[400px] w-full">
                                {monthlyData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                            <XAxis dataKey="month" stroke="#666" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                                            <Tooltip 
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                                                formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, '']}
                                            />
                                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                                            <Bar dataKey="income" name="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                            <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                                        No transaction history found for {year}.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: Savings Rate */}
                <TabsContent value="savings" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 bg-card border-border/50 shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-white">Savings Trend</CardTitle>
                                <CardDescription>Net savings per month</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#00D4AA" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                            <XAxis dataKey="month" stroke="#666" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                                                formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Net Savings']}
                                            />
                                            <Area type="monotone" dataKey="savings" stroke="#00D4AA" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Efficiency Score Card */}
                        <Card className="bg-card border-border/50 shadow-xl flex flex-col justify-center">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-white">Efficiency Score</CardTitle>
                                <CardDescription>Average savings rate</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center py-8">
                                <div className="relative flex items-center justify-center w-40 h-40 rounded-full border-8 border-secondary/50">
                                    <div 
                                        className="absolute inset-0 rounded-full border-8 border-t-transparent border-l-transparent border-[#00D4AA] transform -rotate-45 transition-all duration-1000" 
                                        style={{ transform: `rotate(${Math.min(avgSavingsRate * 3.6, 360)}deg)` }}
                                    ></div>
                                    <div className="text-center">
                                        <span className="text-4xl font-black text-white">{Math.round(avgSavingsRate)}%</span>
                                        <p className="text-xs text-muted-foreground mt-1">Saved</p>
                                    </div>
                                </div>
                                <div className="mt-8 space-y-3 text-center w-full">
                                    <div className="flex justify-between items-center text-sm px-4">
                                        <span className="text-muted-foreground">Total Income</span>
                                        <span className="text-white font-mono">{currencySymbol}{safeParseFloat(historyData?.monthlyData?.reduce((a:any, b:any) => a + b.income, 0)).toLocaleString()}</span>
                                    </div>
                                    <div className="w-full h-px bg-border/50" />
                                    <div className="flex justify-between items-center text-sm px-4">
                                        <span className="text-muted-foreground">Total Saved</span>
                                        <span className="text-[#00D4AA] font-mono">{currencySymbol}{safeParseFloat(historyData?.totalSavings).toLocaleString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Granular Table Data */}
            <Card className="bg-card border-border/50 shadow-md">
                <CardHeader className="border-b border-border/20">
                    <CardTitle className="text-white text-lg font-bold">Monthly Granular Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {monthlyData.length > 0 ? (
                        <Table>
                            <TableHeader className="bg-secondary/10">
                                <TableRow className="hover:bg-transparent border-border/50">
                                    <TableHead className="text-muted-foreground font-bold px-6 py-4">Month</TableHead>
                                    <TableHead className="text-right text-blue-400 font-bold">Income</TableHead>
                                    <TableHead className="text-right text-red-400 font-bold">Expense</TableHead>
                                    <TableHead className="text-right text-[#00D4AA] font-bold">Savings</TableHead>
                                    <TableHead className="text-right text-white font-bold px-6">Ratio</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monthlyData.map((row: any) => (
                                    <TableRow key={row.month} className="hover:bg-[#00D4AA]/5 border-border/50 transition-colors">
                                        <TableCell className="font-bold text-white px-6 py-4">{row.month}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{currencySymbol}{row.income.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-mono text-sm text-red-300">{currencySymbol}{row.expense.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-mono text-sm text-[#00D4AA] font-bold">{currencySymbol}{row.savings.toLocaleString()}</TableCell>
                                        <TableCell className="text-right px-6">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                                Number(calculatePercentage(row.savings, row.income)) > 20 
                                                    ? "bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/20" 
                                                    : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                                            }`}>
                                                {calculatePercentage(row.savings, row.income)}%
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center text-muted-foreground py-16 italic">
                            Record transactions to generate your report.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}