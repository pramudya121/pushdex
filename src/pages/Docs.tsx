import React from 'react';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Code, 
  Layers, 
  Shield, 
  Zap, 
  Globe,
  GitBranch,
  Box,
  CheckCircle,
  Circle,
  ArrowRight,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const CONTRACTS = {
  FACTORY: '0xBB3B44EB672650Fb4a1Cf6D9dc5d3b7494F333AB',
  ROUTER: '0xF143eCFE3DFEEB4ae188cA4f1c7c7ab0b5F592eb',
  WETH: '0x5b0AE944A4Ee6241a5A638C440A0dCD42411bD3C',
  MULTICALL: '0x98cA063a7066Ae68B395ad49B9f05F2Df510d6B5',
  LIBRARY: '0xEa71393074fFCB6d132B8a2b6028CAF952af03A5',
};

const TOKENS = {
  ETH: '0x70af1341F5D5c60F913F6a21C669586C38592510',
  BNB: '0x68F2458954032952d2ddd5D8Ee1d671e6E93Ae6C',
  PSDX: '0x2Bf9ae7D36f6D057fC84d7f3165E9EB870f2e2e7',
};

const PHASES = [
  {
    phase: 1,
    title: 'Core Infrastructure',
    status: 'completed',
    items: [
      { name: 'UniswapV2Factory deployment', done: true },
      { name: 'UniswapV2Router02 deployment', done: true },
      { name: 'WETH9 contract deployment', done: true },
      { name: 'Multicall contract deployment', done: true },
      { name: 'UniswapV2Library deployment', done: true },
      { name: 'Smart contract testing', done: true },
    ]
  },
  {
    phase: 2,
    title: 'Core Functions',
    status: 'completed',
    items: [
      { name: 'Token swap functionality', done: true },
      { name: 'Add liquidity feature', done: true },
      { name: 'Remove liquidity feature', done: true },
      { name: 'Pool creation', done: true },
      { name: 'Wrap/Unwrap PC tokens', done: true },
    ]
  },
  {
    phase: 3,
    title: 'Frontend Integration',
    status: 'completed',
    items: [
      { name: 'Wallet connection (MetaMask, OKX, Rabby, Bitget)', done: true },
      { name: 'On-chain transaction execution', done: true },
      { name: 'Real-time balance display', done: true },
      { name: 'Token selector with logos', done: true },
      { name: 'Slippage & deadline settings', done: true },
    ]
  },
  {
    phase: 4,
    title: 'Analytics & Data',
    status: 'completed',
    items: [
      { name: 'Pool analytics page', done: true },
      { name: 'TVL calculations', done: true },
      { name: 'Volume tracking', done: true },
      { name: 'Price charts', done: true },
      { name: 'Transaction history', done: true },
    ]
  },
  {
    phase: 5,
    title: 'UX Polish',
    status: 'completed',
    items: [
      { name: 'Responsive design', done: true },
      { name: 'Animations & transitions', done: true },
      { name: 'Error handling', done: true },
      { name: 'Loading states', done: true },
      { name: 'Toast notifications', done: true },
    ]
  },
  {
    phase: 6,
    title: 'Finalization',
    status: 'completed',
    items: [
      { name: 'Security review', done: true },
      { name: 'CI/CD pipeline', done: true },
      { name: 'Documentation', done: true },
      { name: 'Mainnet deployment', done: false },
    ]
  },
];

const TECH_STACK = [
  {
    category: 'Blockchain',
    items: [
      { name: 'Pushchain Testnet', description: 'Layer 1 blockchain for high-speed transactions' },
      { name: 'Ethers.js v6', description: 'Complete Ethereum library for blockchain interaction' },
      { name: 'Uniswap V2 Protocol', description: 'Battle-tested AMM design pattern' },
    ]
  },
  {
    category: 'Frontend',
    items: [
      { name: 'React 18', description: 'Modern UI library with concurrent features' },
      { name: 'TypeScript', description: 'Type-safe JavaScript for better DX' },
      { name: 'Vite', description: 'Next-generation frontend build tool' },
      { name: 'Tailwind CSS', description: 'Utility-first CSS framework' },
      { name: 'shadcn/ui', description: 'Beautiful, accessible component library' },
    ]
  },
  {
    category: 'State & Data',
    items: [
      { name: 'React Query', description: 'Powerful data fetching and caching' },
      { name: 'React Context', description: 'Global state management for wallet' },
      { name: 'Multicall', description: 'Batch multiple blockchain calls' },
    ]
  },
];

