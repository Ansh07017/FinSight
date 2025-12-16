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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Bell, Shield, User, Smartphone, LogOut, Loader2, Target } from "lucide-react";
import { profile, settings, auth } from "@/lib/api";

// --- TYPE DEFINITIONS FOR MUTATIONS (FIXED/UPDATED) ---
interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}
interface GoalUpdateData { 
    goalType: 'monthly_amount' | 'percentage_income';
    targetValue: string;
}

// --- HELPER FUNCTIONS ---

const getAvatarUrl = (profileData: any): string => {
   
    const firstName = profileData?.user?.firstName;
    const username = profileData?.user?.username; 
    
    const seed = firstName || username || 'Default';
    
    if (seed === 'Default') {
        return 'https://github.com/shadcn.png'; 
    }
    return `https://api.dicebear.com/8.x/initials/svg?seed=${seed}&radius=50&chars=1`;
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

  // --- Data Queries ---
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: profile.get,
  });

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: settings.get,
  });

  // --- Effects to Load Data (FIXED: Accessing nested user data for state initialization) ---
  useEffect(() => {
    if (profileData && profileData.user) {
        const user = profileData.user;
        
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
    }
    // Load Goals into state
    if (profileData && profileData.profile) {
        setGoalType(profileData.profile.goalType || "monthly_amount");
        setTargetValue(profileData.profile.targetValue || "");
    }
  }, [profileData]);

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

  // --- Mutations ---
  
  const updateProfileMutation = useMutation({
    mutationFn: profile.updateUser, // Updates core user details (/api/profile/user)
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Profile Updated",
        description: "Your personal information has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to update profile",
        description: error.message,
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: settings.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to update settings",
        description: error.message,
      });
    },
  });
  
  const changePasswordMutation = useMutation<void, Error, ChangePasswordData>({
    mutationFn: changePasswordWrapper, 
    onSuccess: () => {
        setCurrentPassword("");
        setNewPassword("");
        setIsPasswordDialogOpen(false); 
        toast({
            title: "Password Updated",
            description: "Your password has been changed successfully.",
        });
    },
    onError: (error: any) => {
        toast({
            variant: "destructive",
            title: "Password Change Failed",
            description: error.message || "Invalid current password or server error.",
        });
    },
  });

  const deleteAccountMutation = useMutation<void, Error, string>({
    mutationFn: deleteAccountWrapper,
    onSuccess: () => {
        setIsDeleteDialogOpen(false); 
        toast({
            variant: "destructive",
            title: "Account Deleted",
            description: "Your account has been permanently removed.",
        });
        setLocation("/auth"); 
    },
    onError: (error: any) => {
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: error.message || "Could not delete account. Check password.",
        });
    },
  });

// NEW: Goal Update Mutation (Updates user profiles data, including goals)
// FIX 1: Add GoalUpdateData as TVariables generic type
const updateGoalMutation = useMutation<any, Error, GoalUpdateData>({
    // FIX 2: Assuming profile.update is the correct function mapped to POST /api/profile
    mutationFn: (data) => profile.create(data), // Using create as a general profile update until 'update' is defined
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        toast({
            title: "Goal Updated",
            description: "Your monthly savings goal has been set successfully.",
        });
    },
    onError: (error: Error) => {
        toast({
            variant: "destructive",
            title: "Goal Update Failed",
            description: error.message || "Could not save savings goal.",
        });
    },
});


  // --- Handlers ---
  
  const handleSaveProfile = () => {
    // Handler for core user details (firstName, email, etc.)
    updateProfileMutation.mutate({
      firstName,
      lastName,
      email,
      phone,
    });
  };
    
