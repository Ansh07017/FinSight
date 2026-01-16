// client/src/components/layout.tsx

import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext"; 
import { 
  LayoutDashboard, 
  Wallet, 
  Sprout, 
  Settings, 
  Menu, 
  ListOrdered,
  FileBarChart,
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logoImg from "@assets/generated_images/minimalist_mint_green_rupee_logo_symbol.png";

// --- NAVIGATION CONFIGURATION ---
const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Wallet, label: "Expenses", href: "/expenses" },
  { icon: FileBarChart, label: "Reports", href: "/reports" },
  { icon: Sprout, label: "Growth & Rewards", href: "/growth" }, 
  { icon: ListOrdered, label: "Leaderboard", href: "/leaderboard" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const getAvatarUrl = (userData: any): string => {
    // Fallback to email if name is missing
    const seed = userData?.firstName || userData?.email || 'Default';
    return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&radius=50&backgroundColor=00d4aa`;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  // 1. Destructure 'user' (Identity) AND 'userProfile' (Gamification Stats)
  const { user, userProfile, isLoading, isAuthenticated } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false); 

  useEffect(() => {
    if (!isLoading && !isAuthenticated && location !== "/auth") {
      setLocation("/auth");
    }
  }, [isLoading, isAuthenticated, location, setLocation]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* BRANDING SECTION */}
      <div className="p-6 flex items-center gap-3 border-b border-border/50">
        <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center border border-[#00D4AA]/20">
          <img src={logoImg} alt="FinSaver" className="w-5 h-5" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          Fin<span className="text-[#00D4AA]">sight</span>
        </span>
      </div>

      {/* NAVIGATION SECTION */}
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                onClick={() => setIsMobileOpen(false)} 
                className={cn(
                  "w-full justify-start gap-3 text-muted-foreground hover:text-white hover:bg-white/5 transition-all duration-200",
                  isActive && "bg-[#00D4AA]/10 text-[#00D4AA] hover:bg-[#00D4AA]/15 hover:text-[#00D4AA] font-bold border-l-2 border-[#00D4AA] rounded-l-none"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* USER PROFILE FOOTER */}
      <div className="p-4 border-t border-border/50 bg-secondary/5">
        {isLoading ? (
          <div className="flex items-center gap-3 p-2 text-muted-foreground animate-pulse">
            <Loader2 className="h-5 w-5 animate-spin text-[#00D4AA]" />
            <span className="text-xs font-medium uppercase tracking-tighter">Syncing...</span>
          </div>
        ) : (
          <Link href="/settings">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all group border border-transparent hover:border-border/50">
              <Avatar className="w-10 h-10 border border-[#00D4AA]/20 group-hover:border-[#00D4AA]/50 transition-colors">
                {/* 2. Use 'user' object for avatar seed */}
                <AvatarImage src={getAvatarUrl(user)} /> 
                <AvatarFallback className="bg-[#00D4AA]/10 text-[#00D4AA] text-xs font-bold uppercase">
                  {user?.firstName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-white truncate group-hover:text-[#00D4AA] transition-colors">
                  {/* 3. Use 'user' for Names */}
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground truncate font-semibold">
                  {/* 4. Use 'userProfile' for Tier */}
                  {userProfile?.tier || 'The Spark'}
                </p>
              </div>
              <Settings className="w-4 h-4 text-muted-foreground group-hover:text-[#00D4AA] group-hover:rotate-90 transition-all" />
            </div>
          </Link>
        )} 
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden md:block w-64 fixed inset-y-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Top Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-card/80 backdrop-blur-md z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="FinSaver" className="w-6 h-6" />
          <span className="font-bold text-white tracking-tighter">Fin<span className="text-[#00D4AA]">sight</span></span>
        </div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-card border-r border-border">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content Scroll Area */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen bg-background overflow-y-auto">
        <div className="h-full p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
          {children}
        </div>
      </main>
    </div>
  );
}