import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IndianRupee, Plus, Search, Filter } from "lucide-react";

const expenses = [
  { id: 1, title: "Grocery - BigBasket", category: "Food", amount: 2400, date: "2023-12-04", payment: "UPI" },
  { id: 2, title: "Netflix Subscription", category: "Entertainment", amount: 649, date: "2023-12-03", payment: "Credit Card" },
  { id: 3, title: "Petrol", category: "Transport", amount: 1200, date: "2023-12-02", payment: "Cash" },
  { id: 4, title: "Team Lunch", category: "Food", amount: 850, date: "2023-12-01", payment: "UPI" },
  { id: 5, title: "Electricity Bill", category: "Bills", amount: 1450, date: "2023-11-28", payment: "UPI" },
  { id: 6, title: "Shopping - Myntra", category: "Shopping", amount: 3200, date: "2023-11-25", payment: "Credit Card" },
];

export default function ExpensesPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Expenses</h1>
            <p className="text-muted-foreground">Track and manage your daily spending</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary text-black hover:bg-primary/90 font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Add New Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-white">
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="0.00" className="pl-10 bg-secondary border-border" type="number" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input placeholder="What did you buy?" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="food">Food & Dining</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                      <SelectItem value="bills">Bills & Utilities</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-primary text-black hover:bg-primary/90 mt-4">
                  Save Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search expenses..." className="pl-9 bg-secondary/50 border-border" />
              </div>
              <Button variant="outline" className="border-border text-muted-foreground hover:text-white hover:bg-secondary">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 text-sm font-medium text-muted-foreground px-4 py-2">
                <div className="col-span-5 md:col-span-4">Description</div>
                <div className="col-span-3 md:col-span-3">Category</div>
                <div className="hidden md:block col-span-2">Date</div>
                <div className="hidden md:block col-span-1">Mode</div>
                <div className="col-span-4 md:col-span-2 text-right">Amount</div>
              </div>
              
              {expenses.map((expense) => (
                <div key={expense.id} className="grid grid-cols-12 items-center p-4 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors border border-transparent hover:border-primary/20">
                  <div className="col-span-5 md:col-span-4 font-medium text-white truncate pr-2">
                    {expense.title}
                  </div>
                  <div className="col-span-3 md:col-span-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {expense.category}
                    </span>
                  </div>
                  <div className="hidden md:block col-span-2 text-sm text-muted-foreground">
                    {expense.date}
                  </div>
                  <div className="hidden md:block col-span-1 text-sm text-muted-foreground">
                    {expense.payment}
                  </div>
                  <div className="col-span-4 md:col-span-2 text-right font-semibold text-white flex justify-end items-center">
                    <IndianRupee className="w-3 h-3 mr-0.5" />
                    {expense.amount}
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
