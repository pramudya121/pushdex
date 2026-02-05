import React, { useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HoverGlowCard } from '@/components/ui/pushdex/hover-glow-card';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldX,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Lock,
  Unlock,
  Users,
  Coins,
  FileCode,
  Eye
} from 'lucide-react';

interface SecurityCheck {
  name: string;
  status: 'pass' | 'warning' | 'fail' | 'info';
  description: string;
  details?: string;
}

interface ScanResult {
  address: string;
  name: string;
  symbol: string;
  score: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  checks: SecurityCheck[];
  honeypot: boolean;
  taxBuy: number;
  taxSell: number;
  isVerified: boolean;
  hasProxy: boolean;
  ownershipRenounced: boolean;
  lpLocked: boolean;
  topHolders: { address: string; percentage: number }[];
}

const MOCK_SCAN_RESULT: ScanResult = {
  address: '0x2Bf9ae7D36f6D057fC84d7f3165E9EB870f2e2e7',
  name: 'PushDex Token',
  symbol: 'PSDX',
  score: 85,
  riskLevel: 'low',
  honeypot: false,
  taxBuy: 0,
  taxSell: 0,
  isVerified: true,
  hasProxy: false,
  ownershipRenounced: true,
  lpLocked: true,
  checks: [
    { name: 'Honeypot Check', status: 'pass', description: 'Token is not a honeypot', details: 'Sell function works normally' },
    { name: 'Contract Verified', status: 'pass', description: 'Source code is verified on explorer' },
    { name: 'No Proxy', status: 'pass', description: 'Contract does not use upgradeable proxy' },
    { name: 'Ownership Renounced', status: 'pass', description: 'Contract ownership has been renounced' },
    { name: 'LP Locked', status: 'pass', description: 'Liquidity is locked for 12 months' },
    { name: 'No Mint Function', status: 'pass', description: 'Token supply cannot be increased' },
    { name: 'Buy/Sell Tax', status: 'pass', description: 'No hidden taxes on transfers', details: 'Buy: 0% | Sell: 0%' },
    { name: 'Top Holder Concentration', status: 'warning', description: 'Top 10 holders own 45% of supply', details: 'Consider diversification risk' },
  ],
  topHolders: [
    { address: '0x742d...2bE68', percentage: 15.2 },
    { address: '0x8ba1...U8765', percentage: 8.5 },
    { address: '0x1234...5678', percentage: 6.3 },
  ],
};

const getStatusIcon = (status: SecurityCheck['status']) => {
  switch (status) {
    case 'pass': return <CheckCircle className="w-4 h-4 text-success" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
    case 'fail': return <XCircle className="w-4 h-4 text-destructive" />;
    case 'info': return <Info className="w-4 h-4 text-info" />;
  }
};

