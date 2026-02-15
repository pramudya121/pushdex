import React from 'react';
import { Header } from '@/components/Header';
import { WaveBackground } from '@/components/WaveBackground';
import { HeroSection } from '@/components/HeroSection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code2, 
  Terminal, 
  Wallet, 
  Zap, 
  Globe, 
  Layers, 
  ArrowRight,
  Copy,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Github
} from 'lucide-react';
import { toast } from 'sonner';
import { CHAIN_ID, RPC_URL, BLOCK_EXPLORER, CONTRACTS } from '@/config/contracts';

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language = 'typescript' }) => {
  const [copied, setCopied] = React.useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-muted/50 border border-border/50 rounded-xl p-4 overflow-x-auto text-sm">
        <code className={`language-${language} text-muted-foreground`}>
          {code}
        </code>
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={copyCode}
      >
        {copied ? (
          <CheckCircle2 className="w-4 h-4 text-success" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};

const PushChainDocs: React.FC = () => {
  return (
    <div className="min-h-screen bg-background wave-bg">
      <WaveBackground />
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        {/* Hero Section */}
        <HeroSection
          title="Push Chain SDK"
          description="Complete guide to integrating Push Chain into your dApp"
          showSpotlight={true}
          showStars={true}
          spotlightColor="hsl(280, 100%, 60%)"
          badge={{
            text: "Developer Docs",
            icon: <BookOpen className="w-4 h-4 text-primary" />,
          }}
        />

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <a 
            href="https://docs.push.org" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Card className="glass-card hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Official Docs</h3>
                  <p className="text-sm text-muted-foreground">Complete documentation</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </a>
          
          <a 
            href="https://github.com/push-protocol" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Card className="glass-card hover:border-accent/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Github className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">GitHub</h3>
                  <p className="text-sm text-muted-foreground">Source code & examples</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </a>
          
          <a 
            href={BLOCK_EXPLORER} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Card className="glass-card hover:border-success/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Block Explorer</h3>
                  <p className="text-sm text-muted-foreground">View transactions</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Network Info */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Push Chain Testnet Configuration
            </CardTitle>
            <CardDescription>
              Network details for connecting to Push Chain Testnet (Donut)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Network Name</span>
                  <Badge variant="outline">Push Testnet Donut</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Chain ID</span>
                  <Badge variant="outline">{CHAIN_ID}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Native Token</span>
                  <Badge variant="outline">PC (Push Coin)</Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">RPC URL</span>
                  <code className="text-xs text-primary">{RPC_URL}</code>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Block Explorer</span>
                  <code className="text-xs text-primary">{BLOCK_EXPLORER}</code>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">Currency Symbol</span>
                  <Badge variant="outline">PC</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SDK Integration Guide */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              SDK Integration Guide
            </CardTitle>
            <CardDescription>
              Step-by-step guide to integrate Push Chain SDK into your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="installation" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="installation">Installation</TabsTrigger>
                <TabsTrigger value="setup">Setup</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="accounts">Accounts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="installation" className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Install Core SDK
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Install the Push Chain Core SDK and required dependencies:
                  </p>
                </div>
                
                <CodeBlock 
                  code={`# Core SDK
npm install @pushchain/core

# Plus whichever helpers you need:
npm install ethers        # for EVM
npm install viem          # alternative EVM library
npm install @solana/web3.js  # for Solana`}
                  language="bash"
                />

                <div className="mt-6 space-y-2">
                  <h4 className="font-semibold">Or using Yarn:</h4>
                  <CodeBlock 
                    code={`yarn add @pushchain/core ethers`}
                    language="bash"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="setup" className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Code2 className="w-4 h-4" />
                    Import Libraries
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Import Push Chain SDK and Ethers.js:
                  </p>
                </div>
                
                <CodeBlock 
                  code={`// Import Push Chain SDK and Ethers
// You can use other library like viem, etc
// THIS EXAMPLE FOLLOWS ETHERS IMPLEMENTATION
import { PushChain } from '@pushchain/core';
import { ethers } from 'ethers';`}
                  language="typescript"
                />

                <div className="mt-6 space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Create Universal Signer
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect to provider and create a universal signer:
                  </p>
                </div>

                <CodeBlock 
                  code={`// (inside an async function or top-level-await context)
// 1. Connect to a provider (e.g., Push Chain RPC URL)
const provider = new ethers.JsonRpcProvider('${RPC_URL}')

// 2. Create a random wallet (or use your own private key)
const wallet = ethers.Wallet.createRandom(provider)

// 3. Convert ethers signer to Universal Signer
// Most popular libraries can pass just the signer to get universal signer
// Or use PushChain.utils.signer.construct to create a custom one
const universalSigner = await PushChain.utils.signer.toUniversal(wallet)`}
                  language="typescript"
                />

                <div className="mt-6 space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Initialize Push Chain SDK
                  </h4>
                </div>

                <CodeBlock 
                  code={`// ONCE UNIVERSAL SIGNER IS CREATED
// ALL CHAIN IMPLEMENTATION BECOMES UNIVERSAL

// (inside an async function or top-level-await context)
// Initialize Push Chain SDK
const pushChainClient = await PushChain.initialize(universalSigner, {
  network: PushChain.CONSTANTS.PUSH_NETWORK.TESTNET
});`}
                  language="typescript"
                />
              </TabsContent>
              
              <TabsContent value="transactions" className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Send Transaction
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Send a universal transaction from any chain to Push Chain:
                  </p>
                </div>
                
                <CodeBlock 
                  code={`// ONCE UNIVERSAL SIGNER IS CREATED
// ALL CHAIN IMPLEMENTATION BECOMES UNIVERSAL

// (inside an async function or top-level-await context)
// Send a universal transaction (from any chain to Push Chain)
const txHash = await pushChainClient.universal.sendTransaction({
  to: '0xD80E00000044/49230/1088dc/Ff6aB833F3/Daca49', // To address on Push Chain
  value: BigInt(1), // $PC value to send
});

console.log('Transaction sent:', txHash);`}
                  language="typescript"
                />

                <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                  <h5 className="font-semibold text-primary mb-2">💡 Pro Tip</h5>
                  <p className="text-sm text-muted-foreground">
                    Universal transactions work across chains! You can send from Ethereum, BSC, Polygon, or any supported chain directly to Push Chain using the same interface.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="accounts" className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Inspect Accounts
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get account information from Push Chain Client:
                  </p>
                </div>
                
                <CodeBlock 
                  code={`// ONCE PUSH CHAIN CLIENT IS INITIALIZED
// ALL CHAIN IMPLEMENTATION BECOMES UNIVERSAL

// Get the account that is connected to Push Chain Client
const pushChainAccount = pushChainClient.universal.account;
console.log(
  'Account connected to Push Chain Client:',
  pushChainAccount.address
);

// Get the origin account connected to Push Chain Client
const originAccount = pushChainClient.universal.origin;

console.log(
  'Origin address that is controlling the account connected to Push Chain Client'
);
console.log(
  "Origin address is only present if other chain's address is connected to Push Chain Client"
);
console.log('Else it will be the same as pushChainClient.universal.account');
console.log('Origin address:', originAccount.address);`}
                  language="typescript"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Contract Addresses */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              PushDex Contract Addresses
            </CardTitle>
            <CardDescription>
              Smart contract addresses deployed on Push Chain Testnet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries({...CONTRACTS}).map(([name, address]) => (
                <div 
                  key={name}
                  className="flex justify-between items-center p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-foreground">{name}</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-primary font-mono">{address}</code>
                    <a 
                      href={`${BLOCK_EXPLORER}/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scaffold Alternative */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-accent" />
              Scaffold a Universal DApp (Alternative)
            </CardTitle>
            <CardDescription>
              Don't want to wire Core SDK manually? Use the CLI to scaffold a full-stack dApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This is ideal if you're building a frontend dApp right away. If you only need Core SDK (backend, scripts, integrations), follow the Quickstart steps above.
            </p>
            
            <CodeBlock 
              code={`npx create-universal-dapp my-app`}
              language="bash"
            />
            
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl">
              <h5 className="font-semibold text-accent mb-2">🚀 What you get:</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Core SDK pre-configured</li>
                <li>• React + UI Kit boilerplate</li>
                <li>• Backend scripts ready</li>
                <li>• Example integrations</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PushChainDocs;
