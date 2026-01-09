import { useQuery } from "@tanstack/react-query";
import { leaderboard, auth } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import {
  Trophy,
  Medal,
  User,
  Loader2,
  Minus,
  TrendingUp,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  savingsPercentage: number;
}

export default function LeaderBoardPage() {
  // Leaderboard data
  const {
    data: board = [],
    isLoading,
    isError,
    error,
  } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: leaderboard.get,
  });

  // Current logged-in user
  const { data: me } = useQuery({
    queryKey: ["auth-me"],
    queryFn: auth.me,
  });

  /* -------------------- ERROR STATE -------------------- */
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <Trophy className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-sm text-red-400 font-semibold uppercase tracking-wide">
          Failed to load leaderboard
        </p>
        <p className="text-xs text-muted-foreground max-w-sm">
          {(error as Error)?.message ||
            "Something went wrong while fetching savings data."}
        </p>
      </div>
    );
  }

  /* -------------------- EMPTY STATE -------------------- */
  if (!isLoading && board.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <Trophy className="w-10 h-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground uppercase tracking-wide">
          No savings data yet
        </p>
        <p className="text-xs text-muted-foreground/60">
          Start adding income and expenses to appear on the leaderboard.
        </p>
      </div>
    );
  }

  /* -------------------- COMMUNITY AVERAGE -------------------- */
  const avgSavings =
    board.length > 0
      ? Math.round(
          board.reduce((sum, u) => sum + u.savingsPercentage, 0) / board.length
        )
      : 0;

  return (
    <div className="min-h-screen pb-16 space-y-10">
      {/* -------------------- HEADER -------------------- */}
      <div className="text-center space-y-2 pt-6">
        <Trophy className="text-yellow-400 w-12 h-12 mx-auto mb-2" />
        <h1 className="text-4xl font-black text-white tracking-tight uppercase">
          Top Savers
        </h1>
        <p className="text-muted-foreground uppercase tracking-widest text-xs">
          Monthly Savings Efficiency
        </p>
      </div>

      {/* -------------------- LEADERBOARD LIST -------------------- */}
      <div className="grid gap-4 max-w-3xl mx-auto px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#00D4AA]" />
            <p className="text-muted-foreground animate-pulse text-xs uppercase">
              Loading Global Ranks...
            </p>
          </div>
        ) : (
          board.map((entry, index) => {
            const isCurrentUser = me?.user?.id === entry.userId;
            const isTopper = index === 0;


            return (
              <Card
  key={entry.userId}
  className={`transition-all
    ${
      isTopper
        ? "bg-[#00D4AA]/12 border border-[#00D4AA] shadow-[0_0_22px_rgba(0,212,170,0.25)]"
        : isCurrentUser
        ? "bg-card/60 border-2 border-[#00D4AA] shadow-[0_0_18px_rgba(0,212,170,0.18)]"
        : "bg-card/40 border border-border/50 hover:bg-white/2"
    }`}
>

                <CardContent className="p-5 flex items-center gap-6">
                  {/* Rank */}
                  <div className="text-xl font-black text-muted-foreground/40 w-8">
                    #{index + 1}
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center
                      ${
                        isTopper
                          ? "bg-[#00D4AA]/20"
                          : "bg-secondary/50"
                      }`}
                  >
                    {index === 0 ? (
                      <Medal className="text-yellow-400 w-5 h-5" />
                    ) : (
                      <User className="text-muted-foreground w-5 h-5" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-end">
                      <span
                        className={`font-bold ${
                          isTopper ? "text-[#00D4AA]" : "text-white"
                        }`}
                      >
                        {entry.displayName}
                        {isCurrentUser && (
                          <span className="ml-2 text-[10px] uppercase tracking-wide text-[#00D4AA]">
                            (You)
                          </span>
                        )}
                      </span>

                      <div className="flex items-center gap-2">
                        {entry.savingsPercentage > 0 ? (
                          <TrendingUp className="w-3 h-3 text-[#00D4AA]" />
                        ) : (
                          <Minus className="w-3 h-3 text-muted-foreground/30" />
                        )}
                        <span
                          className={`font-mono font-black text-lg ${
                            entry.savingsPercentage > 0
                              ? "text-[#00D4AA]"
                              : "text-muted-foreground/40"
                          }`}
                        >
                          {entry.savingsPercentage}%
                        </span>
                      </div>
                    </div>

                    <Progress
                      value={Math.min(
                        Math.max(entry.savingsPercentage, 0),
                        100
                      )}
                      className="h-1.5 bg-secondary/50"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* -------------------- COMMUNITY AVERAGE BAR -------------------- */}
      <div className="max-w-3xl mx-auto px-4 pt-10 space-y-3">
        <div className="flex justify-between text-xs uppercase tracking-wide text-muted-foreground">
          <span>Community Average Savings</span>
          <span className="font-mono font-bold text-[#00D4AA]">
            {avgSavings}%
          </span>
        </div>
        <Progress value={avgSavings} className="h-2 bg-secondary/50" />
      </div>
    </div>
  );
}
