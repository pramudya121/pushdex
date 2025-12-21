// PUSHDEX Contract Addresses on Pushchain Testnet
export const CHAIN_ID = 42101;
export const CHAIN_NAME = "Push Testnet Donut";
export const RPC_URL = "https://evm.donut.rpc.push.org";
export const BLOCK_EXPLORER = "https://donut.push.network";
export const NATIVE_SYMBOL = "PC";

export const CONTRACTS = {
  FACTORY: "0xBB3B44EB672650Fb4a1Cf6D9dc5d3b7494F333AB",
  ROUTER: "0xF143eCFE3DFEEB4ae188cA4f1c7c7ab0b5F592eb",
  WETH: "0x5b0AE944A4Ee6241a5A638C440A0dCD42411bD3C",
  LIBRARY: "0xEa71393074fFCB6d132B8a2b6028CAF952af03A5",
  MULTICALL: "0x98cA063a7066Ae68B395ad49B9f05F2Df510d6B5",
  FARMING: "0x45eb2C9405A5C07288B8B22343C9a5eA67405579",
  STAKING: "0xAb40694cA2Cf9DdfD5235109505D1970C48Ce2aA",
} as const;

export const TOKENS = {
  ETH: {
    address: "0x70af1341F5D5c60F913F6a21C669586C38592510",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    logo: "/tokens/eth.png",
  },
  BNB: {
    address: "0x68F2458954032952d2ddd5D8Ee1d671e6E93Ae6C",
    symbol: "BNB",
    name: "Binance Coin",
    decimals: 18,
    logo: "/tokens/bnb.png",
  },
  PSDX: {
    address: "0x2Bf9ae7D36f6D057fC84d7f3165E9EB870f2e2e7",
    symbol: "PSDX",
    name: "PushDex Token",
    decimals: 18,
    logo: "/tokens/psdx.png",
  },
  WETH: {
    address: "0x5b0AE944A4Ee6241a5A638C440A0dCD42411bD3C",
    symbol: "WPC",
    name: "Wrapped Push Coin",
    decimals: 18,
    logo: "/tokens/wpc.png",
  },
  PC: {
    address: "0x0000000000000000000000000000000000000000",
    symbol: "PC",
    name: "Push Coin",
    decimals: 18,
    logo: "/tokens/pc.png",
    isNative: true,
  },
} as const;

export type TokenInfo = typeof TOKENS[keyof typeof TOKENS];

export const TOKEN_LIST: TokenInfo[] = Object.values(TOKENS);

export const PUSHCHAIN_CONFIG = {
  chainId: `0x${CHAIN_ID.toString(16)}`,
  chainName: CHAIN_NAME,
  nativeCurrency: {
    name: "Push Coin",
    symbol: NATIVE_SYMBOL,
    decimals: 18,
  },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: [BLOCK_EXPLORER],
};
