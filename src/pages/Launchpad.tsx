import React, { useState, useCallback, useEffect } from 'react';
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
import { ROUTER_ABI, FACTORY_ABI, ERC20_ABI, TOKEN_FACTORY_ABI } from '@/config/abis';
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
import { TokenExplorer } from '@/components/TokenExplorer';

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
  const [explorerRefresh, setExplorerRefresh] = useState(0);

  const isFactoryDeployed = CONTRACTS.TOKEN_FACTORY && CONTRACTS.TOKEN_FACTORY.length > 0;
  const isFormValid = tokenName.trim() && tokenSymbol.trim() && totalSupply && parseFloat(totalSupply) > 0;

  // Trigger explorer refresh after deploy

  const handleDeploy = useCallback(async () => {
    if (!signer || !address) return;
    if (!isCorrectNetwork) {
      await switchNetwork();
      return;
    }
    if (!isFactoryDeployed) {
      toast.error('TokenFactory contract belum di-deploy.');
      return;
    }

    setIsProcessing(true);
    setStep('deploying');

    try {
      const decimals = parseInt(tokenDecimals) || 18;
      // Pass raw supply as BigInt - contract handles decimals multiplication internally
      const supply = BigInt(totalSupply);

      const factory = new ethers.Contract(CONTRACTS.TOKEN_FACTORY, TOKEN_FACTORY_ABI, signer);

      // Verify contract is accessible first
      try {
        const totalCount = await factory.totalTokens();
        console.log('TokenFactory accessible, total tokens deployed:', totalCount.toString());
      } catch (verifyErr) {
        console.error('Cannot reach TokenFactory contract:', verifyErr);
        toast.error('Cannot reach TokenFactory contract. Check network connection.', { id: 'deploy' });
        setStep('configure');
        setIsProcessing(false);
        return;
      }

      // Encode the function call manually to verify selector
      const calldata = factory.interface.encodeFunctionData('createToken', [tokenName, tokenSymbol, supply, decimals]);
      console.log('Encoded calldata:', calldata);
      console.log('Function selector:', calldata.slice(0, 10));
      console.log('Creating token with params:', { 
        name: tokenName, 
        symbol: tokenSymbol, 
        supply: supply.toString(), 
        supplyHex: '0x' + supply.toString(16),
        decimals 
      });

      toast.loading('Deploying token via TokenFactory...', { id: 'deploy' });
      const tx = await factory.createToken(tokenName, tokenSymbol, supply, decimals, {
        gasLimit: 8000000n,
      });
      console.log('TX sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('TX confirmed, status:', receipt.status);

      // Parse TokenCreated event to get the new token address
      let tokenAddress = '';
      for (const log of receipt.logs) {
        try {
          const parsed = factory.interface.parseLog(log);
          if (parsed?.name === 'TokenCreated') {
            tokenAddress = parsed.args[0]; // token address
            break;
          }
        } catch { /* skip non-factory logs */ }
      }

      if (!tokenAddress) {
        throw new Error('TokenCreated event not found in receipt');
      }

      toast.success(`${tokenSymbol} deployed successfully!`, { id: 'deploy' });

      const deployed: DeployedToken = {
        address: tokenAddress,
        name: tokenName,
        symbol: tokenSymbol,
        decimals,
        totalSupply,
        txHash: tx.hash,
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
  }, [signer, address, isCorrectNetwork, switchNetwork, tokenName, tokenSymbol, tokenDecimals, totalSupply, createPair, isFactoryDeployed]);

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
                  {/* Factory status */}
                  {!isFactoryDeployed && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">TokenFactory belum di-deploy.</strong> Deploy <code className="text-xs bg-muted px-1 py-0.5 rounded">contracts/TokenFactory.sol</code> ke Push Chain lalu update address di <code className="text-xs bg-muted px-1 py-0.5 rounded">contracts.ts</code>.
                      </span>
                    </div>
                  )}

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
                      disabled={!isFormValid || isProcessing || !isFactoryDeployed}
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

          {/* Deployed Tokens List */}
          {myTokens.length > 0 && step === 'configure' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Coins className="w-4 h-4 text-primary" />
                    Deployed Tokens ({myTokens.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {myTokens.map((tokenAddr, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">#{i + 1}</Badge>
                        <code className="text-xs font-mono">{tokenAddr.slice(0, 10)}...{tokenAddr.slice(-8)}</code>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => copyToClipboard(tokenAddr)} className="text-muted-foreground hover:text-foreground transition-colors">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <a href={`${BLOCK_EXPLORER}/address/${tokenAddr}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
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
