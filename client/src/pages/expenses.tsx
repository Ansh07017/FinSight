// client/src/pages/ExpensesPage.tsx

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, Loader2, Trash2, Calendar as CalendarIcon } from "lucide-react";
// Updated to use granular API functions defined in refactored api.ts
import { transactions, settings } from "@/lib/api"; 
import { useToast } from "@/hooks/use-toast";

// --- NEW: Currency Symbol Helper ---
const getCurrencySymbol = (currencyCode: string | undefined) => {
    switch (currencyCode) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        default: return '₹';
    }
};

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("expense");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setdate] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMode, setPaymentMode] = useState("");

  // 1. Fetch Transactions (Granular API)
  const { data: transactionList = [], isLoading: txLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: transactions.list,
  });

  // 2. Fetch Settings for Currency Sync
  const { data: userSettings } = useQuery({
    queryKey: ["settings"],
    queryFn: settings.get,
  });

  const currencySymbol = getCurrencySymbol(userSettings?.currency);

  const filteredTransactions = useMemo(() => {
    return (Array.isArray(transactionList) ? transactionList : [])
      .filter((tx: any) => {
        const title = tx.title || "";
        const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === "all" || tx.category === filterCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a: any, b: any) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
      });
  }, [transactionList, searchQuery, filterCategory]);

  const createMutation = useMutation({
    mutationFn: transactions.create,
    onSuccess: () => {
      // Invalidate specific granular queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-trend"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile/financial"] });
      queryClient.invalidateQueries({ queryKey: ["transactions-recent"] }); // Dashboard list
      queryClient.invalidateQueries({ queryKey: ["profile-full"] }); // Dashboard Balance & Tier
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });

      
      toast({ title: "Transaction added", description: "Successfully recorded." });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    },
  });

  // Add this mutation in ExpensesPage.tsx
