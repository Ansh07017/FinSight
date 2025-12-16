// client/src/pages/BehavioralSavingsPage.tsx

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress"; // Assuming you have a Progress component
import { Textarea } from "@/components/ui/textarea"; // Assuming you have a Textarea component
import { Loader2, Zap, CheckCircle, TrendingUp, Target } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { behavioral } from "@/lib/api"; 
import { dashboard } from "@/lib/api"; 

// Define the expected structure returned by logSavings route/storage
interface LogSavingsSuccessData {
    message: string;
    xpEarned: number;
    logId: string;
}

// Data type sent to the mutation function
interface LogSavingsVariables {
    estimatedAmount: string; 
    behaviorType: string;
    customDescription?: string; // New field for custom input
}

// List of common behaviors (simplified for quick selection)
const QUICK_BEHAVIORS = [
    { type: 'packed_lunch', label: 'Packed Lunch (₹100)' },
    { type: 'walked_to_work', label: 'Walked/Cycled (₹50)' },
    { type: 'reused_item', label: 'Reused/Repaired (₹200)' },
    { type: 'avoided_impulse', label: 'Avoided Impulse (₹500)' },
];

// Placeholder for Daily XP Cap (must match server/storage.ts)
const DAILY_XP_CAP = 500; 
// const XP_RATE_PER_RUPEE = 1; // Not needed on client

