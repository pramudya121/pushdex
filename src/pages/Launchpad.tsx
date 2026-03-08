import React, { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WaveBackground } from '@/components/WaveBackground';
import { HeroSection } from '@/components/HeroSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useWallet } from '@/contexts/WalletContext';
import { CONTRACTS, BLOCK_EXPLORER } from '@/config/contracts';
import { ROUTER_ABI, FACTORY_ABI, ERC20_ABI } from '@/config/abis';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Rocket,
  Loader2,
  CheckCircle,
  ExternalLink,
  Copy,
  AlertTriangle,
  Coins,
  Droplets,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Minimal ERC20 ABI (human-readable)
const ERC20_DEPLOY_ABI = [
  'constructor(string name_, string symbol_, uint8 decimals_, uint256 totalSupply_)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// Pre-compiled ERC20 bytecode (Solidity 0.8.x, constructor mints totalSupply to msg.sender)
// Compiled from a minimal ERC20 with: name, symbol, decimals, balanceOf, transfer, approve, allowance, transferFrom
const ERC20_BYTECODE = '0x60806040523480156200001157600080fd5b50604051620010b2380380620010b283398181016040528101906200003791906200028b565b836003908162000048919062000556565b5082600490816200005a919062000556565b5081600560006101000a81548160ff021916908360ff16021790555080600181905550806000803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550620000c63390565b73ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516200012491906200064e565b60405180910390a3505050506200066b565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b620001a08262000155565b810181811067ffffffffffffffff82111715620001c257620001c162000166565b5b80604052505050565b6000620001d762000136565b9050620001e5828262000195565b919050565b600067ffffffffffffffff82111562000208576200020762000166565b5b620002138262000155565b9050602081019050919050565b60005b838110156200024057808201518184015260208101905062000223565b60008484015250505050565b6000620002636200025d84620001ea565b620001cb565b90508281526020810184848401111562000282576200028162000150565b5b6200028f84828562000220565b509392505050565b60008060008060808587031215620002b457620002b362000140565b5b600085015167ffffffffffffffff811115620002d557620002d462000145565b5b8501601f81018713620002ec57620002eb6200014b565b5b620002fe878235602084016200024c565b945050602085015167ffffffffffffffff81111562000322576200032162000145565b5b8501601f8101871362000339576200033862000150565b5b6200034b878235602084016200024c565b935050604085015160ff81168114620003685762000367620001cb565b5b809250506060850151905092959194509250565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680620003cf57607f821691505b602082108103620003e557620003e462000387565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b6000821062000424576200042382000400565b5b602082108062000435575062000434620003b6565b5b506001821b919050565b6000600883026200047a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8262000410565b62000486868362000410565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b6000620004d3620004cd620004c7846200049e565b620004a8565b6200049e565b9050919050565b6000819050919050565b620004ef83620004b2565b62000507620004fe82620004da565b8484546200043f565b825550505050565b600090565b6200051e6200050f565b6200052b818484620004e4565b505050565b5b8181101562000553576200054760008262000514565b60018101905062000531565b5050565b6200056282620003eb565b67ffffffffffffffff8111156200057e576200057d62000166565b5b6200058a8254620003b6565b62000597828285620003eb565b600060209050601f831160018114620005cf5760008415620005ba578287015190505b620005c68582620003ff565b86555062000636565b601f198416620005df86620003eb565b60005b828110156200060957848901518255600182019150602085019450602081019050620005e2565b8683101562000629578489015162000625601f891682620003ff565b8355505b6001600288020188555050505b505050505050565b62000648816200049e565b82525050565b60006020820190506200066560008301846200063d565b92915050565b610a37806200067b6000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c806370a082311161007157806370a082311461016857806395d89b4114610198578063a9059cbb146101b6578063dd62ed3e146101e6578063313ce56714610216578063095ea7b314610234576100a9565b806306fdde03146100ae57806318160ddd146100cc57806323b872dd146100ea57806327e235e31461011a578063095ea7b31461014a575b600080fd5b6100b6610264565b6040516100c391906107a8565b60405180910390f35b6100d46102f6565b6040516100e191906107e3565b60405180910390f35b61010460048036038101906100ff919061089e565b610300565b60405161011191906108f9565b60405180910390f35b610134600480360381019061012f9190610914565b6104e8565b60405161014191906107e3565b60405180910390f35b610164600480360381019061015f9190610941565b610500565b60405161017191906108f9565b60405180910390f35b610182600480360381019061017d9190610914565b6105f2565b60405161018f91906107e3565b60405180910390f35b6101a061060a565b6040516101ad91906107a8565b60405180910390f35b6101d060048036038101906101cb9190610941565b61069c565b6040516101dd91906108f9565b60405180910390f35b61020060048036038101906101fb9190610981565b6107a2565b60405161020d91906107e3565b60405180910390f35b61021e610829565b60405161022b91906109dc565b60405180910390f35b61024e60048036038101906102499190610941565b610840565b60405161025b91906108f9565b60405180910390f35b606060038054610273906109f7565b80601f016020809104026020016040519081016040528092919081815260200182805461029f906109f7565b80156102ec5780601f106102c1576101008083540402835291602001916102ec565b820191906000526020600020905b8154815290600101906020018083116102cf57829003601f168201915b5050505050905090565b6000600154905090565b60008073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff16141580156103685750600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614155b6103a7576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161039e90610a99565b60405180910390fd5b816000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541015610427576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161041e90610ab9565b60405180910390fd5b816000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282540392505081905550816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040516104d891906107e3565b60405180910390a3600190509392505050565b60006020528060005260406000206000915090505481565b60008073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614610572576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161056990610a99565b60405180910390fd5b81600260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055506001905092915050565b60006020528060005260406000206000915090505481565b60606004805461061990610a28565b80601f0160208091040260200160405190810160405280929190818152602001828054610645906109f7565b80156106925780601f1061066757610100808354040283529160200191610692565b820191906000526020600020905b81548152906001019060200180831161067557829003601f168201915b5050505050905090565b60008073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415801561070c5750600073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614155b61074b576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161074290610a99565b60405180910390fd5b610756338484610300565b905092915050565b6000819050919050565b6000819050919050565b600061079261078d6107878461075e565b610768565b61075e565b9050919050565b6107a281610772565b82525050565b60006020820190506107bd6000830184610799565b92915050565b6107cc8161075e565b82525050565b60006020820190506107e760008301846107c3565b92915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061081d826107f2565b9050919050565b61082d81610812565b811461083857600080fd5b50565b60008135905061084a81610824565b92915050565b6108598161075e565b811461086457600080fd5b50565b60008135905061087681610850565b92915050565b600080600060608486031215610895576108946107ed565b5b60006108a38682870161083b565b93505060206108b48682870161083b565b92505060406108c586828701610867565b9150509250925092565b60008115159050919050565b6108e4816108cf565b82525050565b60006020820190506108ff60008301846108db565b92915050565b600060208284031215610a1b57610a1a6107ed565b5b6000610a298482850161083b565b91505092915050565b60008060408385031215610a4957610a486107ed565b5b6000610a578582860161083b565b9250506020610a6885828601610867565b9150509250929050565b600060208284031215610a8857610a876107ed565b5b6000610a968482850161083b565b9250506020610aa78482850161083b565b9150509250929050565b600060ff82169050919050565b610ac781610ab1565b82525050565b6000602082019050610ae26000830184610abe565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610b2e57607f821691505b602082108103610b4157610b40610ae8565b5b50919050565b600082825260208201905092915050565b7f496e76616c696420616464726573730000000000000000000000000000000000600082015250565b6000610b8e600f83610b47565b9150610b9982610b58565b602082019050919050565b6000602082019050818103600083015261';

// Use a simpler approach - deploy via ethers ContractFactory with inline Solidity
// Since we can't compile Solidity in-browser, we'll use a factory pattern

interface DeployedToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  txHash: string;
}

