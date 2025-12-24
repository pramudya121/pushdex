import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TOKEN_LIST, TokenInfo, RPC_URL } from '@/config/contracts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, Search, Loader2, Trash2, ExternalLink, Coins, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';
import { getImportedTokens, removeImportedToken, ImportToken } from './ImportToken';
import { BLOCK_EXPLORER } from '@/config/contracts';

interface TokenSelectorProps {
  selectedToken: TokenInfo;
  onSelect: (token: TokenInfo) => void;
  excludeToken?: TokenInfo;
  label?: string;
}

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onSelect,
  excludeToken,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'imported'>('all');
  const [importedTokens, setImportedTokens] = useState<TokenInfo[]>([]);
  const { address, isConnected } = useWallet();

  // Load imported tokens
  useEffect(() => {
    if (isOpen) {
      const tokens = getImportedTokens().map(t => ({
        ...t,
        logo: undefined,
        isImported: true,
      })) as TokenInfo[];
      setImportedTokens(tokens);
    }
  }, [isOpen]);

  // Combine all tokens
  const allTokens = useMemo(() => {
    const combined = [...TOKEN_LIST];
    importedTokens.forEach(imported => {
      if (!combined.some(t => t.address.toLowerCase() === imported.address.toLowerCase())) {
        combined.push(imported);
      }
    });
    return combined;
  }, [importedTokens]);

  const fetchBalances = useCallback(async () => {
    if (!address || !isConnected) {
      setBalances({});
      return;
    }

    setLoadingBalances(true);
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const balanceMap: Record<string, string> = {};

      // Fetch all balances in parallel
      const balancePromises = allTokens.map(async (token) => {
        try {
          let balance: bigint;
          
          if (token.address === '0x0000000000000000000000000000000000000000' || (token as any).isNative) {
            // Native token (PC)
            balance = await provider.getBalance(address);
          } else {
            // ERC20 token
            const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
            balance = await contract.balanceOf(address);
          }
          
          const formatted = ethers.formatUnits(balance, token.decimals);
          // Format to 4 decimal places
          const num = parseFloat(formatted);
          balanceMap[token.address || token.symbol] = num > 0 ? 
            (num < 0.0001 ? '<0.0001' : num.toFixed(4)) : '0';
        } catch (error) {
          console.error(`Error fetching balance for ${token.symbol}:`, error);
          balanceMap[token.address || token.symbol] = '0';
        }
      });

      await Promise.all(balancePromises);
      setBalances(balanceMap);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoadingBalances(false);
    }
  }, [address, isConnected, allTokens]);

  // Fetch balances when dialog opens
  useEffect(() => {
    if (isOpen && isConnected) {
      fetchBalances();
    }
  }, [isOpen, isConnected, fetchBalances]);

  const filteredTokens = useMemo(() => {
    let tokens = activeTab === 'imported' ? importedTokens : allTokens;
    
    return tokens.filter((token) => {
      if (excludeToken && token.address === excludeToken.address) return false;
      if (!search) return true;
      return (
        token.symbol.toLowerCase().includes(search.toLowerCase()) ||
        token.name.toLowerCase().includes(search.toLowerCase()) ||
        token.address.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [allTokens, importedTokens, activeTab, excludeToken, search]);

  const handleSelect = (token: TokenInfo) => {
    onSelect(token);
    setIsOpen(false);
    setSearch('');
  };

  const handleRemoveImported = (e: React.MouseEvent, tokenAddress: string) => {
    e.stopPropagation();
    removeImportedToken(tokenAddress);
    setImportedTokens(prev => prev.filter(t => t.address.toLowerCase() !== tokenAddress.toLowerCase()));
  };

  const handleTokenImported = () => {
    const tokens = getImportedTokens().map(t => ({
      ...t,
      logo: undefined,
      isImported: true,
    })) as TokenInfo[];
    setImportedTokens(tokens);
    fetchBalances();
  };

  const getTokenKey = (token: TokenInfo) => token.address || token.symbol;
  const isImportedToken = (token: TokenInfo) => (token as any).isImported === true;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface hover:bg-surface-hover border border-border hover:border-primary/30 transition-all duration-200 min-w-[140px]">
          {selectedToken.logo ? (
            <img 
              src={selectedToken.logo} 
              alt={selectedToken.symbol} 
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-pink flex items-center justify-center text-xs font-bold text-primary-foreground">
              {selectedToken.symbol.charAt(0)}
            </div>
          )}
          <span className="font-semibold">{selectedToken.symbol}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
        </button>
      </DialogTrigger>
      <DialogContent className="glass-card border-border max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Select Token</span>
            <ImportToken 
              onTokenImported={handleTokenImported}
              trigger={
                <Button variant="outline" size="sm" className="gap-2">
                  <Coins className="w-4 h-4" />
                  Import
                </Button>
              }
            />
          </DialogTitle>
          <DialogDescription className="sr-only">
            Choose a token from the list below
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, symbol, or address"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-surface border-border"
            />
          </div>

          {/* Tabs for All vs Imported */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'imported')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all" className="gap-2">
                <Star className="w-4 h-4" />
                All ({allTokens.length})
              </TabsTrigger>
              <TabsTrigger value="imported" className="gap-2">
                <Coins className="w-4 h-4" />
                Imported ({importedTokens.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {filteredTokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Coins className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {activeTab === 'imported' ? 'No imported tokens yet' : 'No tokens found'}
                </p>
                {activeTab === 'imported' && (
                  <p className="text-xs mt-1">Import a token using the button above</p>
                )}
              </div>
            ) : (
              filteredTokens.map((token) => (
                <button
                  key={getTokenKey(token)}
                  onClick={() => handleSelect(token)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group',
                    selectedToken.address === token.address
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-surface border border-transparent'
                  )}
                >
                  {token.logo ? (
                    <img 
                      src={token.logo} 
                      alt={token.symbol} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-pink flex items-center justify-center text-sm font-bold text-primary-foreground">
                      {token.symbol.charAt(0)}
                    </div>
                  )}
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{token.symbol}</span>
                      {isImportedToken(token) && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          Imported
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{token.name}</div>
                  </div>
                  
                  {/* Balance and actions */}
                  <div className="flex items-center gap-2">
                    {loadingBalances ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : isConnected ? (
                      <span className="text-sm text-muted-foreground">
                        {balances[getTokenKey(token)] || '0'}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                    
                    {isImportedToken(token) && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={`${BLOCK_EXPLORER}/token/${token.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded hover:bg-muted"
                        >
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </a>
                        <button
                          onClick={(e) => handleRemoveImported(e, token.address)}
                          className="p-1 rounded hover:bg-destructive/20"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