const deleteMutation = useMutation({
  mutationFn: transactions.delete,
  onSuccess: () => {
    // Refresh all financial data so the Leaderboard and Dashboard update
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-trend"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-categories"] });
    queryClient.invalidateQueries({ queryKey: ["transactions-recent"] });
    queryClient.invalidateQueries({ queryKey: ["profile-full"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });

    toast({ 
      title: "Transaction deleted", 
      description: "Your balance and leaderboard rank have been updated." 
    });
  },
  onError: (error: Error) => {
    toast({ variant: "destructive", title: "Deletion failed", description: error.message });
  },
});

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setdate("");
    setCategory("");
    setPaymentMode("");
  };

  const handleAddTransaction = () => {
    if (!amount || !description || !category || !paymentMode) {
        toast({ variant: "destructive", title: "Missing fields" });
        return;
    }

    // FIX: ISO String issue - Ensure date is handled robustly
    let finalDate: Date;
    if (date) {
        const [year, month, day] = date.split('-').map(Number);
        // month is 0-indexed in JS Date constructor
        finalDate = new Date(year, month - 1, day);
    } else {
        finalDate = new Date();
    }

    if (isNaN(finalDate.getTime())) {
      toast({ variant: "destructive", title: "Invalid Date", description: "Please enter a valid date." });
      return;
    }

    createMutation.mutate({
      title: description,
      category,
      amount: amount, 
      date: finalDate.toISOString(), 
      paymentMode: paymentMode, 
      type: activeTab
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Manage your flow in {userSettings?.currency || "INR"}</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#00D4AA] text-black hover:bg-[#00D4AA]/90 font-black shadow-lg shadow-[#00D4AA]/10">
              <Plus className="w-5 h-5 mr-2" /> Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-white sm:max-w-106.25">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">New Entry</DialogTitle>
              <DialogDescription>Input your financial activity below.</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="expense" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-1 border border-border/50">
                <TabsTrigger value="expense" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">Expense</TabsTrigger>
                <TabsTrigger value="income" className="data-[state=active]:bg-[#00D4AA] data-[state=active]:text-black">Income</TabsTrigger>
              </TabsList>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Amount ({userSettings?.currency || "INR"})</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground font-mono">{currencySymbol}</span>
                    <Input 
                      placeholder="0.00" 
                      className="pl-8 bg-secondary/50 border-border focus:ring-[#00D4AA]" 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Description</Label>
                  <Input 
                    placeholder={activeTab === "expense" ? "e.g. Starbucks Coffee" : "e.g. Monthly Salary"}
                    className="bg-secondary/50 border-border" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Date</Label>
                  <Input type="date" className="bg-secondary/50 border-border" value={date} onChange={(e) => setdate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-secondary/50 border-border"><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent className="bg-card border-border text-white">
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
                          <SelectItem value="Investments">Investments</SelectItem>
                          <SelectItem value="Other">Other Income</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger className="bg-secondary/50 border-border"><SelectValue placeholder="Select Mode" /></SelectTrigger>
                    <SelectContent className="bg-card border-border text-white">
                      <SelectItem value="UPI">UPI / Digital</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Credit/Debit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                    className={`w-full font-black mt-4 py-6 transition-all ${activeTab === 'expense' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-black'}`} 
                    onClick={handleAddTransaction} 
                    disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : "Confirm Transaction"}
                </Button>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border/50 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-4 p-6 bg-secondary/10 border-b border-border/50">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search records..." className="pl-9 bg-secondary/50 border-border" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-55 bg-secondary/50 border-border">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category Filter" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-white">
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel className="text-[#00D4AA]">Income</SelectLabel>
                  <SelectItem value="Salary">Salary</SelectItem>
                  <SelectItem value="Freelance">Freelance</SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel className="text-red-400">Expense</SelectLabel>
                  <SelectItem value="Food">Food & Dining</SelectItem>
                  <SelectItem value="Shopping">Shopping</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Bills">Bills & Utilities</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

<div className="divide-y divide-border/20">
  {txLoading ? (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-[#00D4AA]" />
      <p className="text-muted-foreground animate-pulse">Syncing Ledger...</p>
    </div>
  ) : filteredTransactions.length > 0 ? (
    filteredTransactions.map((tx: any) => (
      <div key={tx.id} className="grid grid-cols-12 items-center p-5 hover:bg-[#00D4AA]/5 transition-all group border-l-4 border-transparent hover:border-[#00D4AA]">
        
        {/* 1. Title & Category (Left) */}
        <div className="col-span-6 md:col-span-4 font-bold text-white flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {tx.type === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
          </div>
          <div className="flex flex-col">
            <span className="text-sm md:text-base leading-tight">{tx.title}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-1">{tx.category}</span>
          </div>
        </div>

        {/* 2. Date (Visible on Medium screens+) */}
        <div className="hidden md:flex col-span-3 items-center gap-2 text-xs text-muted-foreground font-medium">
          <CalendarIcon className="w-3 h-3" />
          {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>

        {/* 3. Amount (Right Aligned) */}
        <div className={`col-span-4 md:col-span-3 text-right font-mono font-black text-base md:text-lg ${tx.type === 'income' ? 'text-[#00D4AA]' : 'text-white'}`}>
          <span className="text-xs mr-1 opacity-70 font-sans">{currencySymbol}</span>
          {parseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>

        {/* 4. Delete Action (Far Right) */}
        <div className="col-span-2 md:col-span-2 flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-white">
              <DialogHeader>
                <DialogTitle>Delete Transaction?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{tx.title}"? This will revert the {currencySymbol}{tx.amount} change to your balance.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" className="border-border" onClick={() => {}}>Cancel</Button>
                <Button 
                  variant="destructive" 
                  onClick={() => deleteMutation.mutate(tx.id)}
                  disabled={deleteMutation.isPending}
                  className="font-bold"
                >
                  {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Delete"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    ))
  ) : (
    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground italic gap-4">
      <Search className="w-12 h-12 opacity-10" />
      <p>No transactions found matching your criteria.</p>
    </div>
  )}
</div>
        </CardContent>
      </Card>
    </div>
  );
}