const getRiskColor = (risk: ScanResult['riskLevel']) => {
  switch (risk) {
    case 'safe': return 'text-success bg-success/10 border-success/30';
    case 'low': return 'text-success bg-success/10 border-success/30';
    case 'medium': return 'text-warning bg-warning/10 border-warning/30';
    case 'high': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
    case 'critical': return 'text-destructive bg-destructive/10 border-destructive/30';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  if (score >= 40) return 'text-orange-400';
  return 'text-destructive';
};

export const TokenSecurityScanner = memo(() => {
  const [address, setAddress] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  
  const handleScan = useCallback(async () => {
    if (!address) return;
    
    setIsScanning(true);
    setResult(null);
    
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Use mock result
    setResult({ ...MOCK_SCAN_RESULT, address });
    setIsScanning(false);
  }, [address]);

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="icon-container bg-gradient-to-br from-success/20 to-emerald-500/10">
            <Shield className="w-5 h-5 text-success" />
          </div>
          <div>
            <CardTitle className="text-xl">Token Security Scanner</CardTitle>
            <p className="text-sm text-muted-foreground">Check token safety before trading</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Search Input */}
        <div className="flex gap-3">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter token contract address (0x...)"
            className="flex-1 bg-surface border-border/60 font-mono text-sm"
          />
          <Button
            onClick={handleScan}
            disabled={isScanning || !address}
            className="bg-gradient-to-r from-primary to-accent"
          >
            {isScanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Scanning Animation */}
        <AnimatePresence mode="wait">
          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4"
              >
                <ShieldAlert className="w-full h-full text-primary" />
              </motion.div>
              <p className="text-muted-foreground">Scanning token security...</p>
              <Progress value={66} className="w-48 mx-auto mt-4" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Results */}
        <AnimatePresence mode="wait">
          {result && !isScanning && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Score Card */}
              <HoverGlowCard 
                className={`p-6 rounded-xl border ${getRiskColor(result.riskLevel)}`}
                glowColor={result.score >= 80 ? 'hsl(142, 76%, 46%)' : result.score >= 60 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 84%, 60%)'}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {result.score >= 80 ? (
                        <ShieldCheck className="w-8 h-8 text-success" />
                      ) : result.score >= 60 ? (
                        <ShieldAlert className="w-8 h-8 text-warning" />
                      ) : (
                        <ShieldX className="w-8 h-8 text-destructive" />
                      )}
                      <div>
                        <div className="font-bold text-lg">{result.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">{result.symbol}</div>
                      </div>
                    </div>
                    <Badge className={getRiskColor(result.riskLevel)}>
                      {result.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-5xl font-bold ${getScoreColor(result.score)}`}>
                      {result.score}
                    </div>
                    <div className="text-sm text-muted-foreground">Security Score</div>
                  </div>
                </div>
              </HoverGlowCard>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-surface/60 border border-border/40 text-center">
                  {result.honeypot ? (
                    <XCircle className="w-6 h-6 text-destructive mx-auto mb-1" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-success mx-auto mb-1" />
                  )}
                  <div className="text-xs text-muted-foreground">Honeypot</div>
                  <div className={`text-sm font-medium ${result.honeypot ? 'text-destructive' : 'text-success'}`}>
                    {result.honeypot ? 'Yes ⚠️' : 'No ✓'}
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-surface/60 border border-border/40 text-center">
                  {result.isVerified ? (
                    <Eye className="w-6 h-6 text-success mx-auto mb-1" />
                  ) : (
                    <Eye className="w-6 h-6 text-warning mx-auto mb-1" />
                  )}
                  <div className="text-xs text-muted-foreground">Verified</div>
                  <div className={`text-sm font-medium ${result.isVerified ? 'text-success' : 'text-warning'}`}>
                    {result.isVerified ? 'Yes ✓' : 'No'}
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-surface/60 border border-border/40 text-center">
                  {result.ownershipRenounced ? (
                    <Unlock className="w-6 h-6 text-success mx-auto mb-1" />
                  ) : (
                    <Lock className="w-6 h-6 text-warning mx-auto mb-1" />
                  )}
                  <div className="text-xs text-muted-foreground">Ownership</div>
                  <div className={`text-sm font-medium ${result.ownershipRenounced ? 'text-success' : 'text-warning'}`}>
                    {result.ownershipRenounced ? 'Renounced' : 'Active'}
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-surface/60 border border-border/40 text-center">
                  {result.lpLocked ? (
                    <Lock className="w-6 h-6 text-success mx-auto mb-1" />
                  ) : (
                    <Unlock className="w-6 h-6 text-warning mx-auto mb-1" />
                  )}
                  <div className="text-xs text-muted-foreground">LP Lock</div>
                  <div className={`text-sm font-medium ${result.lpLocked ? 'text-success' : 'text-warning'}`}>
                    {result.lpLocked ? 'Locked ✓' : 'Unlocked'}
                  </div>
                </div>
              </div>
              
              {/* Tax Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-surface/60 border border-border/40">
                  <div className="text-sm text-muted-foreground mb-1">Buy Tax</div>
                  <div className={`text-2xl font-bold ${result.taxBuy > 5 ? 'text-warning' : 'text-success'}`}>
                    {result.taxBuy}%
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-surface/60 border border-border/40">
                  <div className="text-sm text-muted-foreground mb-1">Sell Tax</div>
                  <div className={`text-2xl font-bold ${result.taxSell > 5 ? 'text-warning' : 'text-success'}`}>
                    {result.taxSell}%
                  </div>
                </div>
              </div>
              
              {/* Security Checks */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Security Checks</h4>
                <div className="space-y-2">
                  {result.checks.map((check, index) => (
                    <motion.div
                      key={check.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-surface/40 border border-border/30"
                    >
                      {getStatusIcon(check.status)}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{check.name}</div>
                        <div className="text-xs text-muted-foreground">{check.description}</div>
                        {check.details && (
                          <div className="text-xs text-muted-foreground/70 mt-1">{check.details}</div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Top Holders */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Top Holders
                </h4>
                <div className="space-y-2">
                  {result.topHolders.map((holder, index) => (
                    <div key={holder.address} className="flex items-center justify-between p-2 rounded bg-surface/40">
                      <span className="font-mono text-sm text-muted-foreground">
                        #{index + 1} {holder.address}
                      </span>
                      <Badge variant="outline">{holder.percentage.toFixed(1)}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Empty State */}
        {!result && !isScanning && (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Enter a token address to scan for security issues</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

TokenSecurityScanner.displayName = 'TokenSecurityScanner';