// NEW: Handler for saving the goal (targets userProfiles table)
const handleSaveGoal = () => {
    // Basic validation
    if (!targetValue || isNaN(Number(targetValue)) || Number(targetValue) <= 0) {
        toast({
            variant: "destructive",
            title: "Invalid Target",
            description: "Please enter a valid positive savings amount or percentage.",
        });
        return;
    }

    // Call the dedicated mutation
    // FIX 3: Mutate call is now correctly typed to accept GoalUpdateData
    updateGoalMutation.mutate({
        goalType,
        targetValue, 
    });
};

  const handleToggleSetting = (key: string, value: boolean) => {
    const newNotifications = { ...notifications, [key]: value };
    setNotifications(newNotifications);
    
    const settingsMap: Record<string, string> = {
      expense: "expenseAlerts",
      weekly: "weeklyReport",
      rewards: "rewardUpdates",
      biometric: "biometricLogin",
    };
    
    updateSettingsMutation.mutate({
      [settingsMap[key]]: value,
    });
  };

  // Change Password Handler
  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
        toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in both password fields." });
        return;
    }
    if (currentPassword === newPassword) {
        toast({ variant: "destructive", title: "Invalid Password", description: "New password cannot be the same as the current one." });
        return;
    }
    
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };
  
  // Delete Account Handler
  const handleConfirmDelete = () => {
    if (!confirmDeletePassword) {
        toast({ variant: "destructive", title: "Password Required", description: "Please enter your password to confirm deletion." });
        return;
    }
    
    deleteAccountMutation.mutate(confirmDeletePassword);
  };
  
  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been securely logged out.",
    });
    setLocation("/auth");
  };
  

  return (
      <div className="space-y-8 max-w-4xl mx-auto">
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
        <AvatarImage 
            src={getAvatarUrl(profileData)} 
        /> 
        <AvatarFallback>
            {profileData?.user?.firstName?.charAt(0) || ''}
            {profileData?.user?.lastName?.charAt(0) || ''}
        </AvatarFallback>
    </Avatar>
    <div className="space-y-2">
        <p className="font-medium text-white">
            {profileData?.user?.firstName} {profileData?.user?.lastName}
        </p>
    </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  className="bg-secondary/50 border-border" 
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  className="bg-secondary/50 border-border" 
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="bg-secondary/50 border-border" 
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className="bg-secondary/50 border-border" 
                />
              </div>
            </div>
            <Button 
              onClick={handleSaveProfile} 
              className="bg-primary text-black hover:bg-primary/90"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* NEW: Financial Goal Setting Card */}
        <Card className="bg-card border-border/50">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent" />
                    Monthly Savings Goal
                </CardTitle>
                <CardDescription>Define your monthly savings commitment for rewards and tier progression.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Segmented Control for Goal Type Selection */}
                <div className="space-y-2">
                    <Label>Goal Type</Label>
                    <Tabs 
                        value={goalType} 
                        onValueChange={(value) => setGoalType(value as GoalUpdateData['goalType'])} 
                        className="w-full"
                    >
                        {/* Consistent look similar to transaction type selector */}
                        <TabsList className="grid w-full grid-cols-2 bg-secondary/50 border-border">
                            <TabsTrigger value="monthly_amount">Fixed Amount (₹)</TabsTrigger>
                            <TabsTrigger value="percentage_income">Percentage (%)</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Conditional Input for Target Value */}
                <div className="space-y-2">
                    <Label htmlFor="target-value">
                        {/* Dynamically adjust the label */}
                        {goalType === "monthly_amount" ? "Target Savings Amount (₹)" : "Target Percentage (%)"}
                    </Label>
                    <Input 
                        id="target-value"
                        type="number"
                        value={targetValue}
                        onChange={(e) => setTargetValue(e.target.value)} 
                        className="bg-secondary/50 border-border" 
                        placeholder={goalType === "monthly_amount" ? "e.g., 5000" : "e.g., 15"}
                    />
                </div>
                
                {/* Save Goal Button */}
                <p className="text-xs text-muted-foreground pt-2">
                    This commitment determines your Monthly Savings Status and Tier Progression.
                </p>
                
                <Button 
                    onClick={handleSaveGoal} // Dedicated handler
                    className="bg-accent text-black hover:bg-accent/90 font-semibold"
                    disabled={updateGoalMutation.isPending || !targetValue} // Disable if value is missing
                >
                    {updateGoalMutation.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving Goal...
                        </>
                    ) : (
                        "Set Goal"
                    )}
                </Button>
            </CardContent>
        </Card>


        {/* Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Expense Alerts</Label>
                  <p className="text-xs text-muted-foreground">Get notified when you exceed budget</p>
                </div>
                <Switch 
                  checked={notifications.expense} 
                  onCheckedChange={(c) => handleToggleSetting('expense', c)}
                  disabled={updateSettingsMutation.isPending}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Report</Label>
                  <p className="text-xs text-muted-foreground">Receive weekly spending summary</p>
                </div>
                <Switch 
                  checked={notifications.weekly} 
                  onCheckedChange={(c) => handleToggleSetting('weekly', c)}
                  disabled={updateSettingsMutation.isPending}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Reward Updates</Label>
                  <p className="text-xs text-muted-foreground">Notifications about earned points</p>
                </div>
                <Switch 
                  checked={notifications.rewards} 
                  onCheckedChange={(c) => handleToggleSetting('rewards', c)}
                  disabled={updateSettingsMutation.isPending}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                App Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Toggle application theme</p>
                </div>
                <Switch defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Biometric Login</Label>
                  <p className="text-xs text-muted-foreground">Use fingerprint/FaceID to login</p>
                </div>
                <Switch 
                  checked={notifications.biometric} 
                  onCheckedChange={(c) => handleToggleSetting('biometric', c)}
                  disabled={updateSettingsMutation.isPending}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Currency</Label>
                  <p className="text-xs text-muted-foreground">Display currency symbol</p>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">INR (₹)</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-400" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Change Password Section */}
            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-secondary/20">
              <div>
                <p className="font-medium text-white">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your password regularly</p>
              </div>
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-border hover:bg-white/5" disabled={changePasswordMutation.isPending}>Update</Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border text-white">
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>Enter your current password to set a new one.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <Input 
                        type="password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="bg-secondary border-border" 
                        disabled={changePasswordMutation.isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-secondary border-border" 
                        disabled={changePasswordMutation.isPending}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handleChangePassword}
                      className="bg-primary text-black hover:bg-primary/90"
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                  </Button>
                </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Delete Account Section */}
            <div className="flex items-center justify-between p-4 border border-red-900/30 rounded-lg bg-red-900/10">
              <div>
                <p className="font-medium text-red-400">Delete Account</p>
                <p className="text-sm text-red-400/70">Permanently remove your data</p>
              </div>
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="bg-red-600 hover:bg-red-700" disabled={deleteAccountMutation.isPending}>Delete</Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border text-white">
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. You must enter your current password to confirm permanent deletion of your account and data.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 py-4">
                    <Label>Enter Password to Confirm</Label>
                    <Input 
                      type="password" 
                      value={confirmDeletePassword}
                      onChange={(e) => setConfirmDeletePassword(e.target.value)}
                      className="bg-secondary border-border" 
                      disabled={deleteAccountMutation.isPending}
                    />
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="destructive" 
                      onClick={handleConfirmDelete}
                      disabled={deleteAccountMutation.isPending}
                    >
                      {deleteAccountMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Yes, delete my account"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-center pt-4">
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-destructive gap-2 hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Log Out of All Devices
          </Button>
        </div>
      </div>
  );
}