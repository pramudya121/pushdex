import React, { useState, useMemo } from 'react';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WalletButton } from '@/components/WalletButton';
import { toast } from 'sonner';
import {
  BookOpen, Search, Wallet, Coins, Droplets, BarChart3, Briefcase, History,
  Bot, Code, Shield, FileText, Layers, Zap, Circle, ArrowRight, ExternalLink,
  Copy, Check, CheckCircle, GitBranch, Box, ChevronRight, TrendingUp,
  AlertCircle, ArrowLeftRight, LayoutGrid, Settings, HelpCircle, Map, Gem
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

const CONTRACTS = {
  FACTORY: '0xBB3B44EB672650Fb4a1Cf6D9dc5d3b7494F333AB',
  ROUTER: '0xF143eCFE3DFEEB4ae188cA4f1c7c7ab0b5F592eb',
  WETH: '0x5b0AE944A4Ee6241a5A638C440A0dCD42411bD3C',
  MULTICALL: '0x98cA063a7066Ae68B395ad49B9f05F2Df510d6B5',
  LIBRARY: '0xEa71393074fFCB6d132B8a2b6028CAF952af03A5',
  FARMING: '0x45eb2C9405A5C07288B8B22343C9a5eA67405579',
  STAKING: '0xAb40694cA2Cf9DdfD5235109505D1970C48Ce2aA',
};

const TOKENS = {
  PC: '0x0000000000000000000000000000000000000000',
  WPC: '0x5b0AE944A4Ee6241a5A638C440A0dCD42411bD3C',
  ETH: '0x70af1341F5D5c60F913F6a21C669586C38592510',
  BNB: '0x68F2458954032952d2ddd5D8Ee1d671e6E93Ae6C',
  PSDX: '0x2Bf9ae7D36f6D057fC84d7f3165E9EB870f2e2e7',
  LINK: '0xDa70a94c2976d64b1dDF9E796c3709bC989b7Dc7',
  HYPE: '0x5E0B3DE95ACeeF2d46CEAF3e287370D23d90B603',
  ZEC: '0x84fDbFA4322915D82B9e11C0B999d589af2911ae',
  SUI: '0x260B0d562e5eB66C85ECD19cB0C7269055CFFE0F',
  UNI: '0xFEBb4524170A78c83A29249992C444A6d21d8c07',
  OKB: '0x731251C4fcA037F718b24DEFd8AD6C5Abe224C41',
};

const PHASES = [
  {
    phase: 1, title: 'Core Infrastructure', status: 'completed',
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
    phase: 2, title: 'Core Functions', status: 'completed',
    items: [
      { name: 'Token swap functionality', done: true },
      { name: 'Add liquidity feature', done: true },
      { name: 'Remove liquidity feature', done: true },
      { name: 'Pool creation', done: true },
      { name: 'Wrap/Unwrap PC tokens', done: true },
    ]
  },
  {
    phase: 3, title: 'Frontend Integration', status: 'completed',
    items: [
      { name: 'Wallet connection (MetaMask, OKX, Rabby, Bitget)', done: true },
      { name: 'On-chain transaction execution', done: true },
      { name: 'Real-time balance display', done: true },
      { name: 'Token selector with logos', done: true },
      { name: 'Slippage & deadline settings', done: true },
    ]
  },
  {
    phase: 4, title: 'Analytics & Data', status: 'completed',
    items: [
      { name: 'Pool analytics page', done: true },
      { name: 'TVL calculations', done: true },
      { name: 'Volume tracking', done: true },
      { name: 'Price charts', done: true },
      { name: 'Transaction history', done: true },
    ]
  },
  {
    phase: 5, title: 'UX Polish', status: 'completed',
    items: [
      { name: 'Responsive design', done: true },
      { name: 'Animations & transitions', done: true },
      { name: 'Error handling', done: true },
      { name: 'Loading states', done: true },
      { name: 'Toast notifications', done: true },
    ]
  },
  {
    phase: 6, title: 'Finalization', status: 'completed',
    items: [
      { name: 'Security review', done: true },
      { name: 'CI/CD pipeline', done: true },
      { name: 'Documentation', done: true },
      { name: 'Mainnet deployment', done: false },
    ]
  },
];

// ─── Sidebar Navigation ─────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const SIDEBAR_NAV: NavGroup[] = [
  {
    title: 'GETTING STARTED',
    items: [
      { id: 'introduction', label: 'Introduction', icon: <BookOpen className="w-4 h-4" /> },
      { id: 'connect-wallet', label: 'Connect Wallet', icon: <Wallet className="w-4 h-4" /> },
      { id: 'get-testnet-tokens', label: 'Get Testnet Tokens', icon: <Coins className="w-4 h-4" /> },
    ],
  },
  {
    title: 'USER GUIDES',
    items: [
      { id: 'how-to-swap', label: 'How to Swap', icon: <ArrowLeftRight className="w-4 h-4" /> },
      { id: 'provide-liquidity', label: 'Provide Liquidity', icon: <Droplets className="w-4 h-4" /> },
      { id: 'portfolio-send', label: 'Portfolio & Send', icon: <Briefcase className="w-4 h-4" /> },
      { id: 'analytics-pairs', label: 'Analytics & Pairs', icon: <BarChart3 className="w-4 h-4" /> },
      { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
      { id: 'pushdex-ai', label: 'PushDEX AI', icon: <Bot className="w-4 h-4" /> },
    ],
  },
  {
    title: 'DEFI CONCEPTS',
    items: [
      { id: 'amm-pricing', label: 'AMM & Pricing', icon: <TrendingUp className="w-4 h-4" /> },
      { id: 'impermanent-loss', label: 'Impermanent Loss', icon: <AlertCircle className="w-4 h-4" /> },
      { id: 'slippage-price-impact', label: 'Slippage & Price Impact', icon: <Shield className="w-4 h-4" /> },
      { id: 'lp-tokens-fees', label: 'LP Tokens & Fees', icon: <Gem className="w-4 h-4" /> },
    ],
  },
  {
    title: 'TECHNICAL',
    items: [
      { id: 'technology-stack', label: 'Technology Stack', icon: <Code className="w-4 h-4" /> },
      { id: 'smart-contracts', label: 'Smart Contracts', icon: <Box className="w-4 h-4" /> },
      { id: 'supported-tokens', label: 'Supported Tokens', icon: <Layers className="w-4 h-4" /> },
    ],
  },
  {
    title: 'ROADMAP & FAQ',
    items: [
      { id: 'roadmap', label: 'Development Roadmap', icon: <Map className="w-4 h-4" /> },
      { id: 'faq', label: 'FAQ', icon: <HelpCircle className="w-4 h-4" /> },
    ],
  },
];

// ─── Content Sections ────────────────────────────────────────────────────────

const IntroductionSection = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">
        Welcome to <span className="gradient-text">PUSHDEX</span>
      </h1>
      <p className="text-muted-foreground text-lg leading-relaxed">
        PUSHDEX is a decentralized exchange built on <strong className="text-foreground">Pushchain Testnet</strong>, powered by the
        battle-tested UniswapV2 protocol. Trade, provide liquidity, and earn — all without intermediaries.
      </p>
    </div>

    {/* Highlight Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { icon: <Shield className="w-5 h-5 text-primary" />, title: 'Non-Custodial', desc: 'You always maintain full control over your assets' },
        { icon: <Zap className="w-5 h-5 text-primary" />, title: 'Fast & Cheap', desc: 'Low gas fees on Pushchain Testnet' },
        { icon: <Code className="w-5 h-5 text-primary" />, title: 'Open Source', desc: 'Verified and transparent smart contracts' },
      ].map((item) => (
        <Card key={item.title} className="p-5 bg-secondary/60 border-border/40">
          <div className="mb-3">{item.icon}</div>
          <h3 className="font-semibold mb-1">{item.title}</h3>
          <p className="text-sm text-muted-foreground">{item.desc}</p>
        </Card>
      ))}
    </div>

    {/* New to DeFi tip */}
    <Card className="p-4 border-primary/30 bg-primary/5">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">New to DeFi?</strong> Start by connecting your wallet, getting testnet tokens from the faucet,
          then try your first swap. Use PushDEX AI (bottom-right button) for help anytime!
        </p>
      </div>
    </Card>

    {/* Key Features */}
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary" />
        Key Features
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: <ArrowLeftRight className="w-5 h-5 text-primary" />, title: 'Token Swap', desc: 'Instantly trade tokens with AMM pricing', link: '/swap' },
          { icon: <Droplets className="w-5 h-5 text-primary" />, title: 'Liquidity Pools', desc: 'Provide liquidity and earn 0.3% fees', link: '/liquidity' },
          { icon: <BarChart3 className="w-5 h-5 text-primary" />, title: 'Analytics', desc: 'Real-time charts, TVL, volume, pair data', link: '/analytics' },
          { icon: <Briefcase className="w-5 h-5 text-primary" />, title: 'Portfolio', desc: 'Track holdings, LP positions, send tokens', link: '/portfolio' },
          { icon: <Bot className="w-5 h-5 text-primary" />, title: 'PushDEX AI', desc: 'AI assistant with voice & text-to-speech', link: '#' },
          { icon: <History className="w-5 h-5 text-primary" />, title: 'History', desc: 'Complete transaction history with details', link: '/history' },
        ].map((f) => (
          <a key={f.title} href={f.link} className="group">
            <Card className="p-4 bg-secondary/40 border-border/30 hover:border-primary/40 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">{f.icon}</div>
                <div>
                  <h3 className="font-semibold mb-0.5 group-hover:text-primary transition-colors">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            </Card>
          </a>
        ))}
      </div>
    </div>
  </div>
);

const ConnectWalletSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Connect Wallet</h2>
    <p className="text-muted-foreground">PUSHDEX supports popular EVM wallets. Follow these steps to connect:</p>
    <div className="space-y-4">
      {[
        { step: 1, title: 'Install a Wallet', desc: 'Install MetaMask, OKX Wallet, Rabby, or Bitget Wallet browser extension.' },
        { step: 2, title: 'Add Pushchain Network', desc: 'Click "Connect Wallet" on PUSHDEX — the network will be added automatically.' },
        { step: 3, title: 'Approve Connection', desc: 'Confirm the connection request in your wallet popup.' },
      ].map((s) => (
        <div key={s.step} className="flex gap-4">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-primary font-bold text-sm">{s.step}</div>
          <div>
            <h3 className="font-semibold mb-0.5">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
    <Card className="p-4 bg-secondary/50 border-border/40">
      <h4 className="font-semibold mb-2">Network Details</h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted-foreground">Network:</span> <span className="font-medium">Push Testnet Donut</span></div>
        <div><span className="text-muted-foreground">Chain ID:</span> <span className="font-mono">42101</span></div>
        <div><span className="text-muted-foreground">RPC:</span> <span className="font-mono">evm.donut.rpc.push.org</span></div>
        <div><span className="text-muted-foreground">Token:</span> <span className="font-medium">PC</span></div>
      </div>
    </Card>
  </div>
);

const GetTestnetTokensSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Get Testnet Tokens</h2>
    <p className="text-muted-foreground">Testnet tokens are free and used for testing on Pushchain Testnet.</p>
    <Card className="p-5 bg-secondary/50 border-border/40">
      <h4 className="font-semibold mb-2">How to get PC tokens</h4>
      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
        <li>Visit the <a href="https://donut.push.network/faucet" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Push Testnet Faucet</a></li>
        <li>Enter your wallet address</li>
        <li>Click "Request Tokens" and wait for confirmation</li>
        <li>PC tokens will appear in your wallet within seconds</li>
      </ol>
    </Card>
  </div>
);

const HowToSwapSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">How to Swap</h2>
    <p className="text-muted-foreground">Swapping tokens on PUSHDEX is simple and instant.</p>
    <div className="space-y-4">
      {[
        { step: 1, text: 'Navigate to the Swap page' },
        { step: 2, text: 'Select the token you want to sell (From) and the token you want to buy (To)' },
        { step: 3, text: 'Enter the amount — you\'ll see the estimated output' },
        { step: 4, text: 'Review slippage settings (default 0.5%)' },
        { step: 5, text: 'Click "Swap" and confirm in your wallet' },
      ].map((s) => (
        <div key={s.step} className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-primary font-bold text-xs">{s.step}</div>
          <p className="text-muted-foreground text-sm pt-0.5">{s.text}</p>
        </div>
      ))}
    </div>
    <Card className="p-4 border-primary/30 bg-primary/5">
      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">Tip:</strong> For the first swap of a token, you'll need to approve the token spending (one-time transaction).
      </p>
    </Card>
  </div>
);

