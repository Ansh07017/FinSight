// client/src/pages/settings.tsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Loader2, Bell, Shield, User as UserIcon, LogOut, 
  Trash2, Lock, Smartphone, Globe, Target, Mail, Phone, Smartphone as MobileIcon 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import { auth, settings, profile } from "@/lib/api";
import { useAuth } from "@/components/AuthContext";

// --- VALIDATION SCHEMAS ---
const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Helper for Avatar
const getAvatarUrl = (userData: any): string => {
    const seed = userData?.firstName || userData?.email || 'Default';
    return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&radius=50&backgroundColor=00d4aa`;
};

const getCurrencySymbol = (code?: string) => {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
    return symbols[code || 'INR'] || '₹';
};

export default function SettingsPage() {
  const { user, logout } = useAuth(); 
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [goalType, setGoalType] = useState<"monthly_amount" | "percentage_income">("monthly_amount");
  const [targetValue, setTargetValue] = useState("");

  // 1. FETCH DATA
  const { data: userSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: settings.get,
  });

  const { data: profileResponse, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-full"],
    queryFn: profile.get,
  });

  // Sync state when data loads
  if (profileResponse?.user && !firstName) {
      setFirstName(profileResponse.user.firstName || "");
      setLastName(profileResponse.user.lastName || "");
      setEmail(profileResponse.user.email || "");
      setPhone(profileResponse.user.phone || "");
  }
  if (profileResponse?.profile && !targetValue) {
      setGoalType(profileResponse.profile.goalType || "monthly_amount");
      setTargetValue(profileResponse.profile.targetValue || "");
  }

  // 2. MUTATIONS
  const updateSettingsMutation = useMutation({
    mutationFn: settings.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message })
  });

  const updateProfileMutation = useMutation({
    mutationFn: profile.updateUser,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["profile-full"] });
        toast({ title: "Saved", description: "Profile updated successfully." });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message })
  });

  const updateGoalMutation = useMutation({
    mutationFn: (data: any) => profile.create(data),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["profile-full"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        toast({ title: "Goal Set", description: "Your savings target is updated." });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message })
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: z.infer<typeof passwordSchema>) => 
      auth.changePassword(data.currentPassword || "", data.newPassword),
    onSuccess: () => {
      toast({ title: "Success", description: "Password updated successfully." });
      passwordForm.reset();
      window.location.reload(); 
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: auth.deleteAccount,
    onSuccess: () => {
      logout();
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
    },
  });

  // 3. FORMS & HANDLERS
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const handleSaveProfile = () => updateProfileMutation.mutate({ firstName, lastName, email, phone });
  
  const handleSaveGoal = () => {
    if (!targetValue || isNaN(Number(targetValue))) return toast({ variant: "destructive", title: "Invalid Goal" });
    updateGoalMutation.mutate({ goalType, targetValue });
  };

  const currencySymbol = getCurrencySymbol(userSettings?.currency);
  const hasPassword = user?.hasPassword;

  if (settingsLoading || profileLoading) return <div className="flex justify-center h-[80vh] items-center"><Loader2 className="animate-spin text-[#00D4AA] w-10 h-10" /></div>;

  return (
    <div className="space-y-8 pb-10 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences.</p>
        </div>
        <Button variant="ghost" className="text-red-400 hover:text-red-500 hover:bg-red-500/10 gap-2" onClick={() => { auth.logout(); window.location.href="/auth"; }}>
            <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: IDENTITY & GOALS */}
        <div className="space-y-8">
          
          {/* Profile Card */}
          <Card className="bg-card border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <UserIcon className="w-5 h-5 text-[#00D4AA]" /> Personal Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex items-center gap-5 p-4 bg-secondary/20 rounded-xl border border-border/50">
                    <Avatar className="w-16 h-16 border-2 border-[#00D4AA]/20">
                        <AvatarImage src={getAvatarUrl(profileResponse?.user)} />
                        <AvatarFallback>User</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-lg font-bold text-white">
                            {firstName || "User"} {lastName}
                        </p>
                        <p className="text-sm text-muted-foreground break-all">{email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="bg-secondary/50 border-border" />
                    </div>
                    <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input value={lastName} onChange={e => setLastName(e.target.value)} className="bg-secondary/50 border-border" />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Mail className="w-3 h-3" /> Email</Label>
                    <Input value={email} onChange={e => setEmail(e.target.value)} className="bg-secondary/50 border-border" />
                </div>
                
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Phone className="w-3 h-3" /> Phone</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-secondary/50 border-border" />
                </div>

                <Button onClick={handleSaveProfile} className="w-full bg-[#00D4AA] text-black hover:bg-[#00D4AA]/90 font-bold" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Profile"}
                </Button>
            </CardContent>
          </Card>

          {/* Goal Card */}
          <Card className="bg-card border-border/50 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="w-5 h-5 text-blue-500" /> Savings Goal
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <Tabs value={goalType} onValueChange={(v) => setGoalType(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-secondary/50 border border-border/50">
                        <TabsTrigger value="monthly_amount">Fixed Amount</TabsTrigger>
                        <TabsTrigger value="percentage_income">% of Income</TabsTrigger>
                    </TabsList>
                </Tabs>
                
                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
                        Target {goalType === 'monthly_amount' ? `Value (${currencySymbol})` : 'Percentage (%)'}
                    </Label>
                    <div className="relative">
                        <Input 
                            type="number" 
                            value={targetValue} 
                            onChange={e => setTargetValue(e.target.value)} 
                            className="bg-secondary/50 border-border pl-10 text-lg font-mono" 
                            placeholder={goalType === "monthly_amount" ? "5000" : "20"} 
                        />
                        <div className="absolute left-3 top-2.5 text-muted-foreground font-bold">
                            {goalType === 'monthly_amount' ? currencySymbol : '%'}
                        </div>
                    </div>
                </div>

                <Button onClick={handleSaveGoal} variant="outline" className="w-full border-blue-500/30 hover:bg-blue-500/10 text-blue-400" disabled={updateGoalMutation.isPending}>
                    {updateGoalMutation.isPending ? "Updating..." : "Update Goal"}
                </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: PREFERENCES & SECURITY */}
        <div className="space-y-8">
          
          {/* Preferences Card */}
          <Card className="bg-card border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Smartphone className="w-5 h-5 text-purple-500" /> Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Currency */}
              <div className="space-y-3 pb-4 border-b border-border/30">
                  <Label className="flex items-center gap-2"><Globe className="w-4 h-4" /> Currency Unit</Label>
                  <Select onValueChange={(v) => updateSettingsMutation.mutate({ currency: v })} defaultValue={userSettings?.currency || "INR"}>
                      <SelectTrigger className="bg-secondary/50 border-border">
                          <SelectValue placeholder="Select Currency" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-white">
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                  </Select>
              </div>

              {/* Toggles */}
              <div className="space-y-5">
                  {/* EXPENSE ALERTS (COMING SOON) */}
                  <div className="flex items-center justify-between opacity-60">
                      <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                             <Label className="text-base flex items-center gap-2"><Bell className="w-4 h-4" /> Expense Alerts</Label>
                             <Badge variant="outline" className="text-[10px] h-5 border-yellow-500/50 text-yellow-500 gap-1 px-1.5">
                                Coming Soon
                             </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Smart notifications for budget limits</p>
                      </div>
                      <Switch checked={false} disabled={true} />
                  </div>
                  
                  {/* WEEKLY REPORT REMOVED (Redundant) */}

                  {/* BIOMETRIC LOGIN (APP ONLY) */}
                  <div className="flex items-center justify-between opacity-60">
                      <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                             <Label className="text-base flex items-center gap-2"><Shield className="w-4 h-4" /> Biometric Login</Label>
                             <Badge variant="outline" className="text-[10px] h-5 border-blue-500/50 text-blue-400 gap-1 px-1.5">
                                <MobileIcon className="w-3 h-3" /> App Only
                             </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Enable FaceID/TouchID</p>
                      </div>
                      <Switch checked={false} disabled={true} />
                  </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Card (Password & Deletion) */}
          <Card className="bg-card border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Shield className="w-5 h-5 text-yellow-500" /> 
                {hasPassword ? "Change Password" : "Create Password"}
              </CardTitle>
              <CardDescription>
                {hasPassword 
                  ? "Update your existing password." 
                  : "Create a password to enable account deletion."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit((d) => changePasswordMutation.mutate(d))} className="space-y-4">
                
                {hasPassword && (
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input type="password" {...passwordForm.register("currentPassword")} className="bg-secondary/20 border-border" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" {...passwordForm.register("newPassword")} className="bg-secondary/20 border-border" />
                  {passwordForm.formState.errors.newPassword && <p className="text-xs text-red-400">{passwordForm.formState.errors.newPassword.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input type="password" {...passwordForm.register("confirmPassword")} className="bg-secondary/20 border-border" />
                  {passwordForm.formState.errors.confirmPassword && <p className="text-xs text-red-400">{passwordForm.formState.errors.confirmPassword.message}</p>}
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={changePasswordMutation.isPending} className="bg-primary text-black font-bold">
                    {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {hasPassword ? "Update Password" : "Create Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-900/30 bg-red-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-red-500">
                <Trash2 className="w-5 h-5" /> Delete Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasPassword ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-sm">
                  <Lock className="w-8 h-8 opacity-80" />
                  <div>
                    <p className="font-bold">Deletion Locked</p>
                    <p className="text-xs opacity-80">You must create a password above before you can delete your account.</p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Permanently remove your data.</p>
                  <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">Delete Account</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>This will permanently delete your account data.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Label>Enter your password to confirm</Label>
                        <Input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => deleteAccountMutation.mutate(deletePassword)} disabled={!deletePassword || deleteAccountMutation.isPending}>
                          {deleteAccountMutation.isPending ? "Deleting..." : "Confirm Deletion"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}