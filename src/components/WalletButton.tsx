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

// MetaMask Logo SVG
const MetaMaskLogo = () => (
  <svg width="32" height="32" viewBox="0 0 318.6 318.6" xmlns="http://www.w3.org/2000/svg">
    <path fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round" d="M274.1 35.5l-99.5 73.9L193 65.8z"/>
    <path fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" d="M44.4 35.5l98.7 74.6-17.5-44.3zm193.9 171.3l-26.5 40.6 56.7 15.6 16.3-55.3zm-204.4.9L50.1 263l56.7-15.6-26.5-40.6z"/>
    <path fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" d="M103.6 138.2l-15.8 23.9 56.3 2.5-2-60.5zm111.3 0l-39-34.8-1.3 61.2 56.2-2.5zM106.8 247.4l33.8-16.5-29.2-22.8zm71.1-16.5l33.9 16.5-4.7-39.3z"/>
    <path fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" d="M211.8 247.4l-33.9-16.5 2.7 22.1-.3 9.3zm-105 0l31.5 14.9-.2-9.3 2.5-22.1z"/>
    <path fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" d="M138.8 193.5l-28.2-8.3 19.9-9.1zm40.9 0l8.3-17.4 20 9.1z"/>
    <path fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round" d="M106.8 247.4l4.8-40.6-31.3.9zM207 206.8l4.8 40.6 26.5-39.7zm23.8-44.7l-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1zm-120.2 23.1l20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z"/>
    <path fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round" d="M87.8 162.1l23.6 46-.8-22.9zm120.3 23.1l-1 22.9 23.7-46zm-64-20.6l-5.3 28.9 6.6 34.1 1.5-44.9zm30.5 0l-2.7 18 1.2 45 6.7-34.1z"/>
    <path fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" d="M179.8 193.5l-6.7 34.1 4.8 3.3 29.2-22.8 1-22.9zm-69.2-8.3l.8 22.9 29.2 22.8 4.8-3.3-6.6-34.1z"/>
    <path fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round" d="M180.3 262.3l.3-9.3-2.5-2.2h-37.7l-2.3 2.2.2 9.3-31.5-14.9 11 9 22.3 15.5h38.3l22.4-15.5 11-9z"/>
    <path fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round" d="M177.9 230.9l-4.8-3.3h-27.7l-4.8 3.3-2.5 22.1 2.3-2.2h37.7l2.5 2.2z"/>
    <path fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round" d="M278.3 114.2l8.5-40.8-12.7-37.9-96.2 71.4 37 31.3 52.3 15.3 11.6-13.5-5-3.6 8-7.3-6.2-4.8 8-6.1zM31.8 73.4l8.5 40.8-5.4 4 8 6.1-6.1 4.8 8 7.3-5 3.6 11.5 13.5 52.3-15.3 37-31.3-96.2-71.4z"/>
    <path fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" d="M267.2 153.5l-52.3-15.3 15.9 23.9-23.7 46 31.2-.4h46.5zm-163.6-15.3l-52.3 15.3-17.4 54.2h46.4l31.1.4-23.6-46zm71 26.4l3.3-57.7 15.2-41.1h-67.5l15 41.1 3.5 57.7 1.2 18.2.1 44.8h27.7l.2-44.8z"/>
  </svg>
);

// OKX Wallet Logo SVG
const OKXLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="black"/>
    <path d="M18.6667 10.6667H13.3333V16H18.6667V10.6667Z" fill="white"/>
    <path d="M13.3333 16H8V21.3333H13.3333V16Z" fill="white"/>
    <path d="M24 16H18.6667V21.3333H24V16Z" fill="white"/>
  </svg>
);

// Rabby Wallet Logo SVG
const RabbyLogo = () => (
  <svg width="32" height="32" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="128" height="128" rx="24" fill="url(#rabby_gradient)"/>
    <path d="M95.4 51.6c-2.4-12.6-13.2-21.6-25.8-21.6H58.4c-12.6 0-23.4 9-25.8 21.6L24 94h16.8l4.8-24h36.8l4.8 24H104l-8.6-42.4z" fill="white"/>
    <circle cx="52" cy="58" r="8" fill="url(#rabby_gradient)"/>
    <circle cx="76" cy="58" r="8" fill="url(#rabby_gradient)"/>
    <defs>
      <linearGradient id="rabby_gradient" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8697FF"/>
        <stop offset="1" stopColor="#6B7AFF"/>
      </linearGradient>
    </defs>
  </svg>
);

// Bitget Wallet Logo SVG
const BitgetLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="url(#bitget_gradient)"/>
    <path d="M7 16l9-9 9 9-9 9-9-9z" fill="white"/>
    <path d="M16 12l4 4-4 4-4-4 4-4z" fill="url(#bitget_gradient)"/>
    <defs>
      <linearGradient id="bitget_gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00D2FF"/>
        <stop offset="1" stopColor="#00B4E6"/>
      </linearGradient>
    </defs>
  </svg>
);

const WALLETS = [
  {
    id: 'metamask' as const,
    name: 'MetaMask',
    icon: <MetaMaskLogo />,
    description: 'Connect using MetaMask',
  },
  {
    id: 'okx' as const,
    name: 'OKX Wallet',
    icon: <OKXLogo />,
    description: 'Connect using OKX Wallet',
  },
  {
    id: 'rabby' as const,
    name: 'Rabby Wallet',
    icon: <RabbyLogo />,
    description: 'Connect using Rabby',
  },
  {
    id: 'bitget' as const,
    name: 'Bitget Wallet',
    icon: <BitgetLogo />,
    description: 'Connect using Bitget Wallet',
  },
];

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

  const getWalletIcon = () => {
    const wallet = WALLETS.find(w => w.id === walletType);
    return wallet?.icon || <Wallet className="w-5 h-5" />;
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
                <div className="w-6 h-6 flex items-center justify-center">
                  {getWalletIcon()}
                </div>
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
              <DialogTitle className="flex items-center gap-3">
                <div className="w-8 h-8">{getWalletIcon()}</div>
                Wallet
              </DialogTitle>
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
              <div className="w-10 h-10 flex items-center justify-center">
                {wallet.icon}
              </div>
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
