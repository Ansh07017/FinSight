import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target, TrendingUp, Lock, Gift } from "lucide-react";

export default function RewardsPage() {
  return (
    <Layout>
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-4xl font-bold text-white mb-4">Your Savings Journey</h1>
          <p className="text-muted-foreground text-lg">
            Earn points for every saving goal you hit. Unlock exclusive tiers and redeem exciting rewards.
          </p>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 bg-gradient-to-br from-card to-secondary/50 border-border/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Trophy className="w-48 h-48" />
            </div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-white">Gold Tier Member</CardTitle>
                  <CardDescription>You're in the top 15% of savers!</CardDescription>
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50 text-lg px-4 py-1">
                  Level 3
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white font-medium">2,450 XP</span>
                  <span className="text-muted-foreground">Next Tier: Platinum (3,000 XP)</span>
                </div>
                <Progress value={81} className="h-3 bg-black/40" indicatorClassName="bg-gradient-to-r from-yellow-500 to-amber-300" />
                <p className="text-sm text-muted-foreground pt-2">
                  Only 550 more points to reach Platinum tier. Save 5% more this week to get a bonus!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 flex flex-col justify-center items-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Gift className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Available Rewards</h3>
            <p className="text-3xl font-bold text-primary mb-4">12</p>
            <p className="text-sm text-muted-foreground">
              Vouchers ready to redeem
            </p>
          </Card>
        </div>

        {/* Tiers */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Membership Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { name: "Bronze", xp: "0 - 1000", color: "text-orange-400", bg: "bg-orange-400/10", icon: Star, active: false },
              { name: "Silver", xp: "1000 - 2000", color: "text-slate-300", bg: "bg-slate-300/10", icon: TrendingUp, active: false },
              { name: "Gold", xp: "2000 - 3000", color: "text-yellow-400", bg: "bg-yellow-400/10", icon: Trophy, active: true },
              { name: "Platinum", xp: "3000+", color: "text-cyan-400", bg: "bg-cyan-400/10", icon: Target, active: false, locked: true },
            ].map((tier) => (
              <Card key={tier.name} className={`border-border/50 ${tier.active ? 'bg-card border-primary/50 ring-1 ring-primary/50' : 'bg-card/50 opacity-70'}`}>
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 mx-auto rounded-full ${tier.bg} flex items-center justify-center mb-4`}>
                    {tier.locked ? <Lock className="w-6 h-6 text-muted-foreground" /> : <tier.icon className={`w-6 h-6 ${tier.color}`} />}
                  </div>
                  <h3 className={`font-bold text-lg ${tier.color}`}>{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{tier.xp} XP</p>
                  {tier.active && <Badge variant="secondary" className="mt-4 bg-primary/20 text-primary">Current</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Ways to Earn */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-white">Ways to Earn Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: "Weekly Savings Goal", desc: "Reduce expenses by 5% vs last week", points: "+100 XP" },
                  { title: "Streak Bonus", desc: "Track expenses for 7 days in a row", points: "+50 XP" },
                  { title: "Budget Master", desc: "Stay under budget for a category", points: "+75 XP" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <p className="font-medium text-white">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary">{item.points}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-white">Active Challenges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-medium">No Spend Weekend</span>
                    <span className="text-primary">2/3 Days</span>
                  </div>
                  <Progress value={66} className="h-2 bg-secondary" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-medium">Transport Saver</span>
                    <span className="text-primary">₹450 / ₹1000</span>
                  </div>
                  <Progress value={45} className="h-2 bg-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
