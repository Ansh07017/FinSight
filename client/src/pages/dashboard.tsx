import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, IndianRupee, TrendingUp, Target, Wallet } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Cell } from "recharts";
import { Link } from "wouter";

const mockData = [
  { name: "Week 1", amount: 4500 },
  { name: "Week 2", amount: 3200 },
  { name: "Week 3", amount: 5100 },
  { name: "Week 4", amount: 2800 },
];

const expensesByCategory = [
  { name: "Food", value: 8500, color: "#00D4AA" },
  { name: "Transport", value: 3200, color: "#FFB800" },
  { name: "Bills", value: 4500, color: "#00C851" },
  { name: "Shopping", value: 2100, color: "#FF4444" },
];

export default function Dashboard() {
  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, Aditya! Here's your financial overview.</p>
          </div>
          <Link href="/expenses">
            <Button className="bg-primary text-black hover:bg-primary/90 font-semibold shadow-[0_0_15px_-3px_rgba(0,212,170,0.4)]">
              Add Expense
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border/50 hover:border-primary/30 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
              <Wallet className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white flex items-center">
                <IndianRupee className="w-5 h-5 mr-1" />
                42,500.00
              </div>
              <p className="text-xs text-success mt-1 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +12.5% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/50 hover:border-accent/30 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Savings</CardTitle>
              <Target className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white flex items-center">
                <IndianRupee className="w-5 h-5 mr-1" />
                15,200.00
              </div>
              <p className="text-xs text-success mt-1 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                On track for goal
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/50 hover:border-purple-500/30 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reward Points</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">2,450 XP</div>
              <p className="text-xs text-muted-foreground mt-1">
                Gold Tier Member
              </p>
              <div className="w-full bg-secondary/50 h-1.5 mt-3 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full w-[75%]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Monthly Spend Trend</CardTitle>
              <CardDescription>Expenses over the last 4 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockData}>
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
                      tickFormatter={(value) => `₹${value}`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
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
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Spend by Category</CardTitle>
              <CardDescription>Where your money goes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expensesByCategory} layout="vertical">
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
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Swiggy Order", date: "Today, 2:30 PM", amount: -450, category: "Food", icon: "🍔" },
                { title: "Uber Ride", date: "Yesterday, 6:15 PM", amount: -230, category: "Transport", icon: "🚕" },
                { title: "Salary Credited", date: "01 Dec, 10:00 AM", amount: 85000, category: "Income", icon: "💰", positive: true },
                { title: "Jio Fiber Bill", date: "30 Nov, 11:00 AM", amount: -999, category: "Bills", icon: "⚡" },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                      {tx.icon}
                    </div>
                    <div>
                      <p className="font-medium text-white">{tx.title}</p>
                      <p className="text-sm text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                  <div className={`font-medium flex items-center ${tx.positive ? 'text-success' : 'text-white'}`}>
                    <IndianRupee className="w-3 h-3 mr-0.5" />
                    {Math.abs(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
