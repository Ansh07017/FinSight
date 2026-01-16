// client/src/pages/LeaderboardPage.tsx

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Trophy, Medal, User, Loader2, TrendingUp, 
  Users, Crown, ArrowUpRight, Shield 
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { leaderboard, auth } from "@/lib/api";

// Types matching the backend response
interface LeaderboardEntry {
  userId: string;
  displayName: string;
  savingsPercentage: number;
  tier: string;
  points: number;
}

// Avatar Helper
const getAvatarUrl = (seed: string) => 
  `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&radius=50&backgroundColor=00d4aa`;

export default function LeaderBoardPage() {
  
  // 1. DATA FETCHING
  const { data: board = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: leaderboard.get,
  });

  const { data: authData } = useQuery({
    queryKey: ["auth-me"],
    queryFn: auth.me,
  });

  const currentUserId = authData?.user?.id;

  // 2. ANALYTICS & CALCULATIONS
  const stats = useMemo(() => {
    if (!board.length) return { avg: 0, myRank: -1, myData: null };

    const total = board.reduce((acc, curr) => acc + curr.savingsPercentage, 0);
    const avg = Math.round(total / board.length);
    
    const myIndex = board.findIndex(u => u.userId === currentUserId);
    const myData = myIndex !== -1 ? board[myIndex] : null;

    return { avg, myRank: myIndex + 1, myData };
  }, [board, currentUserId]);

  // 3. RENDER HELPERS
  const getRankStyle = (index: number) => {
    switch (index) {
      case 0: return "border-yellow-500/50 bg-yellow-500/10 text-yellow-500";
      case 1: return "border-slate-400/50 bg-slate-400/10 text-slate-400";
      case 2: return "border-orange-700/50 bg-orange-700/10 text-orange-700";
      default: return "border-border/50 bg-card/50 text-muted-foreground";
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 1: return <Medal className="w-5 h-5 text-slate-400" />;
      case 2: return <Medal className="w-5 h-5 text-orange-700" />;
      default: return <span className="font-mono font-bold text-sm">#{index + 1}</span>;
    }
  };

  // 4. LOADING STATE
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#00D4AA]" />
        <p className="text-muted-foreground mt-4 animate-pulse">Calculating Global Rankings...</p>
      </div>
    );
  }

  // 5. MAIN UI
  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground">Compare your savings efficiency with the community.</p>
        </div>
        
        {/* User Rank Badge (Mobile/Desktop) */}
        {stats.myData && (
          <div className="flex items-center gap-3 px-4 py-2 bg-[#00D4AA]/10 border border-[#00D4AA]/20 rounded-xl">
            <Trophy className="w-5 h-5 text-[#00D4AA]" />
            <div>
              <p className="text-[10px] uppercase font-bold text-[#00D4AA] tracking-wider">Your Rank</p>
              <p className="text-lg font-black text-white">#{stats.myRank}</p>
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COL: RANKINGS LIST (2/3 Width) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card border-border/50 shadow-lg">
            <CardHeader className="pb-2 border-b border-border/20">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-bold text-white">Top Savers</CardTitle>
                <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                  Based on % Income Saved
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {board.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No data available yet. Be the first to join!
                </div>
              ) : (
                <div className="divide-y divide-border/20">
                  {board.map((entry, index) => {
                    const isMe = entry.userId === currentUserId;
                    
                    return (
                      <div 
                        key={entry.userId} 
                        className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors ${isMe ? 'bg-[#00D4AA]/5' : ''}`}
                      >
                        {/* Rank Icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${getRankStyle(index)}`}>
                          {getRankIcon(index)}
                        </div>

                        {/* Avatar & Name */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="w-10 h-10 border border-border">
                            <AvatarImage src={getAvatarUrl(entry.displayName)} />
                            <AvatarFallback className="bg-secondary text-xs">{entry.displayName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <p className={`font-bold truncate ${isMe ? 'text-[#00D4AA]' : 'text-white'}`}>
                                {entry.displayName} {isMe && "(You)"}
                              </p>
                              {index < 3 && <TrendingUp className="w-3 h-3 text-green-500" />}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Shield className="w-3 h-3" /> {entry.tier || "The Spark"}
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="text-right">
                          <p className="text-lg font-black text-white">{entry.savingsPercentage}%</p>
                          <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Saved</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COL: COMMUNITY PULSE (1/3 Width) */}
        <div className="space-y-6">
          
          {/* 1. Community Comparison Card */}
          <Card className="bg-card border-border/50 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Users className="w-24 h-24 text-[#00D4AA]" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="w-5 h-5 text-[#00D4AA]" /> Community Pulse
              </CardTitle>
              <CardDescription>How you stack up against the global average.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* You */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white font-bold">You</span>
                  <span className="text-[#00D4AA] font-mono">{stats.myData?.savingsPercentage || 0}%</span>
                </div>
                <Progress value={stats.myData?.savingsPercentage || 0} className="h-2" indicatorClassName="bg-[#00D4AA]" />
              </div>

              {/* Average */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Global Avg</span>
                  <span className="text-white font-mono">{stats.avg}%</span>
                </div>
                <Progress value={stats.avg} className="h-2" indicatorClassName="bg-blue-500" />
              </div>

              {/* Verdict */}
              <div className="pt-4 border-t border-border/20">
                {(stats.myData?.savingsPercentage || 0) >= stats.avg ? (
                  <div className="flex items-start gap-3 bg-[#00D4AA]/10 p-3 rounded-lg border border-[#00D4AA]/20">
                    <TrendingUp className="w-5 h-5 text-[#00D4AA] mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-white">Above Average! 🚀</p>
                      <p className="text-xs text-muted-foreground">You are saving better than most users. Keep it up!</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 bg-secondary/20 p-3 rounded-lg border border-border/50">
                    <ArrowUpRight className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-white">Room to Grow</p>
                      <p className="text-xs text-muted-foreground">Try the 'Growth' page to find simple ways to boost your savings.</p>
                    </div>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

          {/* 2. Motivational Card */}
          <Card className="bg-gradient-to-br from-[#1a1a1a] to-black border-border/50 shadow-lg">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto text-yellow-500 border border-yellow-500/20">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold">Climb the Ranks</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Consistency is key. Your Tier and XP in the Growth tab directly impact your reputation here.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}