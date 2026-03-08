import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Copy, Users, Gift, Check, Loader2, Share2, Sparkles } from 'lucide-react';

interface Props {
  walletAddress: string | null;
  isConnected: boolean;
}

export const AirdropReferral: React.FC<Props> = ({ walletAddress, isConnected }) => {
  const [referralInput, setReferralInput] = useState('');
  const [applying, setApplying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [myCode, setMyCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [alreadyReferred, setAlreadyReferred] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState<string | null>(null);

  // Fetch or create referral code
  const loadCode = useCallback(async () => {
    if (!walletAddress) return;
    setLoadingCode(true);
    try {
      const response = await supabase.functions.invoke('referral', {
        body: { action: 'get_code', wallet_address: walletAddress },
      });
      if (response.data?.code) {
        setMyCode(response.data.code);
      }
    } catch {
      // silent
    } finally {
      setLoadingCode(false);
    }
  }, [walletAddress]);

  // Load referral stats
  const loadStats = useCallback(async () => {
    if (!walletAddress) return;
    const wallet = walletAddress.toLowerCase();
    const [{ count: refCount }, { data: existing }] = await Promise.all([
      supabase
        .from('airdrop_referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_wallet', wallet),
      supabase
        .from('airdrop_referrals')
        .select('id, referrer_wallet, referral_code')
        .eq('referred_wallet', wallet)
        .limit(1),
    ]);
    setReferralCount(refCount || 0);
    if (existing && existing.length > 0) {
      setAlreadyReferred(true);
      const rw = existing[0].referrer_wallet;
      setReferrerInfo(`${rw.slice(0, 6)}...${rw.slice(-4)}`);
    }
  }, [walletAddress]);

  useEffect(() => {
    loadCode();
    loadStats();
  }, [loadCode, loadStats]);

  const handleCopy = () => {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const shareText = `Join PushDex Airdrop and earn bonus points! Use my referral code: ${myCode}\n\nhttps://pushdex.lovable.app/airdrop`;
    if (navigator.share) {
      navigator.share({ title: 'PushDex Referral', text: shareText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Share text copied to clipboard!');
    }
  };

  const handleApply = async () => {
    if (!isConnected || !walletAddress) {
      toast.error('Connect your wallet first');
      return;
    }
    const code = referralInput.trim().toUpperCase();
    if (!code) return;
    if (code === myCode) {
      toast.error("You can't refer yourself!");
      return;
    }
    if (alreadyReferred) {
      toast.info('You already used a referral code');
      return;
    }

    setApplying(true);
    try {
      const response = await supabase.functions.invoke('referral', {
        body: { action: 'apply_code', wallet_address: walletAddress, referral_code: code },
      });

      const data = response.data;

      if (data?.error) {
        if (data.already_referred) {
          setAlreadyReferred(true);
          toast.info('You already used a referral code');
        } else {
          toast.error(data.error);
        }
      } else if (data?.success) {
        toast.success(`+${data.bonus_points} bonus points for you & your referrer! 🎉`);
        setAlreadyReferred(true);
        setReferrerInfo(data.referrer);
        setReferralInput('');
        await loadStats();
      }
    } catch {
      toast.error('Failed to apply referral code');
    } finally {
      setApplying(false);
    }
  };

  if (!isConnected) return null;

  const totalBonusEarned = referralCount * 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="glass-card max-w-2xl mx-auto mb-8 sm:mb-10 overflow-hidden relative">
        {/* Decorative gradient */}
        {referralCount > 0 && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3" />
        )}

        <CardContent className="p-4 sm:p-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">Referral Program</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Invite friends & both earn 5 bonus points</p>
              </div>
            </div>
            {referralCount > 0 && (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs gap-1">
                <Sparkles className="w-3 h-3" /> {totalBonusEarned} pts earned
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* My code */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground">Your Referral Code</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    value={loadingCode ? 'Loading...' : myCode}
                    readOnly
                    className="font-mono text-sm tracking-wider pr-10"
                  />
                </div>
                <Button size="icon" variant="outline" onClick={handleCopy} disabled={!myCode} className="shrink-0">
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="outline" onClick={handleShare} disabled={!myCode} className="shrink-0">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Referral stats */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Gift className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium text-foreground">{referralCount}</span> referral{referralCount !== 1 ? 's' : ''}
                </div>
                {referralCount > 0 && (
                  <div className="text-xs text-muted-foreground">
                    • <span className="text-primary font-medium">+{totalBonusEarned}</span> bonus pts
                  </div>
                )}
              </div>
            </div>

            {/* Apply code */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground">Enter a Referral Code</label>
              {alreadyReferred ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-success/10 border border-success/20 text-success text-sm">
                    <Check className="w-4 h-4" /> Referral applied!
                  </div>
                  {referrerInfo && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Referred by <span className="font-mono text-foreground">{referrerInfo}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={referralInput}
                      onChange={e => setReferralInput(e.target.value.toUpperCase())}
                      placeholder="PDX-XXXXXX"
                      className="font-mono text-sm uppercase tracking-wider"
                      maxLength={10}
                    />
                    <Button
                      onClick={handleApply}
                      disabled={applying || !referralInput.trim()}
                      className="shrink-0 gap-1.5"
                    >
                      {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Ask a friend for their code to earn +5 bonus points each
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
