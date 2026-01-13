import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Copy, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Coins,
  FileCode,
  Rocket,
  Settings,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import { BLOCK_EXPLORER, CONTRACTS } from '@/config/contracts';

interface RewardSetupGuideProps {
  rewardPerBlock: bigint;
  contractRewardBalance: bigint;
  rewardTokenSymbol: string;
  hasUpdateFunction: boolean;
  isOwner?: boolean;
}

// Solidity contract template with updateRewardPerBlock
const FARMING_CONTRACT_TEMPLATE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MasterChefV2 - Farming Contract with updateRewardPerBlock
 * @notice Stake LP tokens to earn reward tokens
 */
contract MasterChefV2 is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct UserInfo {
        uint256 amount;     // LP tokens staked
        uint256 rewardDebt; // Reward debt
    }

    struct PoolInfo {
        IERC20 lpToken;           // LP token contract
        uint256 allocPoint;       // Allocation points
        uint256 lastRewardBlock;  // Last block rewards distributed
        uint256 accRewardPerShare; // Accumulated rewards per share
    }

    // Reward token
    IERC20 public rewardToken;
    
    // Reward per block - CAN BE UPDATED
    uint256 public rewardPerBlock;
    
    // Start block
    uint256 public startBlock;
    
    // Total allocation points
    uint256 public totalAllocPoint;

    // Pool info array
    PoolInfo[] public poolInfo;
    
    // User info mapping: pid => user address => info
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    // Events
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event RewardPerBlockUpdated(uint256 oldValue, uint256 newValue);
    event PoolAdded(uint256 indexed pid, uint256 allocPoint, address lpToken);

    constructor(
        IERC20 _rewardToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock
    ) Ownable(msg.sender) {
        rewardToken = _rewardToken;
        rewardPerBlock = _rewardPerBlock;
        startBlock = _startBlock;
    }

    /// @notice Returns the number of pools
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    /// @notice Add a new LP pool. Can only be called by owner.
    /// @param _allocPoint Allocation points for this pool
    /// @param _lpToken LP token address
    function add(uint256 _allocPoint, IERC20 _lpToken) external onlyOwner {
        massUpdatePools();
        
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint += _allocPoint;
        
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accRewardPerShare: 0
        }));
        
        emit PoolAdded(poolInfo.length - 1, _allocPoint, address(_lpToken));
    }

    /// @notice Update allocation points. Can only be called by owner.
    /// @param _pid Pool ID
    /// @param _allocPoint New allocation points
    function set(uint256 _pid, uint256 _allocPoint) external onlyOwner {
        massUpdatePools();
        
        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    /// @notice UPDATE REWARD PER BLOCK - This is the key function!
    /// @param _rewardPerBlock New reward per block value
    function updateRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner {
        massUpdatePools();
        
        uint256 oldValue = rewardPerBlock;
        rewardPerBlock = _rewardPerBlock;
        
        emit RewardPerBlockUpdated(oldValue, _rewardPerBlock);
    }

    /// @notice View pending rewards for a user
    /// @param _pid Pool ID
    /// @param _user User address
    function pendingReward(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        
        if (block.number > pool.lastRewardBlock && lpSupply != 0 && totalAllocPoint > 0) {
            uint256 blocks = block.number - pool.lastRewardBlock;
            uint256 reward = blocks * rewardPerBlock * pool.allocPoint / totalAllocPoint;
            accRewardPerShare += reward * 1e12 / lpSupply;
        }
        
        return user.amount * accRewardPerShare / 1e12 - user.rewardDebt;
    }

    /// @notice Update all pools
    function massUpdatePools() public {
        for (uint256 pid = 0; pid < poolInfo.length; ++pid) {
            updatePool(pid);
        }
    }

    /// @notice Update a single pool
    /// @param _pid Pool ID
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        
        if (lpSupply == 0 || totalAllocPoint == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        
        uint256 blocks = block.number - pool.lastRewardBlock;
        uint256 reward = blocks * rewardPerBlock * pool.allocPoint / totalAllocPoint;
        
        pool.accRewardPerShare += reward * 1e12 / lpSupply;
        pool.lastRewardBlock = block.number;
    }

    /// @notice Deposit LP tokens
    /// @param _pid Pool ID
    /// @param _amount Amount to deposit
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePool(_pid);
        
        // Transfer pending rewards
        if (user.amount > 0) {
            uint256 pending = user.amount * pool.accRewardPerShare / 1e12 - user.rewardDebt;
            if (pending > 0) {
                safeRewardTransfer(msg.sender, pending);
            }
        }
        
        // Transfer LP tokens
        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
            user.amount += _amount;
        }
        
        user.rewardDebt = user.amount * pool.accRewardPerShare / 1e12;
        
        emit Deposit(msg.sender, _pid, _amount);
    }

    /// @notice Withdraw LP tokens
    /// @param _pid Pool ID
    /// @param _amount Amount to withdraw
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        require(user.amount >= _amount, "withdraw: insufficient balance");
        
        updatePool(_pid);
        
        // Transfer pending rewards
        uint256 pending = user.amount * pool.accRewardPerShare / 1e12 - user.rewardDebt;
        if (pending > 0) {
            safeRewardTransfer(msg.sender, pending);
        }
        
        // Transfer LP tokens
        if (_amount > 0) {
            user.amount -= _amount;
            pool.lpToken.safeTransfer(msg.sender, _amount);
        }
        
        user.rewardDebt = user.amount * pool.accRewardPerShare / 1e12;
        
        emit Withdraw(msg.sender, _pid, _amount);
    }

    /// @notice Emergency withdraw without caring about rewards
    /// @param _pid Pool ID
    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        
        pool.lpToken.safeTransfer(msg.sender, amount);
        
        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }

    /// @notice Safe reward transfer (in case of rounding errors)
    function safeRewardTransfer(address _to, uint256 _amount) internal {
        uint256 balance = rewardToken.balanceOf(address(this));
        if (_amount > balance) {
            rewardToken.safeTransfer(_to, balance);
        } else {
            rewardToken.safeTransfer(_to, _amount);
        }
    }

    /// @notice Withdraw reward tokens (owner only, for emergencies)
    /// @param _amount Amount to withdraw
    function withdrawRewards(uint256 _amount) external onlyOwner {
        uint256 balance = rewardToken.balanceOf(address(this));
        require(_amount <= balance, "Insufficient balance");
        rewardToken.safeTransfer(msg.sender, _amount);
    }
}`;

export const RewardSetupGuide: React.FC<RewardSetupGuideProps> = ({
  rewardPerBlock,
  contractRewardBalance,
  rewardTokenSymbol,
  hasUpdateFunction,
  isOwner = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('status');

  const rewardBalanceFormatted = parseFloat(ethers.formatEther(contractRewardBalance)).toFixed(4);
  const rewardPerBlockFormatted = parseFloat(ethers.formatEther(rewardPerBlock)).toFixed(8);
  
  const isRewardSet = rewardPerBlock > BigInt(0);
  const hasBalance = contractRewardBalance > ethers.parseEther('0.001');
  const isFullyConfigured = isRewardSet && hasBalance;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Calculate steps completion
  const steps = [
    { 
      label: 'Deploy Contract with updateRewardPerBlock', 
      complete: hasUpdateFunction,
      critical: !hasUpdateFunction 
    },
    { 
      label: 'Fund Contract with Reward Tokens', 
      complete: hasBalance,
      critical: false 
    },
    { 
      label: 'Set rewardPerBlock > 0', 
      complete: isRewardSet,
      critical: !isRewardSet 
    },
    { 
      label: 'Add Farming Pools', 
      complete: true, // Assuming pools exist if user sees this
      critical: false 
    },
  ];

  const completedSteps = steps.filter(s => s.complete).length;

  if (isFullyConfigured && hasUpdateFunction) {
    return null; // Don't show if everything is configured
  }

  return (
    <Card className="glass-card border-warning/50 mb-6 animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg text-warning flex items-center gap-2">
                Earned Rewards Not Active
                <Badge variant="outline" className="border-warning text-warning">
                  {completedSteps}/{steps.length} Complete
                </Badge>
              </CardTitle>
              <CardDescription>
                Follow these steps to activate reward distribution
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-warning/10"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 animate-fade-in">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="solution">Solution</TabsTrigger>
              <TabsTrigger value="contract">Contract</TabsTrigger>
            </TabsList>

            <TabsContent value="status" className="space-y-4 mt-4">
              {/* Status Checklist */}
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      step.complete 
                        ? 'bg-success/10 border-success/30' 
                        : step.critical
                        ? 'bg-destructive/10 border-destructive/30 animate-pulse'
                        : 'bg-warning/10 border-warning/30'
                    }`}
                  >
                    {step.complete ? (
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    ) : step.critical ? (
                      <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
                    )}
                    <span className={`text-sm ${step.complete ? 'text-success' : step.critical ? 'text-destructive' : 'text-warning'}`}>
                      {index + 1}. {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Current Values */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">rewardPerBlock</p>
                  <p className={`font-mono text-sm ${isRewardSet ? 'text-success' : 'text-destructive'}`}>
                    {rewardPerBlockFormatted} {rewardTokenSymbol}
                  </p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Contract Balance</p>
                  <p className={`font-mono text-sm ${hasBalance ? 'text-success' : 'text-warning'}`}>
                    {rewardBalanceFormatted} {rewardTokenSymbol}
                  </p>
                </div>
              </div>

              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">updateRewardPerBlock Function</p>
                <p className={`font-mono text-sm ${hasUpdateFunction ? 'text-success' : 'text-destructive'}`}>
                  {hasUpdateFunction ? '✓ Available' : '✗ Not Available - Contract upgrade required'}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="solution" className="space-y-4 mt-4">
              {!hasUpdateFunction ? (
                <Alert className="border-destructive/50 bg-destructive/10">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    <strong>Critical:</strong> Current contract doesn't have <code className="bg-background/50 px-1 rounded">updateRewardPerBlock</code> function.
                    You need to deploy a new farming contract.
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  Step-by-Step Solution
                </h4>

                {/* Step 1 */}
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={hasUpdateFunction ? "outline" : "destructive"}>Step 1</Badge>
                    <span className="font-medium">Deploy New Farming Contract</span>
                    {hasUpdateFunction && <CheckCircle className="w-4 h-4 text-success ml-auto" />}
                  </div>
                  {!hasUpdateFunction && (
                    <div className="text-sm text-muted-foreground">
                      <p>Go to the "Contract" tab and copy the Solidity code. Then:</p>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Open <a href="https://remix.ethereum.org" target="_blank" rel="noopener noreferrer" className="text-primary underline">Remix IDE</a></li>
                        <li>Create new file and paste the contract code</li>
                        <li>Compile with Solidity 0.8.19+</li>
                        <li>Deploy to Pushchain Testnet with:
                          <ul className="list-disc list-inside ml-4 mt-1 text-xs">
                            <li>rewardToken: Your reward token address</li>
                            <li>rewardPerBlock: e.g., 1000000000000000 (0.001 tokens)</li>
                            <li>startBlock: Current block number</li>
                          </ul>
                        </li>
                        <li>Update <code className="bg-muted px-1 rounded">CONTRACTS.FARMING</code> in contracts.ts</li>
                      </ol>
                    </div>
                  )}
                </div>

                {/* Step 2 */}
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={hasBalance ? "outline" : "secondary"}>Step 2</Badge>
                    <span className="font-medium">Fund Contract with Reward Tokens</span>
                    {hasBalance && <CheckCircle className="w-4 h-4 text-success ml-auto" />}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Transfer {rewardTokenSymbol} tokens to the farming contract:</p>
                    <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded">
                      <code className="text-xs flex-1 truncate">{CONTRACTS.FARMING}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(CONTRACTS.FARMING, 'Contract address')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="mt-2">Or use the Admin page to fund the contract.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={isRewardSet ? "outline" : "secondary"}>Step 3</Badge>
                    <span className="font-medium">Set rewardPerBlock &gt; 0</span>
                    {isRewardSet && <CheckCircle className="w-4 h-4 text-success ml-auto" />}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {hasUpdateFunction ? (
                      <p>Use the Admin page to set reward per block. Recommended: 0.001 - 1 {rewardTokenSymbol}/block</p>
                    ) : (
                      <p className="text-destructive">
                        Cannot set - contract doesn't have updateRewardPerBlock. Complete Step 1 first.
                      </p>
                    )}
                  </div>
                </div>

                {/* Step 4 */}
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Step 4</Badge>
                    <span className="font-medium">Users Can Now Earn Rewards!</span>
                    <CheckCircle className="w-4 h-4 text-success ml-auto" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Once all steps are complete, staked users will automatically earn rewards every block.
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contract" className="space-y-4 mt-4">
              <Alert className="border-primary/50 bg-primary/10">
                <FileCode className="h-4 w-4 text-primary" />
                <AlertDescription>
                  This is a complete MasterChef-style farming contract with <code>updateRewardPerBlock</code> function.
                  Deploy using Remix IDE to Pushchain Testnet.
                </AlertDescription>
              </Alert>

              <div className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => copyToClipboard(FARMING_CONTRACT_TEMPLATE, 'Contract code')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Contract
                </Button>
                <pre className="bg-muted/50 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                  <code>{FARMING_CONTRACT_TEMPLATE}</code>
                </pre>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open('https://remix.ethereum.org', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Remix IDE
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`${BLOCK_EXPLORER}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Block Explorer
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
};