const Docs = () => {
  const [copiedContract, setCopiedContract] = useState<string | null>(null);

  const copyAddress = (address: string, name: string) => {
    navigator.clipboard.writeText(address);
    setCopiedContract(name);
    toast.success(`${name} address copied!`);
    setTimeout(() => setCopiedContract(null), 2000);
  };

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]';
      case 'in-progress': return 'bg-primary/20 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <Header />
      
      <main className="relative z-10 pt-32 md:pt-24 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12 animate-fade-in">
            <Badge variant="secondary" className="mb-4">
              <BookOpen className="w-3 h-3 mr-1" />
              Documentation
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">PUSHDEX</span> Documentation
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A decentralized exchange built on Pushchain testnet, powered by the proven Uniswap V2 protocol
            </p>
          </div>

          <Tabs defaultValue="overview" className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="overview" className="gap-2">
                <Globe className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="technology" className="gap-2">
                <Code className="w-4 h-4" />
                Technology
              </TabsTrigger>
              <TabsTrigger value="contracts" className="gap-2">
                <Box className="w-4 h-4" />
                Contracts
              </TabsTrigger>
              <TabsTrigger value="roadmap" className="gap-2">
                <GitBranch className="w-4 h-4" />
                Roadmap
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <Card className="glass-card p-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-primary" />
                  What is PUSHDEX?
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  PUSHDEX is a decentralized exchange (DEX) built on the Pushchain testnet. It implements the 
                  Uniswap V2 automated market maker (AMM) protocol, allowing users to swap tokens, provide 
                  liquidity to earn trading fees, and create new trading pairs - all without intermediaries.
                </p>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <h3 className="font-semibold mb-2">🔄 Token Swaps</h3>
                    <p className="text-sm text-muted-foreground">
                      Exchange tokens instantly using automated liquidity pools with competitive rates
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <h3 className="font-semibold mb-2">💧 Liquidity Provision</h3>
                    <p className="text-sm text-muted-foreground">
                      Provide liquidity to pools and earn 0.3% fees on every trade
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <h3 className="font-semibold mb-2">🏊 Pool Creation</h3>
                    <p className="text-sm text-muted-foreground">
                      Create new trading pairs and bootstrap liquidity for any token
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="glass-card p-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-primary" />
                  How It Works
                </h2>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Connect Wallet</h3>
                      <p className="text-muted-foreground text-sm">
                        Connect your MetaMask, OKX, Rabby, or Bitget wallet to the Pushchain testnet
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Select Tokens</h3>
                      <p className="text-muted-foreground text-sm">
                        Choose the tokens you want to swap or provide as liquidity
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Approve & Execute</h3>
                      <p className="text-muted-foreground text-sm">
                        Approve token spending (one-time) and confirm the transaction in your wallet
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[hsl(var(--success))]/20 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--success))]" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Transaction Complete</h3>
                      <p className="text-muted-foreground text-sm">
                        Your swap is executed or liquidity is added to the pool
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="glass-card p-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Layers className="w-6 h-6 text-primary" />
                  Network Information
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="text-sm text-muted-foreground mb-1">Network Name</div>
                    <div className="font-semibold">Push Testnet Donut</div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="text-sm text-muted-foreground mb-1">RPC URL</div>
                    <div className="font-mono text-sm">evm.donut.rpc.push.org</div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="text-sm text-muted-foreground mb-1">Chain ID</div>
                    <div className="font-semibold">42101</div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="text-sm text-muted-foreground mb-1">Native Token</div>
                    <div className="font-semibold">PC (Push Coin)</div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50 md:col-span-2">
                    <div className="text-sm text-muted-foreground mb-1">Block Explorer</div>
                    <a 
                      href="https://donut.push.network" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      donut.push.network
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Technology Tab */}
            <TabsContent value="technology" className="space-y-6">
              {TECH_STACK.map((category, i) => (
                <Card key={category.category} className="glass-card p-6" style={{ animationDelay: `${i * 0.1}s` }}>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Code className="w-5 h-5 text-primary" />
                    {category.category}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.items.map((item) => (
                      <div key={item.name} className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                        <div className="font-semibold mb-1">{item.name}</div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}

              <Card className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Security Features
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--success))] mt-0.5" />
                    <div>
                      <div className="font-semibold">Non-Custodial</div>
                      <p className="text-sm text-muted-foreground">Users maintain full control of their funds at all times</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--success))] mt-0.5" />
                    <div>
                      <div className="font-semibold">Immutable Contracts</div>
                      <p className="text-sm text-muted-foreground">Core contracts are non-upgradeable and fully transparent</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--success))] mt-0.5" />
                    <div>
                      <div className="font-semibold">Slippage Protection</div>
                      <p className="text-sm text-muted-foreground">Configurable slippage tolerance to protect against price changes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--success))] mt-0.5" />
                    <div>
                      <div className="font-semibold">Transaction Deadlines</div>
                      <p className="text-sm text-muted-foreground">Automatic transaction expiry to prevent stale transactions</p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Contracts Tab */}
            <TabsContent value="contracts" className="space-y-6">
              <Card className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Box className="w-5 h-5 text-primary" />
                  Core Contracts
                </h3>
                <p className="text-muted-foreground mb-6">
                  All contracts are deployed and verified on Pushchain testnet
                </p>
                
                <div className="space-y-4">
                  {Object.entries(CONTRACTS).map(([name, address]) => (
                    <div key={name} className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{name.replace('_', ' ')}</div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => copyAddress(address, name)}
                            className="p-1.5 rounded hover:bg-secondary transition-colors"
                          >
                            {copiedContract === name ? (
                              <Check className="w-4 h-4 text-[hsl(var(--success))]" />
                            ) : (
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                          <a 
                            href={`https://donut.push.network/address/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-secondary transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </a>
                        </div>
                      </div>
                      <div className="font-mono text-sm text-muted-foreground break-all">{address}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Token Contracts
                </h3>
                
                <div className="space-y-4">
                  {Object.entries(TOKENS).map(([name, address]) => (
                    <div key={name} className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{name}</div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => copyAddress(address, name)}
                            className="p-1.5 rounded hover:bg-secondary transition-colors"
                          >
                            {copiedContract === name ? (
                              <Check className="w-4 h-4 text-[hsl(var(--success))]" />
                            ) : (
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                          <a 
                            href={`https://donut.push.network/address/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-secondary transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </a>
                        </div>
                      </div>
                      <div className="font-mono text-sm text-muted-foreground break-all">{address}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4">Contract Descriptions</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-primary">UniswapV2Factory</h4>
                    <p className="text-sm text-muted-foreground">
                      Creates and manages all trading pairs. Each pair is a separate contract that holds liquidity.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">UniswapV2Router02</h4>
                    <p className="text-sm text-muted-foreground">
                      Main entry point for all user interactions. Handles swaps, adding/removing liquidity with optimal routing.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">WETH9</h4>
                    <p className="text-sm text-muted-foreground">
                      Wrapped native token (PC) contract. Allows native tokens to be used in ERC-20 compatible operations.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">Multicall</h4>
                    <p className="text-sm text-muted-foreground">
                      Batches multiple blockchain calls into a single request for improved performance and reduced RPC calls.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">UniswapV2Library</h4>
                    <p className="text-sm text-muted-foreground">
                      Helper library for price calculations, pair address computation, and quote generation.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Roadmap Tab */}
            <TabsContent value="roadmap" className="space-y-6">
              <div className="grid gap-6">
                {PHASES.map((phase, i) => (
                  <Card 
                    key={phase.phase} 
                    className="glass-card p-6 animate-fade-in"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          phase.status === 'completed' 
                            ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' 
                            : phase.status === 'in-progress'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {phase.phase}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{phase.title}</h3>
                          <p className="text-sm text-muted-foreground">Phase {phase.phase}</p>
                        </div>
                      </div>
                      <Badge className={getPhaseStatusColor(phase.status)}>
                        {phase.status === 'completed' ? 'Completed' : phase.status === 'in-progress' ? 'In Progress' : 'Pending'}
                      </Badge>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-2">
                      {phase.items.map((item) => (
                        <div key={item.name} className="flex items-center gap-2 text-sm">
                          {item.done ? (
                            <CheckCircle className="w-4 h-4 text-[hsl(var(--success))]" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="glass-card p-6 border-primary/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Future Plans</h3>
                    <p className="text-sm text-muted-foreground">What's coming next</p>
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="font-semibold mb-1">🌐 Multi-chain Support</div>
                    <p className="text-xs text-muted-foreground">Expand to other EVM-compatible networks</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="font-semibold mb-1">🎯 Limit Orders</div>
                    <p className="text-xs text-muted-foreground">Set price targets for automatic execution</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="font-semibold mb-1">🌾 Yield Farming</div>
                    <p className="text-xs text-muted-foreground">Earn additional rewards for providing liquidity</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="font-semibold mb-1">📱 Mobile App</div>
                    <p className="text-xs text-muted-foreground">Native mobile experience for iOS and Android</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Docs;
