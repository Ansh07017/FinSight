// client/src/pages/RewardsPage.tsx

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { behavioral, profile } from "@/lib/api";
import { Trophy, Star, Target, TrendingUp, Lock, Gift, Zap, ShieldCheck } from "lucide-react";

const TIERS = [
  { name: "Bronze", minXp: 0, maxXp: 1000, color: "text-orange-400", bg: "bg-orange-400/10", icon: Star },
  { name: "Silver", minXp: 1000, maxXp: 2000, color: "text-slate-300", bg: "bg-slate-300/10", icon: TrendingUp },
  { name: "Gold", minXp: 2000, maxXp: 3000, color: "text-yellow-400", bg: "bg-yellow-400/10", icon: Trophy },
  { name: "Platinum", minXp: 3000, maxXp: 5000, color: "text-cyan-400", bg: "bg-cyan-400/10", icon: Target },
];

export default function RewardsPage() {
  // 1. Fetch Behavioral History and Profile Data
  const { data: savingsHistory = [] } = useQuery({
    queryKey: ["behavioral-history"],
    queryFn: behavioral.getHistory,
  });

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: profile.get,
  });

  // 2. Dynamic Calculations
  const totalXp = useMemo(() => {
    return savingsHistory.reduce((sum: number, log: any) => sum + (log.xpAwarded || 0), 0);
  }, [savingsHistory]);

  const currentTier = useMemo(() => {
    return TIERS.slice().reverse().find(t => totalXp >= t.minXp) || TIERS[0];
  }, [totalXp]);

  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1] || null;
  const progressToNext = nextTier 
    ? Math.min(Math.round(((totalXp - currentTier.minXp) / (nextTier.minXp - currentTier.minXp)) * 100), 100)
    : 100;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">Savings Rewards</h1>
        <p className="text-muted-foreground text-lg">
          Your financial discipline earns you XP. Unlock tiers by logging behavioral wins and staying under budget.
        </p>
      </div>

      {/* Current Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-br from-card to-secondary/30 border-border/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <currentTier.icon className="w-48 h-48" />
          </div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Badge variant="outline" className={`${currentTier.bg} ${currentTier.color} border-current mb-2`}>
                  {currentTier.name} Member
                </Badge>
                <CardTitle className="text-3xl text-white">Level {TIERS.indexOf(currentTier) + 1}</CardTitle>
                <CardDescription>Based on your behavioral saving choices</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-white">{totalXp.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">Total XP Earned</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress to {nextTier ? nextTier.name : 'Max Level'}</span>
                <span className="text-white font-bold">{progressToNext}%</span>
              </div>
              <Progress value={progressToNext} className="h-3 bg-black/40" indicatorClassName="bg-[#00D6AB]" />
              {nextTier && (
                <p className="text-sm text-muted-foreground">
                  Earn <span className="text-white font-semibold">{nextTier.minXp - totalXp} more XP</span> to unlock the {nextTier.name} tier benefits.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 flex flex-col justify-center items-center text-center p-6 border-t-4 border-t-[#00D6AB]">
          <div className="w-16 h-16 rounded-full bg-[#00D6AB]/10 flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-[#00D6AB]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Redeemable Points</h3>
          <p className="text-4xl font-black text-[#00D6AB] mb-2">{profileData?.profile?.rewardPoints || 0}</p>
          <p className="text-xs text-muted-foreground px-4">
            Convert these points into real vouchers or investment top-ups.
          </p>
        </Card>
      </div>

      {/* Membership Tiers Grid */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#00D6AB]" /> Roadmap to Wealth
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {TIERS.map((tier) => {
            const isCurrent = currentTier.name === tier.name;
            const isLocked = totalXp < tier.minXp;
            return (
              <Card key={tier.name} className={`border-border/50 transition-all ${isCurrent ? 'bg-secondary/20 border-[#00D6AB]/50 ring-1 ring-[#00D6AB]/50' : 'bg-card/40'}`}>
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 mx-auto rounded-full ${tier.bg} flex items-center justify-center mb-4`}>
                    {isLocked ? <Lock className="w-5 h-5 text-muted-foreground" /> : <tier.icon className={`w-6 h-6 ${tier.color}`} />}
                  </div>
                  <h3 className={`font-bold text-lg ${isLocked ? 'text-muted-foreground' : 'text-white'}`}>{tier.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{tier.minXp}+ XP Required</p>
                  {isCurrent && <Badge className="mt-4 bg-[#00D6AB] text-black">Active Tier</Badge>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Ways to Earn - Linked to Behavioral Logic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#00D6AB]" /> Earning Logic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "B-SAVE Logs", desc: "Every ₹1 saved through behavioral choices", points: "1 XP" },
                { title: "Budget Discipline", desc: "Stay under your monthly budget limit", points: "200 XP" },
                { title: "Daily Streak", desc: "Log a behavioral win 3 days in a row", points: "50 XP" },
                { title: "Debt Repayment", desc: "Pay off a recurring credit bill early", points: "100 XP" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/20">
                  <div>
                    <p className="font-medium text-sm text-white">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <Badge variant="outline" className="text-[#00D6AB] border-[#00D6AB]/30">+{item.points}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-white">Active Milestone</CardTitle>
            <CardDescription>Large scale behavioral goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white font-medium">Wealth Starter</span>
                <span className="text-[#00D6AB]">{totalXp} / 1000 XP</span>
              </div>
              <Progress value={(totalXp / 1000) * 100} className="h-2 bg-secondary" indicatorClassName="bg-[#00D6AB]" />
              <p className="text-[10px] text-muted-foreground mt-2">Reach 1000 XP to unlock your first investment voucher.</p>
            </div>
            
            <div className="p-4 rounded-lg bg-[#00D6AB]/5 border border-[#00D6AB]/20">
               <div className="flex items-start gap-3">
                 <Star className="w-5 h-5 text-[#00D6AB] shrink-0" />
                 <p className="text-xs text-muted-foreground leading-relaxed">
                   <strong className="text-white">Pro Tip:</strong> Users who log "Transport" behavioral wins save an average of ₹2,400 more per month.
                 </p>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}