const ProvideLiquiditySection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Provide Liquidity</h2>
    <p className="text-muted-foreground">Earn 0.3% of all trades on a pair proportional to your share of the pool.</p>
    <div className="space-y-3">
      {[
        'Go to the Liquidity page',
        'Select the two tokens for the pair',
        'Enter the amount for one token — the other auto-calculates',
        'Approve both tokens if needed',
        'Click "Add Liquidity" and confirm',
        'You\'ll receive LP tokens representing your pool share',
      ].map((text, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-primary font-bold text-xs">{i + 1}</div>
          <p className="text-muted-foreground text-sm pt-0.5">{text}</p>
        </div>
      ))}
    </div>
  </div>
);

const PortfolioSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Portfolio & Send</h2>
    <p className="text-muted-foreground">Track all your assets and LP positions in one place. You can also send tokens to any address.</p>
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-4 bg-secondary/40"><h4 className="font-semibold mb-1">Token Balances</h4><p className="text-sm text-muted-foreground">View all your token holdings with USD values</p></Card>
      <Card className="p-4 bg-secondary/40"><h4 className="font-semibold mb-1">LP Positions</h4><p className="text-sm text-muted-foreground">See your liquidity pool shares and earned fees</p></Card>
      <Card className="p-4 bg-secondary/40"><h4 className="font-semibold mb-1">Send Tokens</h4><p className="text-sm text-muted-foreground">Transfer tokens to any address on Pushchain</p></Card>
      <Card className="p-4 bg-secondary/40"><h4 className="font-semibold mb-1">Performance Chart</h4><p className="text-sm text-muted-foreground">Track portfolio value over time</p></Card>
    </div>
  </div>
);

const AnalyticsPairsSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Analytics & Pairs</h2>
    <p className="text-muted-foreground">Deep insights into pools, volumes, and token performance.</p>
    <ul className="space-y-2 text-sm text-muted-foreground">
      {['Real-time TVL and volume data', 'Individual pair analytics', 'Price charts with multiple timeframes', 'Top pools and tokens ranking', 'Fee generation tracking'].map((t) => (
        <li key={t} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[hsl(var(--success))]" />{t}</li>
      ))}
    </ul>
  </div>
);

const SettingsSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Settings</h2>
    <p className="text-muted-foreground">Customize your PUSHDEX experience.</p>
    <ul className="space-y-2 text-sm text-muted-foreground">
      {['Slippage tolerance (0.1% – 50%)', 'Transaction deadline', 'Theme preferences', 'Notification settings', 'Gas price settings'].map((t) => (
        <li key={t} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[hsl(var(--success))]" />{t}</li>
      ))}
    </ul>
  </div>
);

const PushDEXAISection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">PushDEX AI</h2>
    <p className="text-muted-foreground">Your intelligent assistant for navigating PUSHDEX.</p>
    <Card className="p-5 bg-secondary/50 border-border/40">
      <h4 className="font-semibold mb-3">Capabilities</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {['Answer questions about DeFi and PUSHDEX', 'Guide you through swaps and liquidity', 'Voice input & text-to-speech output', 'Real-time price information', 'Transaction troubleshooting'].map((t) => (
          <li key={t} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[hsl(var(--success))]" />{t}</li>
        ))}
      </ul>
    </Card>
    <p className="text-sm text-muted-foreground">Click the AI button on the bottom-right corner to start.</p>
  </div>
);

const AMMSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">AMM & Pricing</h2>
    <p className="text-muted-foreground">PUSHDEX uses the Automated Market Maker (AMM) model from Uniswap V2.</p>
    <Card className="p-5 bg-secondary/50 border-border/40">
      <h4 className="font-semibold mb-2">Constant Product Formula</h4>
      <div className="bg-muted/50 rounded-lg p-4 font-mono text-center text-lg">x × y = k</div>
      <p className="text-sm text-muted-foreground mt-3">Where <strong>x</strong> and <strong>y</strong> are the reserves of two tokens, and <strong>k</strong> remains constant. This formula determines the exchange rate.</p>
    </Card>
    <p className="text-sm text-muted-foreground">A 0.3% fee is taken from each swap. This fee goes to liquidity providers proportional to their pool share.</p>
  </div>
);

const ImpermanentLossSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Impermanent Loss</h2>
    <p className="text-muted-foreground">Impermanent loss occurs when the price of tokens in a pool changes compared to when you deposited them.</p>
    <Card className="p-5 bg-secondary/50 border-border/40">
      <h4 className="font-semibold mb-3">Example IL by Price Change</h4>
      <div className="space-y-2 text-sm">
        {[
          { change: '1.25x', loss: '0.6%' },
          { change: '1.5x', loss: '2.0%' },
          { change: '2x', loss: '5.7%' },
          { change: '3x', loss: '13.4%' },
          { change: '5x', loss: '25.5%' },
        ].map((r) => (
          <div key={r.change} className="flex justify-between py-1.5 border-b border-border/30">
            <span className="text-muted-foreground">Price change: {r.change}</span>
            <span className="text-primary font-medium">~{r.loss} IL</span>
          </div>
        ))}
      </div>
    </Card>
    <p className="text-sm text-muted-foreground">The loss is "impermanent" because it can be recovered if prices return. Trading fees earned can offset IL.</p>
  </div>
);

const SlippageSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Slippage & Price Impact</h2>
    <p className="text-muted-foreground"><strong>Slippage</strong> is the difference between the expected and actual price. <strong>Price impact</strong> is the effect your trade has on the pool price.</p>
    <Card className="p-5 bg-secondary/50">
      <h4 className="font-semibold mb-2">Tips</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li>• Use 0.5% slippage for most trades</li>
        <li>• Increase slippage for volatile or low-liquidity tokens</li>
        <li>• Large trades relative to pool size = higher price impact</li>
        <li>• Split large trades into smaller ones to reduce impact</li>
      </ul>
    </Card>
  </div>
);

const LPTokensSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">LP Tokens & Fees</h2>
    <p className="text-muted-foreground">When you add liquidity, you receive LP tokens representing your share of the pool.</p>
    <div className="space-y-3 text-sm text-muted-foreground">
      <p>• <strong className="text-foreground">Earning fees:</strong> 0.3% of each trade is distributed to LPs proportionally</p>
      <p>• <strong className="text-foreground">Removing liquidity:</strong> Burn LP tokens to withdraw your share + earned fees</p>
      <p>• <strong className="text-foreground">Farming:</strong> Stake LP tokens in farming pools for additional rewards</p>
    </div>
  </div>
);

const TechStackSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Technology Stack</h2>
    {[
      { cat: 'Blockchain', items: ['Pushchain Testnet — L1 blockchain', 'Ethers.js v6 — Blockchain interaction', 'Uniswap V2 Protocol — AMM design'] },
      { cat: 'Frontend', items: ['React 18 — UI library', 'TypeScript — Type safety', 'Vite — Build tool', 'Tailwind CSS — Styling', 'shadcn/ui — Components'] },
      { cat: 'State & Data', items: ['React Query — Data fetching', 'React Context — Wallet state', 'Multicall — Batch RPC calls'] },
    ].map((g) => (
      <Card key={g.cat} className="p-5 bg-secondary/40">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Code className="w-4 h-4 text-primary" />{g.cat}</h3>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {g.items.map((i) => <li key={i}>• {i}</li>)}
        </ul>
      </Card>
    ))}
  </div>
);

