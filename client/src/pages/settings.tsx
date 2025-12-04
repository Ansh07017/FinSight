import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Bell, Moon, Shield, User, Smartphone, LogOut, Loader2 } from "lucide-react";
import { profile, settings, auth } from "@/lib/api";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // Toggles
  const [notifications, setNotifications] = useState({
    expense: false,
    weekly: false,
    rewards: false,
    biometric: false
  });

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: profile.get,
  });

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: settings.get,
  });

  useEffect(() => {
    if (profileData) {
      setFirstName(profileData.firstName || "");
      setLastName(profileData.lastName || "");
      setEmail(profileData.email || "");
      setPhone(profileData.phone || "");
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

  const updateProfileMutation = useMutation({
    mutationFn: profile.updateUser,
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

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      firstName,
      lastName,
      email,
      phone,
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

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been securely logged out.",
    });
    setLocation("/auth");
  };

  const handleDeleteAccount = () => {
    toast({
      variant: "destructive",
      title: "Account Deleted",
      description: "Your account has been permanently removed.",
    });
    setLocation("/auth");
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and app settings</p>
        </div>

        {/* Profile Section */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal details and profile photo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20 border-2 border-primary/20">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button variant="outline" className="border-border hover:bg-white/5">Change Photo</Button>
                <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size of 800K</p>
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
            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-secondary/20">
              <div>
                <p className="font-medium text-white">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your password regularly</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-border hover:bg-white/5">Update</Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border text-white">
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>Enter your current password to set a new one.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <Input type="password" className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input type="password" className="bg-secondary border-border" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button className="bg-primary text-black hover:bg-primary/90">Update Password</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-red-900/30 rounded-lg bg-red-900/10">
              <div>
                <p className="font-medium text-red-400">Delete Account</p>
                <p className="text-sm text-red-400/70">Permanently remove your data</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="bg-red-600 hover:bg-red-700">Delete</Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border text-white">
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="destructive" onClick={handleDeleteAccount}>Yes, delete my account</Button>
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
    </Layout>
  );
}
