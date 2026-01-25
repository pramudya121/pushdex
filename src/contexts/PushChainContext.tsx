import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { ethers } from 'ethers';
import { CHAIN_ID, PUSHCHAIN_CONFIG, RPC_URL } from '@/config/contracts';
import { toast } from 'sonner';

// Fallback RPC URLs for better reliability
const RPC_URLS = [
  RPC_URL,
  'https://rpc.push.org',
];

// PushChain Universal Wallet Types
interface PushChainAccount {
  address: string;
  chain: string;
  namespace: string;
}

interface UniversalSignerState {
  isInitialized: boolean;
  accounts: PushChainAccount[];
  activeAccount: PushChainAccount | null;
}

interface PushChainContextType {
  // Standard Wallet State
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  balance: string;
  walletType: string | null;
  
  // Universal Signer State
  universalSigner: UniversalSignerState;
  
  // Actions
  connect: (walletType: 'metamask' | 'okx' | 'rabby' | 'bitget' | 'pushchain') => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<boolean>;
  isCorrectNetwork: boolean;
  
  // Cross-chain Support
  signUniversalTransaction: (txData: any) => Promise<string | null>;
  getUniversalBalance: (chainId?: string) => Promise<string>;
}

const PushChainContext = createContext<PushChainContextType | undefined>(undefined);

