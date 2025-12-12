import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { shortenAddress } from '@/lib/dex';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { BLOCK_EXPLORER, CHAIN_NAME } from '@/config/contracts';

const WALLETS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    description: 'Connect using MetaMask',
  },
  {
    id: 'okx',
    name: 'OKX Wallet',
    icon: '⬛',
    description: 'Connect using OKX Wallet',
  },
  {
    id: 'rabby',
    name: 'Rabby Wallet',
    icon: '🐰',
    description: 'Connect using Rabby',
  },
  {
    id: 'bitget',
    name: 'Bitget Wallet',
    icon: '💎',
    description: 'Connect using Bitget Wallet',
  },
] as const;

export const WalletButton: React.FC = () => {
  const { 
    address, 
    isConnected, 
    isConnecting, 
    connect, 
    disconnect, 
    balance, 
    isCorrectNetwork,
    switchNetwork,
    walletType,
  } = useWallet();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleConnect = async (walletId: 'metamask' | 'okx' | 'rabby' | 'bitget') => {
    await connect(walletId);
    setIsOpen(false);
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  const openExplorer = () => {
    if (address) {
      window.open(`${BLOCK_EXPLORER}/address/${address}`, '_blank');
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {!isCorrectNetwork && (
          <Button
            variant="destructive"
            size="sm"
            onClick={switchNetwork}
            className="gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Wrong Network
          </Button>
        )}
        
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 bg-card/50 border-border hover:bg-card hover:border-primary/30"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="hidden sm:inline font-medium">
                  {parseFloat(balance).toFixed(4)} PC
                </span>
                <span className="font-mono">{shortenAddress(address)}</span>
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border">
            <DialogHeader>
              <DialogTitle>Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Connected with {walletType}</span>
                  <div className="w-2 h-2 rounded-full bg-success" />
                </div>
                <div className="font-mono text-lg">{shortenAddress(address, 6)}</div>
              </div>
              
              <div className="p-4 rounded-xl bg-surface border border-border">
                <div className="text-sm text-muted-foreground mb-1">Balance</div>
                <div className="text-2xl font-bold">{parseFloat(balance).toFixed(4)} PC</div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={copyAddress}
                >
                  <Copy className="w-4 h-4" />
                  Copy Address
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={openExplorer}
                >
                  <ExternalLink className="w-4 h-4" />
                  Explorer
                </Button>
              </div>
              
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={() => {
                  disconnect();
                  setShowDetails(false);
                }}
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="gap-2 bg-gradient-pink hover:opacity-90 text-primary-foreground font-semibold"
          disabled={isConnecting}
        >
          <Wallet className="w-4 h-4" />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Connect Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {WALLETS.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleConnect(wallet.id)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface hover:bg-surface-hover border border-border hover:border-primary/30 transition-all duration-200 group"
              disabled={isConnecting}
            >
              <span className="text-2xl">{wallet.icon}</span>
              <div className="text-left">
                <div className="font-semibold group-hover:text-primary transition-colors">
                  {wallet.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {wallet.description}
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground text-center">
          By connecting, you agree to the Terms of Service and Privacy Policy
        </div>
      </DialogContent>
    </Dialog>
  );
};
