// client/src/pages/SettingsPage.tsx

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient, MutationFunction } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bell, Shield, User, Smartphone, LogOut, Loader2, Target, Globe } from "lucide-react";
// Updated to use granular API functions
import { profile, settings, auth } from "@/lib/api";

interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

interface GoalUpdateData { 
    goalType: 'monthly_amount' | 'percentage_income';
    targetValue: string;
}

// --- HELPER FUNCTIONS ---

const getAvatarUrl = (userData: any): string => {
    const firstName = userData?.firstName;
    const username = userData?.username; 
    const seed = firstName || username || 'Default';
    
    if (seed === 'Default') {
        return 'https://github.com/shadcn.png'; 
    }
    return `https://api.dicebear.com/8.x/initials/svg?seed=${seed}&radius=50&chars=1`;
};

// Currency Symbol Helper (Consistent with other pages)
const getCurrencySymbol = (currencyCode: string | undefined) => {
    switch (currencyCode) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        default: return '₹';
    }
};

const changePasswordWrapper: MutationFunction<void, ChangePasswordData> = async (variables) => {
    await auth.changePassword(variables.currentPassword, variables.newPassword);
}

const deleteAccountWrapper: MutationFunction<void, string> = async (password) => {
    await auth.deleteAccount(password);
}

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // --- Profile Form State ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // --- Financial Goal State ---
  const [goalType, setGoalType] = useState<GoalUpdateData['goalType']>("monthly_amount"); 
  const [targetValue, setTargetValue] = useState(""); 
    
  // --- Change Password State ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  
  // --- Delete Account State ---
  const [confirmDeletePassword, setConfirmDeletePassword] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // --- Toggles State ---
  const [notifications, setNotifications] = useState({
    expense: false,
    weekly: false,
    rewards: false,
    biometric: false
  });

  // --- 1. MODULAR QUERIES (Parallel Loading) ---
  const { data: profileResponse, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-full"],
    queryFn: profile.get,
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: settings.get,
  });

  const currencySymbol = getCurrencySymbol(settingsData?.currency);

  // --- 2. LOGIC PRESERVATION: Effects to Load Data ---
  useEffect(() => {
    if (profileResponse?.user) {
        const user = profileResponse.user;
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
    }
    if (profileResponse?.profile) {
        setGoalType(profileResponse.profile.goalType || "monthly_amount");
        setTargetValue(profileResponse.profile.targetValue || "");
    }
  }, [profileResponse]);

  useEffect(() => {
    if (settingsData) {
      setNotifications({
        expense: settingsData.expenseAlerts || false,
        weekly: settingsData.weeklyReport || false,
        rewards: settingsData.rewardUpdates || false,
        biometric: settingsData.biometricLogin || false,
      });
    }
  }, [settingsData]);

  // --- 3. MUTATIONS (Preserved Functionality) ---
  
  const updateProfileMutation = useMutation({
    mutationFn: profile.updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-full"] });
      queryClient.invalidateQueries({ queryKey: ["profile-summary"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile/financial"] });
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });

      toast({ title: "Profile Updated", description: "Personal details saved successfully." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed to update profile", description: error.message });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: settings.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Settings Updated", description: "Your preferences have been saved." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed to update settings", description: error.message });
    },
  });
  
  const changePasswordMutation = useMutation<void, Error, ChangePasswordData>({
    mutationFn: changePasswordWrapper, 
    onSuccess: () => {
        setCurrentPassword("");
        setNewPassword("");
        setIsPasswordDialogOpen(false); 
        toast({ title: "Password Updated", description: "Password changed successfully." });
    },
    onError: (error: any) => {
        toast({ variant: "destructive", title: "Change Failed", description: error.message || "Invalid current password." });
    },
  });

  const deleteAccountMutation = useMutation<void, Error, string>({
    mutationFn: deleteAccountWrapper,
    onSuccess: () => {
        setIsDeleteDialogOpen(false); 
        toast({ variant: "destructive", title: "Account Deleted", description: "Your account has been removed." });
        setLocation("/auth"); 
    },
    onError: (error: any) => {
        toast({ variant: "destructive", title: "Deletion Failed", description: error.message || "Incorrect password." });
    },
  });

  const updateGoalMutation = useMutation<any, Error, GoalUpdateData>({
      mutationFn: (data) => profile.create(data), 
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["profile-full"] });
          toast({ title: "Goal Updated", description: "Your monthly savings goal has been set." });
      },
      onError: (error: Error) => {
          toast({ variant: "destructive", title: "Goal Update Failed", description: error.message });
      },
  });

  // --- HANDLERS ---
  
  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ firstName, lastName, email, phone });
  };
    
  const handleSaveGoal = () => {
    if (!targetValue || isNaN(Number(targetValue)) || Number(targetValue) <= 0) {
        toast({ variant: "destructive", title: "Invalid Target", description: "Enter a positive number." });
        return;
    }
    updateGoalMutation.mutate({ goalType, targetValue });
  };

  const handleToggleSetting = (key: string, value: boolean) => {
    const settingsMap: Record<string, string> = {
      expense: "expenseAlerts", weekly: "weeklyReport", rewards: "rewardUpdates", biometric: "biometricLogin",
    };
    updateSettingsMutation.mutate({ [settingsMap[key]]: value });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) return;
    if (currentPassword === newPassword) {
        toast({ variant: "destructive", title: "Invalid Password", description: "New password must be different." });
        return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };
  
  const handleConfirmDelete = () => {
    if (!confirmDeletePassword) return;
    deleteAccountMutation.mutate(confirmDeletePassword);
  };
  
  const handleLogout = async () => {
    try {
        await auth.logout();
        setLocation("/auth");
    } catch (e) {
        setLocation("/auth");
    }
  };

  const handleCurrencyChange = (val: string) => {
    updateSettingsMutation.mutate({ currency: val });
  }

  if (profileLoading || settingsLoading) {
      return (
          <div className="flex items-center justify-center h-screen">
              <Loader2 className="w-10 h-10 animate-spin text-[#00D4AA]" />
          </div>
      );
  }

  return (
      <div className="space-y-8 max-w-4xl mx-auto pb-10">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and app settings</p>
        </div>

        {/* Profile Information */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20 border-2 border-primary/20">
                <AvatarImage src={getAvatarUrl(profileResponse?.user)} /> 
                <AvatarFallback>
                    {profileResponse?.user?.firstName?.charAt(0) || ''}
                    {profileResponse?.user?.lastName?.charAt(0) || ''}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                  <p className="text-xl font-bold text-white">
                      {profileResponse?.user?.firstName} {profileResponse?.user?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">@{profileResponse?.user?.username}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-secondary/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-secondary/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-secondary/50 border-border" />
              </div>
            </div>
            <Button onClick={handleSaveProfile} className="bg-primary text-black hover:bg-primary/90 font-bold" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Financial Goal Setting Card - UPDATED: Dynamic Currency */}
        <Card className="bg-card border-border/50">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent" />
                    Monthly Savings Goal
                </CardTitle>
                <CardDescription>Define your monthly savings commitment for rewards and tier progression.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Goal Type</Label>
                    <Tabs value={goalType} onValueChange={(value) => setGoalType(value as GoalUpdateData['goalType'])} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-secondary/50 border-border">
                            <TabsTrigger value="monthly_amount">Fixed Amount ({currencySymbol})</TabsTrigger>
                            <TabsTrigger value="percentage_income">Percentage (%)</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="target-value">
                        {goalType === "monthly_amount" ? `Target Savings Amount (${currencySymbol})` : "Target Percentage (%)"}
                    </Label>
                    <Input id="target-value" type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="bg-secondary/50 border-border" placeholder={goalType === "monthly_amount" ? "e.g., 5000" : "e.g., 15"} />
                </div>
                
                <p className="text-xs text-muted-foreground pt-2">Determines your Monthly Savings Status and Tier Progression.</p>
                
                <Button onClick={handleSaveGoal} className="bg-accent text-black hover:bg-accent/90 font-bold" disabled={updateGoalMutation.isPending || !targetValue}>
                    {updateGoalMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Goal...</> : "Set Goal"}
                </Button>
            </CardContent>
        </Card>

        {/* Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5"><Label className="text-base">Expense Alerts</Label><p className="text-xs text-muted-foreground">Exceed budget alerts</p></div>
                <Switch checked={notifications.expense} onCheckedChange={(c) => handleToggleSetting('expense', c)} disabled={updateSettingsMutation.isPending} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5"><Label className="text-base">Weekly Report</Label><p className="text-xs text-muted-foreground">Spending summary</p></div>
                <Switch checked={notifications.weekly} onCheckedChange={(c) => handleToggleSetting('weekly', c)} disabled={updateSettingsMutation.isPending} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5"><Label className="text-base">Reward Updates</Label><p className="text-xs text-muted-foreground">Earned point updates</p></div>
                <Switch checked={notifications.rewards} onCheckedChange={(c) => handleToggleSetting('rewards', c)} disabled={updateSettingsMutation.isPending} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" /> App Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5"><Label className="text-base">Dark Mode</Label><p className="text-xs text-muted-foreground">Application theme</p></div>
                <Switch defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5"><Label className="text-base">Biometric Login</Label><p className="text-xs text-muted-foreground">Use FaceID/TouchID</p></div>
                <Switch checked={notifications.biometric} onCheckedChange={(c) => handleToggleSetting('biometric', c)} disabled={updateSettingsMutation.isPending} />
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 mb-2"><Globe className="w-4 h-4 text-muted-foreground" /><Label className="text-base">Currency Display</Label></div>
                <Select onValueChange={handleCurrencyChange} defaultValue={settingsData?.currency || "INR"}>
                    <SelectTrigger className="bg-secondary/50 border-border"><SelectValue placeholder="Select Currency" /></SelectTrigger>
                    <SelectContent className="bg-card border-border text-white">
                        <SelectItem value="INR">INR (₹)</SelectItem><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="EUR">EUR (€)</SelectItem><SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security & Danger Zone (Fully Preserved) */}
        <Card className="bg-card border-border/50">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Shield className="w-5 h-5 text-red-400" /> Security & Danger Zone</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-secondary/20">
              <div><p className="font-medium text-white">Change Password</p><p className="text-sm text-muted-foreground">Update password</p></div>
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild><Button variant="outline" className="border-border hover:bg-white/5" disabled={changePasswordMutation.isPending}>Update</Button></DialogTrigger>
                <DialogContent className="bg-card border-border text-white">
                  <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="bg-secondary border-border" /></div>
                    <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-secondary border-border" /></div>
                  </div>
                  <DialogFooter><Button onClick={handleChangePassword} className="bg-primary text-black font-bold" disabled={changePasswordMutation.isPending}>{changePasswordMutation.isPending ? "Updating..." : "Update Password"}</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-red-900/30 rounded-lg bg-red-900/10">
              <div><p className="font-medium text-red-400">Delete Account</p><p className="text-sm text-red-400/70">Remove data</p></div>
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild><Button variant="destructive" className="bg-red-600 font-bold" disabled={deleteAccountMutation.isPending}>Delete</Button></DialogTrigger>
                <DialogContent className="bg-card border-border text-white">
                  <DialogHeader><DialogTitle>Confirm Delete?</DialogTitle></DialogHeader>
                  <div className="space-y-2 py-4"><Label>Enter Password</Label><Input type="password" value={confirmDeletePassword} onChange={(e) => setConfirmDeletePassword(e.target.value)} className="bg-secondary border-border" /></div>
                  <DialogFooter><Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteAccountMutation.isPending} className="font-bold">{deleteAccountMutation.isPending ? "Deleting..." : "Confirm Delete"}</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-center pt-4">
          <Button variant="ghost" className="text-muted-foreground hover:text-destructive gap-2 hover:bg-destructive/10" onClick={handleLogout}><LogOut className="w-4 h-4" /> Log Out</Button>
        </div>
      </div>
  );
}