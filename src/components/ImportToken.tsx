import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';
import { getReadProvider, getTokenContract } from '@/lib/dex';
import { TOKEN_LIST } from '@/config/contracts';
import { Plus, Search, AlertTriangle, CheckCircle, Loader2, Coins, Shield, ShieldCheck, ShieldAlert, Copy, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BLOCK_EXPLORER } from '@/config/contracts';

interface ImportedToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
  totalSupply?: string;
  isVerified?: boolean;
}

interface ImportTokenProps {
  onTokenImported?: (token: ImportedToken) => void;
  trigger?: React.ReactNode;
}

const STORAGE_KEY = 'pushdex_imported_tokens';

export const getImportedTokens = (): ImportedToken[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveImportedToken = (token: ImportedToken) => {
  const tokens = getImportedTokens();
  const exists = tokens.some(t => t.address.toLowerCase() === token.address.toLowerCase());
  if (!exists) {
    tokens.push(token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  }
};

export const removeImportedToken = (address: string) => {
  const tokens = getImportedTokens();
  const filtered = tokens.filter(t => t.address.toLowerCase() !== address.toLowerCase());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// Check if token is in the default verified list
const isVerifiedToken = (address: string): boolean => {
  return TOKEN_LIST.some(t => t.address.toLowerCase() === address.toLowerCase());
};

export const ImportToken: React.FC<ImportTokenProps> = ({ onTokenImported, trigger }) => {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<ImportedToken | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setAddress('');
    setTokenInfo(null);
    setError('');
    setLoading(false);
    setCopied(false);
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetState();
    }
  };

  const searchToken = useCallback(async (tokenAddress: string) => {
    if (!tokenAddress) {
      setError('Please enter a token address');
      return;
    }

    // Clean the address (remove whitespace)
    const cleanAddress = tokenAddress.trim();

    if (!ethers.isAddress(cleanAddress)) {
      setError('Invalid address format. Please enter a valid Ethereum address.');
      return;
    }

    // Check if already in default list
    if (isVerifiedToken(cleanAddress)) {
      const existingToken = TOKEN_LIST.find(t => t.address.toLowerCase() === cleanAddress.toLowerCase());
      if (existingToken) {
        setTokenInfo({
          address: existingToken.address,
          name: existingToken.name,
          symbol: existingToken.symbol,
          decimals: existingToken.decimals,
          logo: existingToken.logo,
          isVerified: true,
        });
        return;
      }
    }

    // Check if already imported
    const alreadyImported = getImportedTokens().find(
      t => t.address.toLowerCase() === cleanAddress.toLowerCase()
    );
    if (alreadyImported) {
      setTokenInfo({ ...alreadyImported, isVerified: false });
      setError('This token is already in your list');
      return;
    }

    setLoading(true);
    setError('');
    setTokenInfo(null);

    try {
      const provider = getReadProvider();
      const token = getTokenContract(cleanAddress, provider);

      // Fetch token metadata with timeout
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const [name, symbol, decimals, totalSupply] = await Promise.race([
        Promise.all([
          token.name(),
          token.symbol(),
          token.decimals(),
          token.totalSupply().catch(() => null),
        ]),
        timeout,
      ]) as [string, string, bigint, bigint | null];

      // Validate the response
      if (!name || !symbol) {
        throw new Error('Invalid token contract - missing name or symbol');
      }

      const formattedSupply = totalSupply 
        ? ethers.formatUnits(totalSupply, Number(decimals))
        : undefined;

      setTokenInfo({
        address: cleanAddress,
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: formattedSupply,
        isVerified: false,
      });
    } catch (err: any) {
      console.error('Error fetching token:', err);
      if (err.message?.includes('timeout')) {
        setError('Request timed out. Please check your connection and try again.');
      } else {
        setError('Could not fetch token information. Make sure this is a valid ERC-20 token on Push Chain.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search when a valid address is pasted
  useEffect(() => {
    const trimmedAddress = address.trim();
    if (trimmedAddress.length === 42 && ethers.isAddress(trimmedAddress)) {
      searchToken(trimmedAddress);
    }
  }, [address, searchToken]);

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setError('');
    setTokenInfo(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setAddress(text);
    } catch {
      toast({
        title: 'Clipboard Error',
        description: 'Could not read from clipboard',
        variant: 'destructive',
      });
    }
  };

  const copyAddress = async () => {
    if (!tokenInfo) return;
    try {
      await navigator.clipboard.writeText(tokenInfo.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy address',
        variant: 'destructive',
      });
    }
  };

  const handleImport = () => {
    if (!tokenInfo) return;

    // Check if already imported
    const existing = getImportedTokens();
    if (existing.some(t => t.address.toLowerCase() === tokenInfo.address.toLowerCase())) {
      toast({
        title: 'Already Imported',
        description: `${tokenInfo.symbol} is already in your token list`,
        variant: 'destructive'
      });
      return;
    }

    saveImportedToken(tokenInfo);
    
    toast({
      title: 'Token Imported',
      description: `${tokenInfo.symbol} has been added to your token list`
    });

    onTokenImported?.(tokenInfo);
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Import Token
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Import Token
          </DialogTitle>
          <DialogDescription>
            Add a custom token by entering its contract address
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="token-address">Token Contract Address</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="token-address"
                  placeholder="0x..."
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  className={cn(
                    "pr-16",
                    loading && "animate-pulse"
                  )}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePaste}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  Paste
                </Button>
              </div>
              <Button 
                onClick={() => searchToken(address)} 
                disabled={loading || !address}
                size="icon"
                className="shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste a token contract address to automatically detect its details
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface/80 border border-border animate-pulse">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Token Info Display */}
          {tokenInfo && !loading && (
            <div className="p-4 rounded-xl bg-surface border border-border/50 space-y-4 animate-fade-in">
              {/* Token Header */}
              <div className="flex items-center gap-3">
                {tokenInfo.logo ? (
                  <img 
                    src={tokenInfo.logo} 
                    alt={tokenInfo.symbol}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center ring-2 ring-primary/20">
                    <span className="text-xl font-bold text-primary">
                      {tokenInfo.symbol.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold truncate">{tokenInfo.name}</h4>
                    <Badge variant="secondary" className="shrink-0">{tokenInfo.symbol}</Badge>
                    {tokenInfo.isVerified ? (
                      <Badge variant="outline" className="gap-1 text-success border-success/30 bg-success/10 shrink-0">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-warning border-warning/30 bg-warning/10 shrink-0">
                        <ShieldAlert className="w-3 h-3" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Decimals: {tokenInfo.decimals}
                    {tokenInfo.totalSupply && (
                      <span className="ml-2">• Supply: {Number(tokenInfo.totalSupply).toLocaleString()}</span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Contract Address */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <p className="text-xs font-mono text-muted-foreground break-all flex-1">
                  {tokenInfo.address}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={copyAddress}
                  >
                    {copied ? (
                      <CheckCircle className="w-3 h-3 text-success" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    )}
                  </Button>
                  <a
                    href={`${BLOCK_EXPLORER}/token/${tokenInfo.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </a>
                </div>
              </div>

              {/* Warning for unverified tokens */}
              {!tokenInfo.isVerified && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <Shield className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-yellow-500">Unverified Token</p>
                    <p className="text-xs text-yellow-500/80 mt-0.5">
                      Anyone can create a token with any name. Make sure you trust this token before trading.
                    </p>
                  </div>
                </div>
              )}

              {/* Verified token message */}
              {tokenInfo.isVerified && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                  <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                  <p className="text-xs text-success">
                    This token is on the verified token list.
                  </p>
                </div>
              )}

              {/* Import Button */}
              {!tokenInfo.isVerified && (
                <Button onClick={handleImport} className="w-full gap-2 bg-gradient-pink hover:opacity-90">
                  <CheckCircle className="w-4 h-4" />
                  Import {tokenInfo.symbol}
                </Button>
              )}

              {tokenInfo.isVerified && (
                <Button disabled className="w-full gap-2" variant="secondary">
                  <CheckCircle className="w-4 h-4" />
                  Already in Token List
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Component to manage imported tokens
export const ImportedTokensList: React.FC = () => {
  const [tokens, setTokens] = useState<ImportedToken[]>(getImportedTokens());
  const { toast } = useToast();

  const handleRemove = (address: string) => {
    removeImportedToken(address);
    setTokens(getImportedTokens());
    toast({
      title: 'Token Removed',
      description: 'Token has been removed from your list'
    });
  };

  if (tokens.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No imported tokens
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tokens.map((token) => (
        <div
          key={token.address}
          className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border/50"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {token.symbol.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm">{token.symbol}</p>
              <p className="text-xs text-muted-foreground">{token.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRemove(token.address)}
            className="text-muted-foreground hover:text-destructive"
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
};
