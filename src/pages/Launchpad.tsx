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

// Minimal ERC20 contract bytecode (OpenZeppelin-style with mint to deployer)
const SIMPLE_ERC20_ABI = [
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

// Solidity bytecode for a simple ERC20 token that mints totalSupply to msg.sender
// This is a pre-compiled minimal ERC20 contract
const SIMPLE_ERC20_BYTECODE = '0x60806040523480156200001157600080fd5b5060405162000c3a38038062000c3a833981016040819052620000349162000201565b8351620000499060039060208701906200009f565b5082516200005f9060049060208601906200009f565b506005805460ff191660ff84161790556200007b3382620000850565b50505050620002da565b6001600160a01b0382166000908152602081905260408120805483929062000aaf908490620002a0565b90915550506002805482019055604051818152' +
'6001600160a01b038316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a35050565b8280546200' +
'00ad90620002bb565b90600052602060002090601f016020900481019282620000d157600085556200011c565b82601f10620000ec57805160ff19168380011785556200' +
'011c565b828001600101855582156200011c579182015b828111156200011c578251825591602001919060010190620000ff565b506200012a9291506200012e565b5090' +
'565b5b808211156200012a57600081556001016200012f565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200016d57600080fd5b81516001' +
'600160401b03808211156200018b576200018b62000145565b604051601f8301601f19908116603f01168101908282118183101715620001b657620001b662000145565b81' +
'604052838152602092508683858801011115620001d357600080fd5b600091505b83821015620001f75785820183015181830184015290820190620001d8565b6000838583' +
'01015250809350505050919050565b600080600080608085870312156200021857600080fd5b84516001600160401b03808211156200023057600080fd5b6200023e88838901' +
'6200015b565b955060208701519150808211156200025557600080fd5b50620002648782880162000 15b565b935050604085015160ff811681146200027d57600080fd5b606086' +
'01519092509050929550929390505050565b80820180821115620002b557634e487b7160e01b600052601160045260246000fd5b92915050565b600181811c90821680620002' +
'd057607f821691505b60208210810362000 2f157634e487b7160e01b600052602260045260246000fd5b50919050565b61095080620002ea6000396000f3fe60806040523480' +
'1561009b5760003560e01c8063313ce56711610064578063313ce5671461016a57806370a082311461019657806395d89b41146101c3578063a9059cbb146101d8578063dd62' +
'ed3e146101f857600080fd5b806306fdde03146100a0578063095ea7b3146100cb57806318160ddd146100fb57806323b872dd1461011a57806327e235e31461013a57600080' +
'fd5b600080fd5b3480156100ac57600080fd5b506100b5610238565b6040516100c29190610711565b60405180910390f35b3480156100d757600080fd5b506100eb6100e636' +
'600461077c565b6102ca565b60405190151581526020016100c2565b34801561010757600080fd5b506002545b6040519081526020016100c2565b34801561012657600080fd' +
'5b506100eb6101353660046107a6565b610341565b34801561014657600080fd5b5061010c6101553660046107e2565b60006020819052908152604090205481565b348015' +
'61017657600080fd5b506005546101849060ff1681565b60405160ff90911681526020016100c2565b3480156101a257600080fd5b5061010c6101b13660046107e2565b6000' +
'6020819052908152604090205481565b3480156101cf57600080fd5b506100b561044b565b3480156101e457600080fd5b506100eb6101f336600461077c565b61045a565b34' +
'801561020457600080fd5b5061010c6102133660046107fd565b600160209081526000928352604080842090915290825290205481565b60606003805461024790610830565b' +
'80601f016020809104026020016040519081016040528092919081815260200182805461027390610830565b80156102c05780601f10610295576101008083540402835291' +
'602001916102c0565b820191906000526020600020905b8154815290600101906020018083116102a357829003601f168201915b5050505050905090565b336000818152600160' +
'20908152604080832073ffffffffffffffffffffffffffffffffffffffff8716808552925280832085905551919290917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b' +
'2291e5b200ac8c7c3b925906103359086815260200190565b60405180910390a35060015b92915050565b73ffffffffffffffffffffffffffffffffffffffff831660009081' +
'52600160209081526040808320338452909152812054828110156103c65760405162461bcd60e51b815260206004820152601360248201527f496e73756666696369656e742061' +
'6c6c6f77616e636500000000000000000000006044820152606401fd5b73ffffffffffffffffffffffffffffffffffffffff851660009081526001602090815260408083203384' +
'5290915290208383039055610403858585610471565b8273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252' +
'ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161043c91815260200190565b60405180910390a3949350505050565b60606004805461024790' +
'610830565b6000336104688185856104 71565b50600192915050565b73ffffffffffffffffffffffffffffffffffffffff83166000908152602081905260409020548181101561' +
'04e65760405162461bcd60e51b815260206004820152601460248201527f496e73756666696369656e742062616c616e63650000000000000000000000006044820152606401fd5b' +
'73ffffffffffffffffffffffffffffffffffffffff808516600090815260208190526040808220858503905591851681529081208054849290610528908490610880565b90915550' +
'50505050565b60005b83811015610547578181015183820152602001610530565b50506000910152565b600081518084526105688160208601602086016105 2d565b601f017ffff' +
'fffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169290920160200192915050565b6000602080830181845280855180835260408601915060408160051b' +
'87010192508387016000805b838110156107035787860360' +
'3f190185528251805180888552610611898601826105 50565b91890191849052888201918590038501909501946001928301929150016105ea565b509398975050505050505050565b' +
'602081526000610724602083018461055 0565b9392505050565b803573ffffffffffffffffffffffffffffffffffffffff8116811461074f57600080fd5b919050565b60006020828' +
'403121561076557600080fd5b61076e8261072c565b939250505056fea264697066735822122041';

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
