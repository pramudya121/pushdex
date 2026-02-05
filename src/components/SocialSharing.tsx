import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Share2, 
  Twitter, 
  MessageCircle,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SocialSharingProps {
  type: 'swap' | 'liquidity' | 'stake' | 'farm' | 'trade';
  data: {
    tokenIn?: string;
    tokenOut?: string;
    amountIn?: string;
    amountOut?: string;
    profit?: string;
    apy?: string;
    poolName?: string;
  };
  className?: string;
}

export const SocialSharing = memo(({ type, data, className = '' }: SocialSharingProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const generateShareText = () => {
    switch (type) {
      case 'swap':
        return `🔄 Just swapped ${data.amountIn} ${data.tokenIn} for ${data.amountOut} ${data.tokenOut} on @PushDex! 🚀\n\nThe best DEX on Push Chain ⚡\n\n#DeFi #PushChain #PUSHDEX`;
      case 'liquidity':
        return `💧 Added liquidity to ${data.poolName} pool on @PushDex!\n\nEarning trading fees automatically 📈\n\n#DeFi #LiquidityProvider #PushChain`;
      case 'stake':
        return `🔒 Staking on @PushDex with ${data.apy} APY! 💰\n\nSecure your tokens and earn rewards ✨\n\n#Staking #DeFi #PushChain`;
      case 'farm':
        return `🌾 Yield farming on @PushDex!\n\nEarning ${data.apy} APY in the ${data.poolName} farm 🚜\n\n#YieldFarming #DeFi #PushChain`;
      case 'trade':
        return `📊 Made a ${data.profit} profit trade on @PushDex! 🎯\n\nTrade smarter, not harder ⚡\n\n#Trading #DeFi #PushChain`;
      default:
        return `Trading on @PushDex - The best DEX on Push Chain! 🚀\n\n#DeFi #PushChain`;
    }
  };

  const shareUrl = 'https://pushdex.lovable.app';
  const shareText = generateShareText();

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const shareToTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareToDiscord = () => {
    // Discord doesn't have a direct share URL, so copy to clipboard
    copyToClipboard();
    toast({
      title: "Copied to clipboard!",
      description: "Paste in Discord to share",
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Share text copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PUSHDEX Trade',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={`gap-2 ${className}`}
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-card border-border/40">
        <DropdownMenuItem onClick={shareToTwitter} className="gap-3 cursor-pointer">
          <Twitter className="w-4 h-4 text-[#1DA1F2]" />
          Twitter
          <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToTelegram} className="gap-3 cursor-pointer">
          <MessageCircle className="w-4 h-4 text-[#0088cc]" />
          Telegram
          <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToDiscord} className="gap-3 cursor-pointer">
          <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          Discord
          <Copy className="w-3 h-3 ml-auto text-muted-foreground" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard} className="gap-3 cursor-pointer">
          {copied ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? 'Copied!' : 'Copy Link'}
        </DropdownMenuItem>
        {navigator.share && (
          <DropdownMenuItem onClick={nativeShare} className="gap-3 cursor-pointer">
            <Share2 className="w-4 h-4" />
            More Options
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

SocialSharing.displayName = 'SocialSharing';