const SmartContractsSection = ({ copiedContract, copyAddress }: { copiedContract: string | null; copyAddress: (addr: string, name: string) => void }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Smart Contracts</h2>
    <p className="text-muted-foreground text-sm">All contracts deployed on Pushchain Testnet (Chain ID: 42101)</p>
    <div className="space-y-3">
      {Object.entries(CONTRACTS).map(([name, address]) => (
        <Card key={name} className="p-4 bg-secondary/40 border-border/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-sm">{name.replace('_', ' ')}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => copyAddress(address, name)} className="p-1.5 rounded hover:bg-muted transition-colors">
                {copiedContract === name ? <Check className="w-3.5 h-3.5 text-[hsl(var(--success))]" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
              <a href={`https://donut.push.network/address/${address}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-muted transition-colors">
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>
          <div className="font-mono text-xs text-muted-foreground break-all">{address}</div>
        </Card>
      ))}
    </div>
  </div>
);

const TOKEN_LOGOS: Record<string, string> = {
  PC: '/tokens/pc.png',
  WPC: '/tokens/wpc.png',
  ETH: '/tokens/eth.png',
  BNB: '/tokens/bnb.png',
  PSDX: '/tokens/psdx.png',
  LINK: '/tokens/link.png',
  HYPE: '/tokens/hype.png',
  ZEC: '/tokens/zec.png',
  SUI: '/tokens/sui.png',
  UNI: '/tokens/uni.png',
  OKB: '/tokens/okb.png',
};

const TOKEN_NAMES: Record<string, string> = {
  PC: 'Push Coin',
  WPC: 'Wrapped Push Coin',
  ETH: 'Ethereum',
  BNB: 'BNB',
  PSDX: 'PushDex Token',
  LINK: 'Chainlink',
  HYPE: 'Hype Token',
  ZEC: 'Zcash',
  SUI: 'Sui',
  UNI: 'Uniswap',
  OKB: 'OKB',
};

const SupportedTokensSection = ({ copiedContract, copyAddress }: { copiedContract: string | null; copyAddress: (addr: string, name: string) => void }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Supported Tokens</h2>
    <p className="text-muted-foreground text-sm">All tokens available for trading on PUSHDEX</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Object.entries(TOKENS).map(([name, address]) => (
        <Card key={name} className="p-4 bg-secondary/40 border-border/30 hover:border-primary/30 transition-colors group">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-10 h-10 rounded-full bg-secondary/80 border border-border/40 overflow-hidden flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
              <img
                src={TOKEN_LOGOS[name] || '/placeholder.svg'}
                alt={`${name} logo`}
                className="w-7 h-7 object-contain"
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{name}</span>
                <span className="text-xs text-muted-foreground">{TOKEN_NAMES[name]}</span>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground truncate">{address}</div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={() => copyAddress(address, name)} className="p-1.5 rounded hover:bg-muted transition-colors">
                {copiedContract === name ? <Check className="w-3.5 h-3.5 text-[hsl(var(--success))]" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
              <a href={`https://donut.push.network/address/${address}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-muted transition-colors">
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const RoadmapSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Development Roadmap</h2>
    <div className="space-y-4">
      {PHASES.map((phase) => (
        <Card key={phase.phase} className="p-5 bg-secondary/40 border-border/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                phase.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : 'bg-primary/20 text-primary'
              )}>{phase.phase}</div>
              <h3 className="font-semibold">{phase.title}</h3>
            </div>
            <Badge className={phase.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : 'bg-primary/20 text-primary'}>
              {phase.status === 'completed' ? 'Completed' : 'In Progress'}
            </Badge>
          </div>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {phase.items.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                {item.done ? <CheckCircle className="w-3.5 h-3.5 text-[hsl(var(--success))]" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const FAQSection = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">FAQ</h2>
    <div className="space-y-4">
      {[
        { q: 'Is PUSHDEX safe?', a: 'PUSHDEX uses audited UniswapV2 smart contracts. It is non-custodial — you always control your funds.' },
        { q: 'Are there any fees?', a: 'A 0.3% fee is taken per swap and distributed to liquidity providers. There are no platform fees.' },
        { q: 'Which wallets are supported?', a: 'MetaMask, OKX Wallet, Rabby Wallet, and Bitget Wallet are supported.' },
        { q: 'Can I create my own token pair?', a: 'Yes! Go to Pools → Create Pool and provide initial liquidity for any ERC-20 token pair.' },
        { q: 'What happens if a transaction fails?', a: 'Your tokens remain safe. Failed transactions may be caused by insufficient gas, high slippage, or network congestion. Try increasing slippage or gas.' },
      ].map((f) => (
        <Card key={f.q} className="p-5 bg-secondary/40 border-border/30">
          <h4 className="font-semibold mb-2">{f.q}</h4>
          <p className="text-sm text-muted-foreground">{f.a}</p>
        </Card>
      ))}
    </div>
  </div>
);

// ─── Section map ─────────────────────────────────────────────────────────────

const SECTION_MAP: Record<string, string> = {
  'introduction': 'Introduction',
  'connect-wallet': 'Connect Wallet',
  'get-testnet-tokens': 'Get Testnet Tokens',
  'how-to-swap': 'How to Swap',
  'provide-liquidity': 'Provide Liquidity',
  'portfolio-send': 'Portfolio & Send',
  'analytics-pairs': 'Analytics & Pairs',
  'settings': 'Settings',
  'pushdex-ai': 'PushDEX AI',
  'amm-pricing': 'AMM & Pricing',
  'impermanent-loss': 'Impermanent Loss',
  'slippage-price-impact': 'Slippage & Price Impact',
  'lp-tokens-fees': 'LP Tokens & Fees',
  'technology-stack': 'Technology Stack',
  'smart-contracts': 'Smart Contracts',
  'supported-tokens': 'Supported Tokens',
  'roadmap': 'Development Roadmap',
  'faq': 'FAQ',
};

// ─── Main Docs component ────────────────────────────────────────────────────

const Docs = () => {
  const [activeSection, setActiveSection] = useState('introduction');
  const [search, setSearch] = useState('');
  const [copiedContract, setCopiedContract] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const copyAddress = (address: string, name: string) => {
    navigator.clipboard.writeText(address);
    setCopiedContract(name);
    toast.success(`${name} address copied!`);
    setTimeout(() => setCopiedContract(null), 2000);
  };

  const filteredNav = useMemo(() => {
    if (!search.trim()) return SIDEBAR_NAV;
    const q = search.toLowerCase();
    return SIDEBAR_NAV.map((group) => ({
      ...group,
      items: group.items.filter((item) => item.label.toLowerCase().includes(q)),
    })).filter((group) => group.items.length > 0);
  }, [search]);

  const renderContent = () => {
    switch (activeSection) {
      case 'introduction': return <IntroductionSection />;
      case 'connect-wallet': return <ConnectWalletSection />;
      case 'get-testnet-tokens': return <GetTestnetTokensSection />;
      case 'how-to-swap': return <HowToSwapSection />;
      case 'provide-liquidity': return <ProvideLiquiditySection />;
      case 'portfolio-send': return <PortfolioSection />;
      case 'analytics-pairs': return <AnalyticsPairsSection />;
      case 'settings': return <SettingsSection />;
      case 'pushdex-ai': return <PushDEXAISection />;
      case 'amm-pricing': return <AMMSection />;
      case 'impermanent-loss': return <ImpermanentLossSection />;
      case 'slippage-price-impact': return <SlippageSection />;
      case 'lp-tokens-fees': return <LPTokensSection />;
      case 'technology-stack': return <TechStackSection />;
      case 'smart-contracts': return <SmartContractsSection copiedContract={copiedContract} copyAddress={copyAddress} />;
      case 'supported-tokens': return <SupportedTokensSection copiedContract={copiedContract} copyAddress={copyAddress} />;
      case 'roadmap': return <RoadmapSection />;
      case 'faq': return <FAQSection />;
      default: return <IntroductionSection />;
    }
  };

  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <Header />

      <div className="relative z-10 pt-20 pb-20 flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed lg:sticky top-20 left-0 z-40 h-[calc(100vh-5rem)] w-64 shrink-0 overflow-y-auto border-r border-border/30 bg-background/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search docs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm bg-secondary/50 border-border/40"
              />
            </div>

            {/* Nav Groups */}
            <nav className="space-y-5">
              {filteredNav.map((group) => (
                <div key={group.title}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 px-2">
                    {group.title}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-200 text-left',
                          activeSection === item.id
                            ? 'bg-primary/15 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-20 left-4 z-50 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
        >
          <BookOpen className="w-5 h-5" />
        </button>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-30 bg-background/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-4 md:px-8 lg:px-12 py-4 max-w-4xl">
          {renderContent()}

          {/* Footer */}
          <div className="mt-16 pt-6 border-t border-border/30 flex items-center justify-between text-sm text-muted-foreground">
            <span>PUSHDEX — Decentralized Trading on Pushchain Testnet</span>
            <a href="/swap" className="flex items-center gap-1 text-primary hover:underline">
              Connect Wallet <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Docs;