export const PushChainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [balance, setBalance] = useState('0');
  const [walletType, setWalletType] = useState<string | null>(null);
  const [universalSigner, setUniversalSigner] = useState<UniversalSignerState>({
    isInitialized: false,
    accounts: [],
    activeAccount: null,
  });

  // Refs for cleanup and retry logic
  const balanceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rpcRetryCountRef = useRef(0);
  const maxRetries = 3;

  const isConnected = !!address;
  const isCorrectNetwork = chainId === CHAIN_ID;

  // Get wallet provider based on type
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
      case 'pushchain':
        // PushChain Universal Signer - uses injected provider
        return win.ethereum;
      default:
        return win.ethereum;
    }
  };

  // Update balance with retry logic and error handling
  const updateBalance = useCallback(async (provider: ethers.BrowserProvider, address: string) => {
    try {
      const bal = await provider.getBalance(address);
      setBalance(ethers.formatEther(bal));
      rpcRetryCountRef.current = 0; // Reset retry count on success
    } catch (error: any) {
      // Only log error once after max retries to avoid spam
      if (rpcRetryCountRef.current < maxRetries) {
        rpcRetryCountRef.current++;
        // Silent retry - don't spam console
      } else if (rpcRetryCountRef.current === maxRetries) {
        console.warn('Balance fetch temporarily unavailable - will retry');
        rpcRetryCountRef.current++; // Prevent repeated warnings
      }
    }
  }, []);

  // Switch to PushChain network
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

  // Initialize Universal Signer for cross-chain support
  const initializeUniversalSigner = useCallback(async (address: string) => {
    try {
      // Simulate Universal Signer initialization
      // In production, this would connect to @pushchain/core SDK
      const universalAccount: PushChainAccount = {
        address: address,
        chain: 'pushchain',
        namespace: 'evm',
      };

      setUniversalSigner({
        isInitialized: true,
        accounts: [universalAccount],
        activeAccount: universalAccount,
      });

      console.log('Universal Signer initialized for:', address);
    } catch (error) {
      console.error('Failed to initialize Universal Signer:', error);
    }
  }, []);

  // Connect wallet
  const connect = useCallback(async (type: 'metamask' | 'okx' | 'rabby' | 'bitget' | 'pushchain') => {
    setIsConnecting(true);
    try {
      const walletProvider = getWalletProvider(type);
      
      if (!walletProvider) {
        const walletNames: Record<string, string> = {
          metamask: 'MetaMask',
          okx: 'OKX Wallet',
          rabby: 'Rabby Wallet',
          bitget: 'Bitget Wallet',
          pushchain: 'Any EVM Wallet',
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
      
      // Initialize Universal Signer for cross-chain support
      await initializeUniversalSigner(account);

      if (Number(network.chainId) !== CHAIN_ID) {
        toast.warning('Please switch to Push Testnet for full functionality');
      } else {
        toast.success('Wallet connected with Universal Signer!');
      }

      // Setup listeners
      walletProvider.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAddress(accounts[0]);
          updateBalance(ethersProvider, accounts[0]);
          initializeUniversalSigner(accounts[0]);
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
  }, [updateBalance, initializeUniversalSigner]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setBalance('0');
    setWalletType(null);
    setUniversalSigner({
      isInitialized: false,
      accounts: [],
      activeAccount: null,
    });
    localStorage.removeItem('pushdex_wallet_type');
    toast.success('Wallet disconnected');
  }, []);

  // Sign Universal Transaction (cross-chain)
  const signUniversalTransaction = useCallback(async (txData: any): Promise<string | null> => {
    if (!signer || !universalSigner.isInitialized) {
      toast.error('Universal Signer not initialized');
      return null;
    }

    try {
      // For now, use standard signer - in production would use PushChain SDK
      const tx = await signer.sendTransaction(txData);
      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Universal transaction failed:', error);
      toast.error(error.message || 'Transaction failed');
      return null;
    }
  }, [signer, universalSigner]);

  // Get Universal Balance (supports multiple chains) with retry logic
  const getUniversalBalance = useCallback(async (chainId?: string): Promise<string> => {
    if (!address) return '0';
    
    // Try each RPC URL until one works
    for (const rpcUrl of RPC_URLS) {
      try {
        const rpcProvider = new ethers.JsonRpcProvider(rpcUrl);
        const bal = await rpcProvider.getBalance(address);
        return ethers.formatEther(bal);
      } catch (error) {
        // Try next RPC
        continue;
      }
    }
    
    // All RPCs failed
    return balance; // Return cached balance
  }, [address, balance]);

  // Auto-connect if previously connected
  useEffect(() => {
    const savedWalletType = localStorage.getItem('pushdex_wallet_type');
    if (savedWalletType) {
      connect(savedWalletType as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save wallet type
  useEffect(() => {
    if (walletType) {
      localStorage.setItem('pushdex_wallet_type', walletType);
    }
  }, [walletType]);

  // Update balance periodically with proper cleanup
  useEffect(() => {
    if (provider && address) {
      // Clear any existing interval
      if (balanceIntervalRef.current) {
        clearInterval(balanceIntervalRef.current);
      }
      
      // Initial fetch
      updateBalance(provider, address);
      
      // Set up interval
      balanceIntervalRef.current = setInterval(() => {
        updateBalance(provider, address);
      }, 30000); // Increased to 30s to reduce RPC load
      
      return () => {
        if (balanceIntervalRef.current) {
          clearInterval(balanceIntervalRef.current);
          balanceIntervalRef.current = null;
        }
      };
    }
  }, [provider, address, updateBalance]);

  return (
    <PushChainContext.Provider
      value={{
        address,
        isConnected,
        isConnecting,
        chainId,
        provider,
        signer,
        balance,
        walletType,
        universalSigner,
        connect,
        disconnect,
        switchNetwork,
        isCorrectNetwork,
        signUniversalTransaction,
        getUniversalBalance,
      }}
    >
      {children}
    </PushChainContext.Provider>
  );
};

export const usePushChain = () => {
  const context = useContext(PushChainContext);
  if (context === undefined) {
    throw new Error('usePushChain must be used within a PushChainProvider');
  }
  return context;
};

// Backward compatibility hook - maps to old useWallet interface
export const useWallet = () => {
  const context = usePushChain();
  return {
    address: context.address,
    isConnected: context.isConnected,
    isConnecting: context.isConnecting,
    chainId: context.chainId,
    provider: context.provider,
    signer: context.signer,
    balance: context.balance,
    walletType: context.walletType,
    connect: context.connect,
    disconnect: context.disconnect,
    switchNetwork: context.switchNetwork,
    isCorrectNetwork: context.isCorrectNetwork,
  };
};
