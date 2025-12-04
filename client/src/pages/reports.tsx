import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IndianRupee, TrendingUp, TrendingDown, PiggyBank, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { reports } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const calculatePercentage = (savings: number, income: number) => {
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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const {
    monthlyData = [],
    avgIncome = 0,
    avgIncomeChange = 0,
    avgSavingsRate = 0,
    totalSavings = 0,
  } = data || {};

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Financial Report</h1>
          <p className="text-muted-foreground">Detailed breakdown of your income, expenses, and savings</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Monthly Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white flex items-center">
                <IndianRupee className="w-5 h-5 mr-1" />
                {avgIncome.toLocaleString('en-IN')}
              </div>
              <div className={`flex items-center text-xs mt-1 ${avgIncomeChange >= 0 ? 'text-success' : 'text-red-400'}`}>
                {avgIncomeChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {avgIncomeChange >= 0 ? '+' : ''}{avgIncomeChange.toFixed(1)}% vs last year
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Savings Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{avgSavingsRate.toFixed(1)}%</div>
              <div className="flex items-center text-xs text-success mt-1">
                <PiggyBank className="w-3 h-3 mr-1" />
                {avgSavingsRate > 40 ? 'Healthy financial status' : 'Room for improvement'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Savings ({monthlyData.length} Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white flex items-center">
                <IndianRupee className="w-5 h-5 mr-1" />
                {totalSavings.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center text-xs text-primary mt-1">
                On track for yearly goal
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-white">Income vs Expense vs Savings</CardTitle>
            <CardDescription>{monthlyData.length} Month Comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="month" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="savings" name="Savings" fill="#00D4AA" radius={[4, 4, 0, 0]} />
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

        {/* Detailed Table */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-white">Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-muted-foreground">Month</TableHead>
                    <TableHead className="text-right text-blue-400">Income</TableHead>
                    <TableHead className="text-right text-red-400">Expense</TableHead>
                    <TableHead className="text-right text-primary">Savings</TableHead>
                    <TableHead className="text-right text-white">% Saved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map((row: any) => (
                    <TableRow key={row.month} className="hover:bg-white/5 border-border">
                      <TableCell className="font-medium text-white">{row.month}</TableCell>
                      <TableCell className="text-right font-mono">₹{row.income.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">₹{row.expense.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-primary font-semibold">₹{row.savings.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          Number(calculatePercentage(row.savings, row.income)) > 40 
                            ? "bg-primary/10 text-primary" 
                            : "bg-yellow-500/10 text-yellow-500"
                        }`}>
                          {calculatePercentage(row.savings, row.income)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No report data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
