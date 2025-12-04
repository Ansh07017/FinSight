import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { IndianRupee, Plus, Search, Filter, ArrowUpRight, ArrowDownRight, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { transactions } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("expense");
  
  // Form state
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMode, setPaymentMode] = useState("");

  const { data: transactionList = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: transactions.list,
  });

  const createMutation = useMutation({
    mutationFn: transactions.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Transaction added",
        description: "Your transaction has been recorded successfully.",
      });
      setIsDialogOpen(false);
      setAmount("");
      setDescription("");
      setCategory("");
      setPaymentMode("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to add transaction",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: transactions.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Transaction deleted",
        description: "The transaction has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete transaction",
        description: error.message,
      });
    },
  });

  const handleAddTransaction = () => {
    if (!amount || !description || !category || !paymentMode) return;

    createMutation.mutate({
      title: description,
      category,
      amount: parseFloat(amount),
      date: format(new Date(), "yyyy-MM-dd"),
      payment: paymentMode,
      type: activeTab
    });
  };

  const handleDeleteTransaction = (id: string) => {
    deleteMutation.mutate(id);
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
                            <SelectItem value="Papa">Papa (Family)</SelectItem>
                            <SelectItem value="Freelance">Freelance</SelectItem>
                            <SelectItem value="Pocket Money">Pocket Money</SelectItem>
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
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      `Save ${activeTab === "expense" ? "Expense" : "Income"}`
                    )}
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

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : transactionList.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                No transactions yet. Add your first transaction to get started!
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 text-sm font-medium text-muted-foreground px-4 py-2">
                  <div className="col-span-5 md:col-span-4">Description</div>
                  <div className="col-span-3 md:col-span-2">Category</div>
                  <div className="hidden md:block col-span-2">Date</div>
                  <div className="hidden md:block col-span-1">Mode</div>
                  <div className="col-span-4 md:col-span-2 text-right">Amount</div>
                  <div className="hidden md:block col-span-1"></div>
                </div>
                
                {transactionList.map((tx: any) => (
                  <div key={tx.id} className="grid grid-cols-12 items-center p-4 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors border border-transparent hover:border-primary/20">
                    <div className="col-span-5 md:col-span-4 font-medium text-white truncate pr-2 flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${tx.type === 'income' ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-500'}`}>
                        {tx.type === 'income' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      </div>
                      {tx.title}
                    </div>
                    <div className="col-span-3 md:col-span-2">
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
                    <div className="hidden md:flex col-span-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleDeleteTransaction(tx.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
