// client/src/components/layout.tsx

import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthContext"; 
import { 
  LayoutDashboard, 
  Wallet, 
  Trophy, 
  TrendingUp,
  Settings, 
  Menu, 
  LogOut,
  FileBarChart,
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logoImg from "@assets/generated_images/minimalist_mint_green_rupee_logo_symbol.png";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Wallet, label: "Expenses", href: "/expenses" },
  { icon: TrendingUp, label: "Behavioral Savings", href: "/behavioralSavings" },
  { icon: Trophy, label: "Rewards", href: "/rewards" },
  { icon: FileBarChart, label: "Reports", href: "/reports" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

/**
 * Optimized Avatar Logic: 
 * Uses the lightweight userProfile summary to generate dynamic visuals instantly.
 */
const getAvatarUrl = (profileData: any): string => {
    const firstName = profileData?.firstName;
    const username = profileData?.username; 
    const seed = firstName || username || 'Default';
    
    if (seed === 'Default') {
        return 'https://github.com/shadcn.png';
    }
    return `https://api.dicebear.com/8.x/initials/svg?seed=${seed}&radius=50&chars=1`;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { userProfile, isLoading, isAuthenticated } = useAuth();

  /**
   * Redirection Guard: 
   * Prevents layout flickering by only redirecting once loading is confirmed complete.
   */
  useEffect(() => {
    if (!isLoading && !isAuthenticated && location !== "/auth") {
      setLocation("/auth");
    }
  }, [isLoading, isAuthenticated, location, setLocation]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* BRANDING SECTION */}
      <div className="p-6 flex items-center gap-3 border-b border-border/50">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
          <img src={logoImg} alt="FinSaver" className="w-5 h-5" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          Fin<span className="text-primary">Sight</span>
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
                className={cn(
                  "w-full justify-start gap-3 text-muted-foreground hover:text-white hover:bg-white/5 transition-all duration-200",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-bold border-l-2 border-primary rounded-l-none"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* USER PROFILE FOOTER (Granular Loading) */}
      <div className="p-4 border-t border-border/50 bg-secondary/5">
        {isLoading ? (
          <div className="flex items-center gap-3 p-2 text-muted-foreground animate-pulse">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs font-medium uppercase tracking-tighter">Syncing Profile...</span>
          </div>
        ) : (
          <Link href="/settings">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all group border border-transparent hover:border-border/50">
              <Avatar className="w-10 h-10 border border-primary/20 group-hover:border-primary/50 transition-colors">
                <AvatarImage src={getAvatarUrl(userProfile)} /> 
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold uppercase">
                  {userProfile?.firstName?.[0] || 'U'}
                  {userProfile?.lastName?.[0] || ''}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                  {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Guest User'}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground truncate font-semibold">
                  {userProfile?.tier || 'Bronze Member'}
                </p>
              </div>
              <Settings className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:rotate-90 transition-all" />
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
          <span className="font-bold text-white tracking-tighter">FinInsight</span>
        </div>
        <Sheet>
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