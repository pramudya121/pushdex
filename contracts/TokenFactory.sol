// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PushDEX Token Factory
 * @notice Deploy custom ERC20 tokens on Push Chain via PUSHDEX Launchpad
 * @dev Deploys minimal ERC20 tokens and emits events for frontend tracking
 * 
 * ===== DEPLOYMENT INSTRUCTIONS =====
 * 
 * OPTION A: Deploy via Remix (recommended)
 * 1. Go to https://remix.ethereum.org
 * 2. Create new file, paste this entire contract
 * 3. Compile with Solidity 0.8.20+
 * 4. In "Deploy & Run", select "Injected Provider - MetaMask"
 * 5. Make sure MetaMask is on Push Testnet Donut:
 *    - Network Name: Push Testnet Donut
 *    - RPC URL: https://evm.donut.rpc.push.org
 *    - Chain ID: 42101
 *    - Symbol: PC
 *    - Explorer: https://donut.push.network
 * 6. Deploy the TokenFactory contract (no constructor args needed)
 * 7. Copy the deployed address and update src/config/contracts.ts:
 *    TOKEN_FACTORY: "0x<deployed_address>"
 * 
 * OPTION B: Deploy via Hardhat
 * 1. npx hardhat run scripts/deploy.js --network pushchain
 * 2. Add to hardhat.config.js:
 *    networks: {
 *      pushchain: {
 *        url: "https://evm.donut.rpc.push.org",
 *        chainId: 42101,
 *        accounts: [PRIVATE_KEY]
 *      }
 *    }
 * ====================================
 */

// Minimal ERC20 token that gets deployed by the factory
contract LaunchToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    address public owner;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalSupply,
        address _owner
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        owner = _owner;
        balanceOf[_owner] = _totalSupply;
        emit Transfer(address(0), _owner, _totalSupply);
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(to != address(0), "Transfer to zero");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(to != address(0), "Transfer to zero");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

contract TokenFactory {
    event TokenCreated(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        uint8 decimals,
        uint256 totalSupply
    );
    
    address[] public deployedTokens;
    mapping(address => address[]) public tokensByCreator;
    
    function createToken(
        string calldata _name,
        string calldata _symbol,
        uint8 _decimals,
        uint256 _totalSupply
    ) external returns (address) {
        LaunchToken token = new LaunchToken(
            _name,
            _symbol,
            _decimals,
            _totalSupply,
            msg.sender
        );
        
        address tokenAddress = address(token);
        deployedTokens.push(tokenAddress);
        tokensByCreator[msg.sender].push(tokenAddress);
        
        emit TokenCreated(tokenAddress, msg.sender, _name, _symbol, _decimals, _totalSupply);
        
        return tokenAddress;
    }
    
    function getDeployedTokensCount() external view returns (uint256) {
        return deployedTokens.length;
    }
    
    function getTokensByCreator(address creator) external view returns (address[] memory) {
        return tokensByCreator[creator];
    }
}
