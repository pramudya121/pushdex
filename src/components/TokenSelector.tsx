import React, { useState, useEffect, useCallback } from 'react';
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
import { ChevronDown, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWallet } from '@/contexts/WalletContext';
import { ethers } from 'ethers';

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
  const { address, isConnected } = useWallet();

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
      const balancePromises = TOKEN_LIST.map(async (token) => {
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
  }, [address, isConnected]);

  // Fetch balances when dialog opens
  useEffect(() => {
    if (isOpen && isConnected) {
      fetchBalances();
    }
  }, [isOpen, isConnected, fetchBalances]);

  const filteredTokens = TOKEN_LIST.filter((token) => {
    if (excludeToken && token.address === excludeToken.address) return false;
    if (!search) return true;
    return (
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleSelect = (token: TokenInfo) => {
    onSelect(token);
    setIsOpen(false);
    setSearch('');
  };

  const getTokenKey = (token: TokenInfo) => token.address || token.symbol;

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
          <DialogTitle>Select Token</DialogTitle>
          <DialogDescription className="sr-only">
            Choose a token from the list below
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or symbol"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-surface border-border"
            />
          </div>
          
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {filteredTokens.map((token) => (
              <button
                key={getTokenKey(token)}
                onClick={() => handleSelect(token)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200',
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
                <div className="text-left flex-1">
                  <div className="font-semibold">{token.symbol}</div>
                  <div className="text-sm text-muted-foreground">{token.name}</div>
                </div>
                {/* Balance display */}
                <div className="text-right">
                  {loadingBalances ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : isConnected ? (
                    <span className="text-sm text-muted-foreground">
                      {balances[getTokenKey(token)] || '0'}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