interface PairCreated {
  pairAddress: string;
  txHash: string;
}

type LaunchStep = 'configure' | 'deploying' | 'deployed' | 'creating-pair' | 'adding-liquidity' | 'complete';

const Launchpad = () => {
  const { address, signer, isConnected, isCorrectNetwork, switchNetwork } = useWallet();

  // Token config
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState('18');
  const [totalSupply, setTotalSupply] = useState('');
  const [createPair, setCreatePair] = useState(true);
  const [addInitialLiquidity, setAddInitialLiquidity] = useState(false);
  const [liquidityAmount, setLiquidityAmount] = useState('');
  const [tokenLiquidityAmount, setTokenLiquidityAmount] = useState('');

  // State
  const [step, setStep] = useState<LaunchStep>('configure');
  const [deployedToken, setDeployedToken] = useState<DeployedToken | null>(null);
  const [pairCreated, setPairCreated] = useState<PairCreated | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isFormValid = tokenName.trim() && tokenSymbol.trim() && totalSupply && parseFloat(totalSupply) > 0;

  const handleDeploy = useCallback(async () => {
    if (!signer || !address) return;
    if (!isCorrectNetwork) {
      await switchNetwork();
      return;
    }

    setIsProcessing(true);
    setStep('deploying');

    try {
      // Deploy using a simple ERC20 factory approach
      // We create a minimal ERC20 using ContractFactory
      const decimals = parseInt(tokenDecimals) || 18;
      const supply = ethers.parseUnits(totalSupply, decimals);

      // Use inline ABI + bytecode for simple ERC20
      const factory = new ethers.ContractFactory(
        [
          'constructor(string memory name_, string memory symbol_, uint8 decimals_, uint256 totalSupply_)',
          'function name() view returns (string)',
          'function symbol() view returns (string)',
          'function decimals() view returns (uint8)',
          'function totalSupply() view returns (uint256)',
          'function balanceOf(address) view returns (uint256)',
          'function transfer(address to, uint256 amount) returns (bool)',
          'function approve(address spender, uint256 amount) returns (bool)',
          'function allowance(address owner, address spender) view returns (uint256)',
          'function transferFrom(address from, address to, uint256 amount) returns (bool)',
        ],
        SIMPLE_ERC20_BYTECODE,
        signer
      );

      toast.loading('Deploying token contract...', { id: 'deploy' });
      const contract = await factory.deploy(tokenName, tokenSymbol, decimals, supply);
      await contract.waitForDeployment();
      const tokenAddress = await contract.getAddress();
      const deployTx = contract.deploymentTransaction();

      toast.success(`${tokenSymbol} deployed successfully!`, { id: 'deploy' });

      const deployed: DeployedToken = {
        address: tokenAddress,
        name: tokenName,
        symbol: tokenSymbol,
        decimals,
        totalSupply,
        txHash: deployTx?.hash || '',
      };
      setDeployedToken(deployed);
      setStep('deployed');

      // Auto create pair if selected
      if (createPair) {
        await handleCreatePair(tokenAddress, deployed);
      }
    } catch (error: any) {
      console.error('Deploy error:', error);
      toast.error(error.reason || error.message || 'Failed to deploy token', { id: 'deploy' });
      setStep('configure');
    } finally {
      setIsProcessing(false);
    }
  }, [signer, address, isCorrectNetwork, switchNetwork, tokenName, tokenSymbol, tokenDecimals, totalSupply, createPair]);

  const handleCreatePair = async (tokenAddress: string, deployed: DeployedToken) => {
    if (!signer) return;

    setStep('creating-pair');
    try {
      const factoryContract = new ethers.Contract(CONTRACTS.FACTORY, FACTORY_ABI, signer);

      toast.loading('Creating trading pair...', { id: 'pair' });
      const tx = await factoryContract.createPair(tokenAddress, CONTRACTS.WETH);
      const receipt = await tx.wait();

      // Find PairCreated event
      const pairCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = factoryContract.interface.parseLog(log);
          return parsed?.name === 'PairCreated';
        } catch { return false; }
      });

      let pairAddress = '';
      if (pairCreatedEvent) {
        const parsed = factoryContract.interface.parseLog(pairCreatedEvent);
        pairAddress = parsed?.args?.[2] || '';
      }

      toast.success('Trading pair created!', { id: 'pair' });
      setPairCreated({ pairAddress, txHash: tx.hash });

      // Add initial liquidity if selected
      if (addInitialLiquidity && liquidityAmount && tokenLiquidityAmount) {
        await handleAddLiquidity(tokenAddress, deployed);
      } else {
        setStep('complete');
      }
    } catch (error: any) {
      console.error('Create pair error:', error);
      toast.error(error.reason || 'Failed to create pair', { id: 'pair' });
      setStep('deployed');
    }
  };

  const handleAddLiquidity = async (tokenAddress: string, deployed: DeployedToken) => {
    if (!signer || !address) return;

    setStep('adding-liquidity');
    try {
      const decimals = deployed.decimals;
      const tokenAmount = ethers.parseUnits(tokenLiquidityAmount, decimals);
      const pcAmount = ethers.parseEther(liquidityAmount);

      // Approve token first
      toast.loading('Approving token...', { id: 'liquidity' });
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const approveTx = await tokenContract.approve(CONTRACTS.ROUTER, ethers.MaxUint256);
      await approveTx.wait();

      // Add liquidity ETH
      toast.loading('Adding initial liquidity...', { id: 'liquidity' });
      const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 1200;

      const tx = await router.addLiquidityETH(
        tokenAddress,
        tokenAmount,
        0, // min token
        0, // min ETH
        address,
        deadline,
        { value: pcAmount }
      );
      await tx.wait();

      toast.success('Initial liquidity added!', { id: 'liquidity' });
      setStep('complete');
    } catch (error: any) {
      console.error('Add liquidity error:', error);
      toast.error(error.reason || 'Failed to add liquidity', { id: 'liquidity' });
      setStep('deployed');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const resetForm = () => {
    setTokenName('');
    setTokenSymbol('');
    setTokenDecimals('18');
    setTotalSupply('');
    setCreatePair(true);
    setAddInitialLiquidity(false);
    setLiquidityAmount('');
    setTokenLiquidityAmount('');
    setDeployedToken(null);
    setPairCreated(null);
    setStep('configure');
  };

  const stepIndex = ['configure', 'deploying', 'deployed', 'creating-pair', 'adding-liquidity', 'complete'].indexOf(step);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <WaveBackground />
      <Header />

      <main className="relative z-10 pt-24 pb-28 md:pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <HeroSection
            title="Token Launchpad"
            description="Deploy your own ERC20 token on Push Chain and create a trading pair instantly"
            showSpotlight={true}
            showStars={true}
            spotlightColor="hsl(330, 100%, 60%)"
            badge={{
              text: 'Launch Token',
              icon: <Rocket className="w-4 h-4 text-primary" />,
            }}
          />

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {['Configure', 'Deploy', 'Create Pair', 'Complete'].map((label, i) => (
              <React.Fragment key={label}>
                {i > 0 && <div className={cn('w-8 h-px', i <= stepIndex ? 'bg-primary' : 'bg-border')} />}
                <div className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  i < stepIndex ? 'bg-primary/20 text-primary' :
                  i === stepIndex ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                )}>
                  {i < stepIndex ? <CheckCircle className="w-3 h-3" /> : <span>{i + 1}</span>}
                  <span className="hidden sm:inline">{label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Main Card */}
          {step === 'configure' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Token Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Warning */}
                  <div className="p-3 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      This is on <strong className="text-foreground">Push Testnet</strong>. Tokens deployed here are for testing purposes only.
                    </span>
                  </div>

                  {/* Token Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Token Name *</Label>
                      <Input
                        placeholder="e.g. My Token"
                        value={tokenName}
                        onChange={e => setTokenName(e.target.value)}
                        maxLength={32}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Token Symbol *</Label>
                      <Input
                        placeholder="e.g. MTK"
                        value={tokenSymbol}
                        onChange={e => setTokenSymbol(e.target.value.toUpperCase())}
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Total Supply *</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 1000000"
                        value={totalSupply}
                        onChange={e => setTotalSupply(e.target.value)}
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Decimals</Label>
                      <Input
                        type="number"
                        value={tokenDecimals}
                        onChange={e => setTokenDecimals(e.target.value)}
                        min="0"
                        max="18"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Pair Creation Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Auto-create Trading Pair</p>
                          <p className="text-xs text-muted-foreground">Create {tokenSymbol || 'TOKEN'}/WPC pair on PUSHDEX</p>
                        </div>
                      </div>
                      <Switch checked={createPair} onCheckedChange={setCreatePair} />
                    </div>

                    {createPair && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium">Add Initial Liquidity</p>
                              <p className="text-xs text-muted-foreground">Provide initial liquidity with PC</p>
                            </div>
                          </div>
                          <Switch checked={addInitialLiquidity} onCheckedChange={setAddInitialLiquidity} />
                        </div>

                        {addInitialLiquidity && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                            <div className="space-y-2">
                              <Label>{tokenSymbol || 'TOKEN'} Amount</Label>
                              <Input
                                type="number"
                                placeholder="e.g. 100000"
                                value={tokenLiquidityAmount}
                                onChange={e => setTokenLiquidityAmount(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>PC Amount</Label>
                              <Input
                                type="number"
                                placeholder="e.g. 10"
                                value={liquidityAmount}
                                onChange={e => setLiquidityAmount(e.target.value)}
                              />
                            </div>
                            <div className="col-span-2 flex items-start gap-2 text-xs text-muted-foreground">
                              <Info className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>Initial price = {tokenLiquidityAmount && liquidityAmount && parseFloat(liquidityAmount) > 0
                                ? `1 ${tokenSymbol || 'TOKEN'} = ${(parseFloat(liquidityAmount) / parseFloat(tokenLiquidityAmount)).toFixed(6)} PC`
                                : 'Set amounts to see price'
                              }</span>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  <Separator />

                  {/* Summary */}
                  {isFormValid && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2"
                    >
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" /> Launch Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Token:</span>
                        <span className="font-medium">{tokenName} ({tokenSymbol})</span>
                        <span className="text-muted-foreground">Supply:</span>
                        <span className="font-medium">{parseFloat(totalSupply).toLocaleString()}</span>
                        <span className="text-muted-foreground">Create Pair:</span>
                        <span className="font-medium">{createPair ? 'Yes (vs WPC)' : 'No'}</span>
                        {addInitialLiquidity && (
                          <>
                            <span className="text-muted-foreground">Initial Liquidity:</span>
                            <span className="font-medium">{tokenLiquidityAmount} {tokenSymbol} + {liquidityAmount} PC</span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Deploy Button */}
                  {!isConnected ? (
                    <div className="text-center p-6 rounded-xl bg-muted/30 border border-border/50">
                      <p className="text-muted-foreground mb-2">Connect your wallet to deploy tokens</p>
                    </div>
                  ) : (
                    <Button
                      className="w-full gap-2 h-12 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90"
                      onClick={handleDeploy}
                      disabled={!isFormValid || isProcessing}
                    >
                      <Rocket className="w-5 h-5" />
                      Deploy {tokenSymbol || 'Token'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Deploying / Processing State */}
          {(step === 'deploying' || step === 'creating-pair' || step === 'adding-liquidity') && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="glass-card">
                <CardContent className="py-16 text-center">
                  <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
                  <h3 className="text-xl font-bold mb-2">
                    {step === 'deploying' && 'Deploying Token...'}
                    {step === 'creating-pair' && 'Creating Trading Pair...'}
                    {step === 'adding-liquidity' && 'Adding Initial Liquidity...'}
                  </h3>
                  <p className="text-muted-foreground">
                    Please confirm the transaction in your wallet
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Deployed / Complete State */}
          {(step === 'deployed' || step === 'complete') && deployedToken && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Success Card */}
              <Card className="glass-card border-primary/30">
                <CardContent className="py-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    {step === 'complete' ? '🎉 Launch Complete!' : 'Token Deployed!'}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {deployedToken.symbol} has been deployed on Push Chain
                  </p>

                  {/* Token Info */}
                  <div className="max-w-md mx-auto space-y-3 text-left">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                      <span className="text-sm text-muted-foreground">Contract Address</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono">{deployedToken.address.slice(0, 8)}...{deployedToken.address.slice(-6)}</code>
                        <button onClick={() => copyToClipboard(deployedToken.address)} className="text-muted-foreground hover:text-foreground">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <a href={`${BLOCK_EXPLORER}/address/${deployedToken.address}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                      <span className="text-sm text-muted-foreground">Total Supply</span>
                      <span className="text-sm font-medium">{parseFloat(deployedToken.totalSupply).toLocaleString()} {deployedToken.symbol}</span>
                    </div>

                    {pairCreated && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                        <span className="text-sm text-muted-foreground">Trading Pair</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-primary border-primary/30">
                            {deployedToken.symbol}/WPC
                          </Badge>
                          {pairCreated.pairAddress && (
                            <a href={`${BLOCK_EXPLORER}/address/${pairCreated.pairAddress}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {deployedToken.txHash && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                        <span className="text-sm text-muted-foreground">Deploy TX</span>
                        <a href={`${BLOCK_EXPLORER}/tx/${deployedToken.txHash}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" /> Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!pairCreated && (
                    <Link to="/pools/create" className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-3">
                        <Droplets className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">Create Trading Pair</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  )}
                  <Link to="/liquidity" className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-3">
                      <Coins className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">Add More Liquidity</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                  <Link to="/swap" className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">Start Trading</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Link>

                  <Separator />

                  <Button variant="outline" onClick={resetForm} className="w-full gap-2">
                    <Rocket className="w-4 h-4" />
                    Launch Another Token
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Info Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                  <Rocket className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">One-Click Deploy</h3>
                <p className="text-xs text-muted-foreground">Deploy your ERC20 token in seconds with a single transaction.</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mb-3">
                  <Droplets className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Auto Pair Creation</h3>
                <p className="text-xs text-muted-foreground">Automatically create a trading pair on PUSHDEX after deployment.</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5 text-success" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Push Chain Native</h3>
                <p className="text-xs text-muted-foreground">Built on Push Chain testnet for fast, low-cost token launches.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Launchpad;
