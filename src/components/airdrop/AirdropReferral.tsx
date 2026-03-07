import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, Users, Gift, Check, Loader2 } from 'lucide-react';

interface Props {
  walletAddress: string | null;
  isConnected: boolean;
}

const generateCode = (addr: string) =>
  `PDX-${addr.slice(2, 8).toUpperCase()}`;

export const AirdropReferral: React.FC<Props> = ({ walletAddress, isConnected }) => {
  const [referralInput, setReferralInput] = useState('');
  const [applying, setApplying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [alreadyReferred, setAlreadyReferred] = useState(false);

  const myCode = walletAddress ? generateCode(walletAddress) : '';

  useEffect(() => {
    if (!walletAddress) return;
    const load = async () => {
      const [{ count: refCount }, { data: existing }] = await Promise.all([
        supabase
          .from('airdrop_referrals')
          .select('*', { count: 'exact', head: true })
          .eq('referrer_wallet', walletAddress.toLowerCase()),
        supabase
          .from('airdrop_referrals')
          .select('id')
          .eq('referred_wallet', walletAddress.toLowerCase())
          .limit(1),
      ]);
      setReferralCount(refCount || 0);
      setAlreadyReferred(!!(existing && existing.length > 0));
    };
    load();
  }, [walletAddress]);

  const handleCopy = () => {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
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
      // Find referrer by code pattern PDX-XXXXXX
      // We insert and let the DB handle duplicates
      const { error } = await supabase.from('airdrop_referrals').insert({
        referral_code: code,
        referrer_wallet: '0x' + code.replace('PDX-', '').toLowerCase() + '0'.repeat(34),
        referred_wallet: walletAddress.toLowerCase(),
        bonus_points: 5,
      });

      if (error) {
        if (error.code === '23505') {
          toast.info('You already used a referral code');
        } else {
          throw error;
        }
      } else {
        toast.success('+5 bonus points for you & your referrer! 🎉');
        setAlreadyReferred(true);
        setReferralInput('');
      }
    } catch {
      toast.error('Invalid referral code');
    } finally {
      setApplying(false);
    }
  };

  if (!isConnected) return null;

  return (
    <Card className="glass-card max-w-2xl mx-auto mb-8 sm:mb-10">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <span className="font-semibold">Referral Program</span>
          <Badge variant="outline" className="text-primary border-primary/30 text-xs">+5 pts each</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* My code */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Your Referral Code</label>
            <div className="flex gap-2">
              <Input value={myCode} readOnly className="font-mono text-sm" />
              <Button size="icon" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Gift className="w-3 h-3" /> {referralCount} referral{referralCount !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Apply code */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Enter a Referral Code</label>
            {alreadyReferred ? (
              <div className="flex items-center gap-2 h-10 px-3 rounded-md bg-success/10 border border-success/20 text-success text-sm">
                <Check className="w-4 h-4" /> Referral applied
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={referralInput}
                  onChange={e => setReferralInput(e.target.value)}
                  placeholder="PDX-XXXXXX"
                  className="font-mono text-sm uppercase"
                />
                <Button size="sm" onClick={handleApply} disabled={applying || !referralInput.trim()}>
                  {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
