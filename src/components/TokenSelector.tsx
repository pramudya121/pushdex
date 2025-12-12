import React, { useState } from 'react';
import { TOKEN_LIST, TokenInfo } from '@/config/contracts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TokenSelectorProps {
  selectedToken: TokenInfo;
  onSelect: (token: TokenInfo) => void;
  excludeToken?: TokenInfo;
  label?: string;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onSelect,
  excludeToken,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

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
      <DialogContent className="glass-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
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
                key={token.address || token.symbol}
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
                <div className="text-left">
                  <div className="font-semibold">{token.symbol}</div>
                  <div className="text-sm text-muted-foreground">{token.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
