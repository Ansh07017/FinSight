// client/src/pages/ReportsPage.tsx

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IndianRupee, TrendingUp, TrendingDown, PiggyBank, Loader2, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { reports } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const calculatePercentage = (savings: number, income: number) => {
  if (income <= 0) return "0.0";
  return ((savings / income) * 100).toFixed(1);
};

export default function ReportsPage() {
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["reports"],
    queryFn: reports.history,
  });

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading reports",
        description: error.message,
      });
    }
  }, [error, toast]);

  // Destructure data with fallbacks
  const {
    monthlyData = [],
    avgIncome = 0,
    avgIncomeChange = 0,
    avgSavingsRate = 0,
    totalSavings = 0,
  } = data || {};

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#00D4AA]" />
        <p className="text-muted-foreground animate-pulse">Generating your financial breakdown...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Financial Intelligence</h1>
          <p className="text-muted-foreground">Deep dive into your cash flow and wealth accumulation.</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-lg border border-border/50 text-xs font-medium text-white">
          <Calendar className="w-4 h-4 text-[#00D4AA]" />
          Last {monthlyData.length} Months Analyzed
        </div>
      </div>

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Average Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white flex items-center">
              <IndianRupee className="w-6 h-6 mr-1 text-[#00D4AA]" />
              {avgIncome.toLocaleString('en-IN')}
            </div>
            <div className={`flex items-center text-xs mt-2 font-medium ${avgIncomeChange >= 0 ? 'text-[#00D4AA]' : 'text-red-400'}`}>
              {avgIncomeChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {avgIncomeChange >= 0 ? '+' : ''}{avgIncomeChange.toFixed(1)}% performance shift
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border/50 shadow-sm border-t-4 border-t-[#00D4AA]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financial Efficiency (Savings %)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{avgSavingsRate.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-[#00D4AA] mt-2 font-medium">
              <PiggyBank className="w-4 h-4 mr-1" />
              {avgSavingsRate > 30 ? 'Elite Savings Tier' : 'Growing Momentum'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Cumulative Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white flex items-center">
              <IndianRupee className="w-6 h-6 mr-1 text-[#00D4AA]" />
              {totalSavings.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <TrendingUp className="w-3 h-3 mr-1 text-[#00D4AA]" />
              Aggregated over {monthlyData.length} cycles
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Dimensional Comparison Chart */}
      <Card className="bg-card border-border/50 shadow-lg overflow-hidden">
        <CardHeader className="border-b border-border/20 bg-secondary/5">
          <CardTitle className="text-white text-lg">Cash Flow Comparison</CardTitle>
          <CardDescription>Visualizing the delta between earnings and expenditures</CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="h-[400px] w-full">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#888" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontSize: '12px' }}
                    cursor={{fill: 'rgba(255,255,255,0.03)'}}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }} />
                  <Bar dataKey="income" name="Income" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={20} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} />
                  <Bar dataKey="savings" name="Net Savings" fill="#00D4AA" radius={[6, 6, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                Insufficient data to generate trend analysis.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                  <TableHead className="text-muted-foreground font-bold px-6 py-4">Financial Month</TableHead>
                  <TableHead className="text-right text-blue-400 font-bold">Total Income</TableHead>
                  <TableHead className="text-right text-red-400 font-bold">Total Expense</TableHead>
                  <TableHead className="text-right text-[#00D4AA] font-bold">Net Savings</TableHead>
                  <TableHead className="text-right text-white font-bold px-6">Savings Ratio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((row: any) => (
                  <TableRow key={row.month} className="hover:bg-[#00D4AA]/5 border-border/50 transition-colors">
                    <TableCell className="font-bold text-white px-6 py-4">{row.month}</TableCell>
                    <TableCell className="text-right font-mono text-sm">₹{row.income.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-300">₹{row.expense.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-[#00D4AA] font-bold">₹{row.savings.toLocaleString()}</TableCell>
                    <TableCell className="text-right px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-tighter ${
                        Number(calculatePercentage(row.savings, row.income)) > 35 
                          ? "bg-[#00D4AA]/20 text-[#00D4AA] border border-[#00D4AA]/30" 
                          : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                      }`}>
                        {calculatePercentage(row.savings, row.income)}% Saved
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-16 italic">
              Record at least one month of transactions to see your breakdown.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}