export default function BehavioralSavingsPage() {
    const { toast } = useToast();
    const [estimatedAmount, setEstimatedAmount] = useState('');
    const [behaviorType, setBehaviorType] = useState('');
    const [customDescription, setCustomDescription] = useState('');
    
    // Placeholder for total XP earned today from B-SAVE 
    // In a real app, this value would come from the dashboard query response.
    const xpToday = 0; 

    const xpProgress = Math.round((xpToday / DAILY_XP_CAP) * 100);

    const logSavingsMutation = useMutation<LogSavingsSuccessData, Error, LogSavingsVariables>({
        mutationFn: (data) => behavioral.logSavings(data),
        
        onSuccess: (data) => { 
            toast({
                title: "✅ Win Logged!",
                description: `You earned ${data.xpEarned} XP instantly! Keep the streak going.`,
            });
            // Reset form state
            setEstimatedAmount('');
            setBehaviorType('');
            setCustomDescription('');
            // Optional: queryClient.invalidateQueries({ queryKey: ["dashboard"] }); 
        },
        
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Logging Failed",
                description: error.message.includes("Daily limit") 
                    ? "Daily XP limit reached for behavioral savings. Check back tomorrow!"
                    : error.message || "Failed to log behavioral saving.",
            });
        },
    });

    const handleLogSubmission = (e: React.FormEvent) => {
        e.preventDefault();
        if (!estimatedAmount || (!behaviorType && !customDescription)) {
            toast({
                variant: "destructive",
                title: "Missing Details",
                description: "Please select a quick behavior OR enter a custom description, and provide an estimated amount.",
            });
            return;
        }
        
        // Use the selected type or the custom description as the behaviorType if custom is used
        const finalBehaviorType = customDescription || behaviorType;
        
        logSavingsMutation.mutate({
            behaviorType: finalBehaviorType,
            estimatedAmount: estimatedAmount,
            customDescription: customDescription || undefined,
        });
    };
    
    const selectQuickBehavior = (type: string) => {
        setBehaviorType(type);
        setCustomDescription(''); // Clear custom description when a quick log is selected
        // Set estimated amount based on Quick Log value (simple parsing for the example)
        const selected = QUICK_BEHAVIORS.find(b => b.type === type);
        if (selected) {
            const valueMatch = selected.label.match(/\((\₹)(\d+)\)/);
            if (valueMatch && valueMatch[2]) {
                 setEstimatedAmount(valueMatch[2]);
            }
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <TrendingUp className="w-7 h-7 text-accent" />
                    B-SAVE Tracker <span className="text-xl text-muted-foreground">(Daily Wins)</span>
                </h1>
            </div>

            {/* Content Grid: 1/3 XP Card, 2/3 Log Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. XP Progress Card (Matches Dashboard Theme) */}
                <Card className="bg-card border-border/50 shadow-lg lg:col-span-1 h-fit">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-accent" />
                            Daily XP Goal
                        </CardTitle>
                        <CardDescription>
                            Your progress towards today's max behavioral XP.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-2xl font-bold text-accent">
                            {xpToday} / {DAILY_XP_CAP} XP
                        </div>
                        {/* STYLE FIX: indicatorClassName="bg-accent" */}
                        <Progress value={xpProgress} className="h-2 bg-secondary/50" indicatorClassName="bg-accent" />
                        <p className="text-sm text-muted-foreground">
                            {xpProgress}% complete. Every rupee saved counts!
                        </p>
                    </CardContent>
                </Card>


                {/* 2. Log Form Card (Matches Dashboard Theme) */}
                <Card className="bg-card border-border/50 shadow-lg lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-accent" />
                            Log Your Behavioral Win
                        </CardTitle>
                        <CardDescription>
                            Quickly log a saving choice or enter a custom win.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogSubmission} className="space-y-6">
                            
                            {/* Quick Log Buttons */}
                            <div className="space-y-2">
                                <Label htmlFor="behavior">Quick Log Behavior</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {QUICK_BEHAVIORS.map((b) => (
                                        <Button
                                            key={b.type}
                                            type="button"
                                            variant={behaviorType === b.type ? "default" : "outline"}
                                            // STYLE FIX: Use bg-accent for selected state
                                            className={`justify-start h-auto p-3 text-left transition-colors text-white ${behaviorType === b.type ? 'bg-accent/80 text-black font-semibold hover:bg-accent' : 'border-border bg-secondary/50 hover:bg-secondary'}`}
                                            onClick={() => selectQuickBehavior(b.type)}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            {b.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="relative flex items-center pt-4 pb-4">
                                <div className="grow border-t border-border/50"></div>
                                <span className="shrink mx-4 text-sm text-muted-foreground">OR</span>
                                <div className="grow border-t border-border/50"></div>
                            </div>

                            {/* Custom Behavior Input */}
                            <div className="space-y-2">
                                <Label htmlFor="custom-description">Custom Behavior Description</Label>
                                <Textarea 
                                    id="custom-description"
                                    placeholder="e.g., Skipped my morning coffee run and saved money."
                                    value={customDescription}
                                    onChange={(e) => {
                                        setCustomDescription(e.target.value);
                                        setBehaviorType(''); // Clear quick log selection when typing custom
                                    }}
                                    className="bg-secondary/50 border-border min-h-[60px]" 
                                />
                            </div>

                            {/* Estimated Amount */}
                            <div className="space-y-2">
                                <Label htmlFor="amount">Estimated Savings Amount (₹)</Label>
                                <Input 
                                    id="amount"
                                    type="number"
                                    placeholder="Enter estimated amount saved (e.g., 150)"
                                    value={estimatedAmount}
                                    onChange={(e) => setEstimatedAmount(e.target.value)} 
                                    className="bg-secondary/50 border-border" 
                                    required
                                />
                            </div>

                            <Button 
                                type="submit" 
                                // STYLE FIX: Use bg-accent for primary action button
                                className="w-full bg-accent text-black hover:bg-accent/90 font-semibold"
                                disabled={logSavingsMutation.isPending || !estimatedAmount || (!behaviorType && !customDescription)}
                            >
                                {logSavingsMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Logging Win...
                                    </>
                                ) : (
                                    "Log Win & Get Instant XP"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
            
            <p className="text-sm text-muted-foreground text-center pt-4">
                This is a self-reported feature. XP earned is subject to a daily cap ({DAILY_XP_CAP} XP) to maintain fairness in the reward system.
            </p>
        </div>
    );
}