import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { CHAIN_ID, PUSHCHAIN_CONFIG, RPC_URL } from '@/config/contracts';
import { toast } from 'sonner';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  balance: string;
  walletType: string | null;
  connect: (walletType: 'metamask' | 'okx' | 'rabby' | 'bitget') => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<boolean>;
  isCorrectNetwork: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [balance, setBalance] = useState('0');
  const [walletType, setWalletType] = useState<string | null>(null);

  const isConnected = !!address;
  const isCorrectNetwork = chainId === CHAIN_ID;

  const getWalletProvider = (type: string): any => {
    const win = window as any;
    switch (type) {
      case 'metamask':
        return win.ethereum?.isMetaMask ? win.ethereum : null;
      case 'okx':
        return win.okxwallet;
      case 'rabby':
        return win.rabby || (win.ethereum?.isRabby ? win.ethereum : null);
      case 'bitget':
        return win.bitkeep?.ethereum;
      default:
        return win.ethereum;
    }
  };

  const updateBalance = useCallback(async (provider: ethers.BrowserProvider, address: string) => {
    try {
      const bal = await provider.getBalance(address);
      setBalance(ethers.formatEther(bal));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  }, []);

  const switchNetwork = useCallback(async (): Promise<boolean> => {
    const walletProvider = getWalletProvider(walletType || 'metamask');
    if (!walletProvider) return false;

    try {
      await walletProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: PUSHCHAIN_CONFIG.chainId }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await walletProvider.request({
            method: 'wallet_addEthereumChain',
            params: [PUSHCHAIN_CONFIG],
          });
          return true;
        } catch (addError) {
          console.error('Failed to add network:', addError);
          toast.error('Failed to add Push Testnet network');
          return false;
        }
      }
      console.error('Failed to switch network:', switchError);
      toast.error('Failed to switch network');
      return false;
    }
  }, [walletType]);

  const connect = useCallback(async (type: 'metamask' | 'okx' | 'rabby' | 'bitget') => {
    setIsConnecting(true);
    try {
      const walletProvider = getWalletProvider(type);
      
      if (!walletProvider) {
        const walletNames = {
          metamask: 'MetaMask',
          okx: 'OKX Wallet',
          rabby: 'Rabby Wallet',
          bitget: 'Bitget Wallet',
        };
        toast.error(`${walletNames[type]} not detected. Please install it.`);
        return;
      }

      const accounts = await walletProvider.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      
      const ethersProvider = new ethers.BrowserProvider(walletProvider);
      const network = await ethersProvider.getNetwork();
      const ethersSigner = await ethersProvider.getSigner();

      setAddress(account);
      setChainId(Number(network.chainId));
      setProvider(ethersProvider);
      setSigner(ethersSigner);
      setWalletType(type);

      await updateBalance(ethersProvider, account);

      if (Number(network.chainId) !== CHAIN_ID) {
        toast.warning('Please switch to Push Testnet');
      } else {
        toast.success('Wallet connected successfully!');
      }

      // Setup listeners
      walletProvider.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAddress(accounts[0]);
          updateBalance(ethersProvider, accounts[0]);
        }
      });

      walletProvider.on('chainChanged', (chainIdHex: string) => {
        setChainId(parseInt(chainIdHex, 16));
      });

    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [updateBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setBalance('0');
    setWalletType(null);
    toast.success('Wallet disconnected');
  }, []);

  // Auto-connect if previously connected
  useEffect(() => {
    const savedWalletType = localStorage.getItem('pushdex_wallet_type');
    if (savedWalletType) {
      connect(savedWalletType as any);
    }
  }, []);

  // Save wallet type
  useEffect(() => {
    if (walletType) {
      localStorage.setItem('pushdex_wallet_type', walletType);
    } else {
      localStorage.removeItem('pushdex_wallet_type');
    }
  }, [walletType]);

  // Update balance periodically
  useEffect(() => {
    if (provider && address) {
      const interval = setInterval(() => {
        updateBalance(provider, address);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [provider, address, updateBalance]);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        isConnecting,
        chainId,
        provider,
        signer,
        balance,
        walletType,
        connect,
        disconnect,
        switchNetwork,
        isCorrectNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
