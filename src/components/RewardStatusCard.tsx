import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  CheckCircle2, 
  Coins, 
  Zap, 
  ExternalLink,
  TrendingUp
} from 'lucide-react';
import { ethers } from 'ethers';
import { BLOCK_EXPLORER, CONTRACTS } from '@/config/contracts';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface RewardStatusCardProps {
  rewardPerBlock: bigint;
  contractRewardBalance: bigint;
  rewardTokenSymbol: string;
  hasUpdateFunction: boolean;
  className?: string;
}

export const RewardStatusCard: React.FC<RewardStatusCardProps> = memo(({
  rewardPerBlock,
  contractRewardBalance,
  rewardTokenSymbol,
  hasUpdateFunction,
  className
}) => {
  const rewardPerBlockFormatted = parseFloat(ethers.formatEther(rewardPerBlock)).toFixed(6);
  const contractBalanceFormatted = parseFloat(ethers.formatEther(contractRewardBalance)).toFixed(4);
  
  const isRewardSet = rewardPerBlock > BigInt(0);
  const hasBalance = contractRewardBalance > BigInt(0);
  const isFullyConfigured = isRewardSet && hasBalance;

  // Calculate estimated daily rewards (assuming ~3 second blocks)
  const blocksPerDay = (24 * 60 * 60) / 3;
  const dailyRewards = isRewardSet 
    ? parseFloat(ethers.formatEther(rewardPerBlock)) * blocksPerDay 
    : 0;

  // Estimate how many days the contract can pay rewards
  const daysRemaining = isRewardSet && hasBalance
    ? parseFloat(ethers.formatEther(contractRewardBalance)) / dailyRewards
    : 0;

  return (
    <Card className={cn(
      "glass-card overflow-hidden",
      isFullyConfigured ? "border-success/30" : "border-warning/30",
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Reward Status
          </span>
          <Badge variant={isFullyConfigured ? "outline" : "destructive"} className="text-xs">
            {isFullyConfigured ? "Active" : "Needs Setup"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Reward Per Block */}
          <div className={cn(
            "p-3 rounded-xl border transition-all",
            isRewardSet 
              ? "bg-success/10 border-success/30" 
              : "bg-destructive/10 border-destructive/30"
          )}>
            <div className="flex items-center gap-2 mb-1">
              {isRewardSet ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <AlertCircle className="w-4 h-4 text-destructive" />
              )}
              <span className="text-xs text-muted-foreground">Per Block</span>
            </div>
            <p className="font-bold text-foreground">
              {rewardPerBlockFormatted} <span className="text-xs text-muted-foreground">{rewardTokenSymbol}</span>
            </p>
          </div>

          {/* Contract Balance */}
          <div className={cn(
            "p-3 rounded-xl border transition-all",
            hasBalance 
              ? "bg-success/10 border-success/30" 
              : "bg-destructive/10 border-destructive/30"
          )}>
            <div className="flex items-center gap-2 mb-1">
              {hasBalance ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <AlertCircle className="w-4 h-4 text-destructive" />
              )}
              <span className="text-xs text-muted-foreground">Balance</span>
            </div>
            <p className="font-bold text-foreground">
              {contractBalanceFormatted} <span className="text-xs text-muted-foreground">{rewardTokenSymbol}</span>
            </p>
          </div>
        </div>

        {/* Estimated Stats */}
        {isFullyConfigured && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Daily Rewards</span>
              </div>
              <p className="font-semibold text-foreground">
                ~{dailyRewards.toFixed(2)} <span className="text-xs text-muted-foreground">{rewardTokenSymbol}</span>
              </p>
            </div>
            
            <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-accent" />
                <span className="text-xs text-muted-foreground">Days Remaining</span>
              </div>
              <p className="font-semibold text-foreground">
                ~{daysRemaining.toFixed(1)} <span className="text-xs text-muted-foreground">days</span>
              </p>
            </div>
          </div>
        )}

        {/* Update Function Status */}
        <div className={cn(
          "p-3 rounded-xl border",
          hasUpdateFunction 
            ? "bg-success/10 border-success/30" 
            : "bg-warning/10 border-warning/30"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasUpdateFunction ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <AlertCircle className="w-4 h-4 text-warning" />
              )}
              <span className="text-sm text-muted-foreground">
                {hasUpdateFunction 
                  ? "Update function available" 
                  : "No update function (set at deployment only)"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link to="/admin" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Zap className="w-4 h-4 mr-2" />
              Admin Panel
            </Button>
          </Link>
          <a 
            href={`${BLOCK_EXPLORER}/address/${CONTRACTS.FARMING}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Contract
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
});

RewardStatusCard.displayName = 'RewardStatusCard';
