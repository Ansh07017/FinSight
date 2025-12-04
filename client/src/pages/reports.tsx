import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IndianRupee, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

const monthlyData = [
  { month: "July", income: 82000, expense: 45000, savings: 37000 },
  { month: "August", income: 82000, expense: 48000, savings: 34000 },
  { month: "September", income: 85000, expense: 42000, savings: 43000 },
  { month: "October", income: 85000, expense: 55000, savings: 30000 },
  { month: "November", income: 85000, expense: 38000, savings: 47000 },
  { month: "December", income: 88000, expense: 42500, savings: 45500 }, // Projected
];

const calculatePercentage = (savings: number, income: number) => {
  return ((savings / income) * 100).toFixed(1);
};

export default function ReportsPage() {
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
                84,500
              </div>
              <div className="flex items-center text-xs text-success mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +3.2% vs last year
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Savings Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">45.8%</div>
              <div className="flex items-center text-xs text-success mt-1">
                <PiggyBank className="w-3 h-3 mr-1" />
                Healthy financial status
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Savings (6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white flex items-center">
                <IndianRupee className="w-5 h-5 mr-1" />
                2,36,500
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
            <CardDescription>6 Month Comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
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
            </div>
          </CardContent>
        </Card>

        {/* Detailed Table */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-white">Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
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
                {monthlyData.map((row) => (
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
