import React, { useState } from 'react';
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
import { Plus, Search, AlertTriangle, CheckCircle, Loader2, Coins } from 'lucide-react';

interface ImportedToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
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

export const ImportToken: React.FC<ImportTokenProps> = ({ onTokenImported, trigger }) => {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<ImportedToken | null>(null);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const resetState = () => {
    setAddress('');
    setTokenInfo(null);
    setError('');
    setLoading(false);
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetState();
    }
  };

  const searchToken = async () => {
    if (!address) {
      setError('Please enter a token address');
      return;
    }

    if (!ethers.isAddress(address)) {
      setError('Invalid address format');
      return;
    }

    setLoading(true);
    setError('');
    setTokenInfo(null);

    try {
      const provider = getReadProvider();
      const token = getTokenContract(address, provider);

      const [name, symbol, decimals] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals()
      ]);

      setTokenInfo({
        address: address,
        name,
        symbol,
        decimals: Number(decimals)
      });
    } catch (err) {
      console.error('Error fetching token:', err);
      setError('Could not fetch token information. Make sure this is a valid ERC20 token.');
    } finally {
      setLoading(false);
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
            <Label htmlFor="token-address">Token Address</Label>
            <div className="flex gap-2">
              <Input
                id="token-address"
                placeholder="0x..."
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setError('');
                  setTokenInfo(null);
                }}
                className="flex-1"
              />
              <Button 
                onClick={searchToken} 
                disabled={loading || !address}
                size="icon"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {tokenInfo && (
            <div className="p-4 rounded-xl bg-surface border border-border/50 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {tokenInfo.symbol.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{tokenInfo.name}</h4>
                    <Badge variant="secondary">{tokenInfo.symbol}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Decimals: {tokenInfo.decimals}
                  </p>
                </div>
              </div>
              
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {tokenInfo.address}
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <p className="text-xs text-yellow-500">
                  Anyone can create a token. Make sure you trust this token before trading.
                </p>
              </div>

              <Button onClick={handleImport} className="w-full gap-2">
                <CheckCircle className="w-4 h-4" />
                Import {tokenInfo.symbol}
              </Button>
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
