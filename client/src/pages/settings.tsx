import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Moon, Shield, User, Smartphone, LogOut } from "lucide-react";

export default function SettingsPage() {
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
                <Input defaultValue="Aditya" className="bg-secondary/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input defaultValue="Kumar" className="bg-secondary/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input defaultValue="aditya@example.com" className="bg-secondary/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input defaultValue="+91 98765 43210" className="bg-secondary/50 border-border" />
              </div>
            </div>
            <Button className="bg-primary text-black hover:bg-primary/90">Save Changes</Button>
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
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Report</Label>
                  <p className="text-xs text-muted-foreground">Receive weekly spending summary</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Reward Updates</Label>
                  <p className="text-xs text-muted-foreground">Notifications about earned points</p>
                </div>
                <Switch />
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
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Currency</Label>
                  <p className="text-xs text-muted-foreground">Display currency symbol</p>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground">INR (₹)</Button>
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
              <Button variant="outline" className="border-border hover:bg-white/5">Update</Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-red-900/30 rounded-lg bg-red-900/10">
              <div>
                <p className="font-medium text-red-400">Delete Account</p>
                <p className="text-sm text-red-400/70">Permanently remove your data</p>
              </div>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700">Delete</Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-center pt-4">
          <Button variant="ghost" className="text-muted-foreground hover:text-destructive gap-2">
            <LogOut className="w-4 h-4" />
            Log Out of All Devices
          </Button>
        </div>
      </div>
    </Layout>
  );
}
