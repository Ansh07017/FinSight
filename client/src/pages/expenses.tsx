import { useState } from "react";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { IndianRupee, Plus, Search, Filter, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";

// Initial mock data
const initialTransactions = [
  { id: 1, title: "Grocery - BigBasket", category: "Food", amount: 2400, date: "2023-12-04", payment: "UPI", type: "expense" },
  { id: 2, title: "Netflix Subscription", category: "Entertainment", amount: 649, date: "2023-12-03", payment: "Credit Card", type: "expense" },
  { id: 3, title: "Petrol", category: "Transport", amount: 1200, date: "2023-12-02", payment: "Cash", type: "expense" },
  { id: 4, title: "Team Lunch", category: "Food", amount: 850, date: "2023-12-01", payment: "UPI", type: "expense" },
  { id: 5, title: "Electricity Bill", category: "Bills", amount: 1450, date: "2023-11-28", payment: "UPI", type: "expense" },
  { id: 6, title: "Shopping - Myntra", category: "Shopping", amount: 3200, date: "2023-11-25", payment: "Credit Card", type: "expense" },
  { id: 7, title: "Salary Credited", category: "Salary", amount: 85000, date: "2023-12-01", payment: "Bank Transfer", type: "income" },
  { id: 8, title: "Freelance Project", category: "Freelance", amount: 15000, date: "2023-11-20", payment: "UPI", type: "income" },
];

export default function ExpensesPage() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("expense");
  
  // Form state
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMode, setPaymentMode] = useState("");

  const handleAddTransaction = () => {
    if (!amount || !description || !category || !paymentMode) return;

    const newTransaction = {
      id: transactions.length + 1,
      title: description,
      category,
      amount: parseFloat(amount),
      date: format(new Date(), "yyyy-MM-dd"),
      payment: paymentMode,
      type: activeTab
    };

    setTransactions([newTransaction, ...transactions]);
    setIsDialogOpen(false);
    
    // Reset form
    setAmount("");
    setDescription("");
    setCategory("");
    setPaymentMode("");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Transactions</h1>
            <p className="text-muted-foreground">Track and manage your income and expenses</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-black hover:bg-primary/90 font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-white sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="expense" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
                  <TabsTrigger value="expense">Expense</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                </TabsList>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input 
                        placeholder="0.00" 
                        className="pl-10 bg-secondary border-border" 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input 
                      placeholder={activeTab === "expense" ? "What did you buy?" : "Source of income?"}
                      className="bg-secondary border-border" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {activeTab === "expense" ? (
                          <>
                            <SelectItem value="Food">Food & Dining</SelectItem>
                            <SelectItem value="Transport">Transport</SelectItem>
                            <SelectItem value="Shopping">Shopping</SelectItem>
                            <SelectItem value="Bills">Bills & Utilities</SelectItem>
                            <SelectItem value="Entertainment">Entertainment</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="Salary">Salary</SelectItem>
                            <SelectItem value="Freelance">Freelance</SelectItem>
                            <SelectItem value="Investment">Investment</SelectItem>
                            <SelectItem value="Gift">Gift</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="Debit Card">Debit Card</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    className="w-full bg-primary text-black hover:bg-primary/90 mt-4"
                    onClick={handleAddTransaction}
                  >
                    Save {activeTab === "expense" ? "Expense" : "Income"}
                  </Button>
                </div>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search transactions..." className="pl-9 bg-secondary/50 border-border" />
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
              
              {transactions.map((tx) => (
                <div key={tx.id} className="grid grid-cols-12 items-center p-4 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors border border-transparent hover:border-primary/20">
                  <div className="col-span-5 md:col-span-4 font-medium text-white truncate pr-2 flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${tx.type === 'income' ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-500'}`}>
                      {tx.type === 'income' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    </div>
                    {tx.title}
                  </div>
                  <div className="col-span-3 md:col-span-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tx.type === 'income' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                    }`}>
                      {tx.category}
                    </span>
                  </div>
                  <div className="hidden md:block col-span-2 text-sm text-muted-foreground">
                    {tx.date}
                  </div>
                  <div className="hidden md:block col-span-1 text-sm text-muted-foreground">
                    {tx.payment}
                  </div>
                  <div className={`col-span-4 md:col-span-2 text-right font-semibold flex justify-end items-center ${
                    tx.type === 'income' ? 'text-success' : 'text-white'
                  }`}>
                    <IndianRupee className="w-3 h-3 mr-0.5" />
                    {tx.amount.toLocaleString()}
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
