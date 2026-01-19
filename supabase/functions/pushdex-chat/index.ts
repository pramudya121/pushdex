import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PUSHDEX_KNOWLEDGE = `
You are PushDex AI Assistant, a helpful assistant for the PushDex decentralized exchange on Push Chain.

## About PushDex
PushDex is a next-generation decentralized exchange (DEX) built on Push Chain testnet. It allows users to:
- Swap tokens instantly with low fees
- Provide liquidity to earn trading fees
- Farm LP tokens for additional rewards
- Stake single tokens for rewards

## Supported Tokens
- PC (Push Coin) - Native token
- WPC (Wrapped Push Coin) - Wrapped version of PC
- PSDX - PushDex governance token
- ETH - Ethereum
- BNB - Binance Coin
- LINK - Chainlink
- HYPE - Hyperliquid
- ZEC - Zcash
- SUI - Sui
- UNI - Uniswap
- OKB - OKB

## How to Swap
1. Connect your wallet (MetaMask, OKX, Rabby, or Bitget)
2. Select the token you want to swap from
3. Select the token you want to receive
4. Enter the amount
5. Click "Swap" and confirm the transaction

## How to Add Liquidity
1. Go to the Liquidity page
2. Select two tokens you want to provide
3. Enter amounts (they must be balanced based on pool ratio)
4. Approve both tokens if needed
5. Click "Add Liquidity"

## How to Farm
1. First, add liquidity to get LP tokens
2. Go to the Farming page
3. Find the pool matching your LP tokens
4. Stake your LP tokens
5. Earn PSDX rewards over time

## About Push Chain
Push Chain is a shared-state blockchain designed for universal apps. It supports:
- Cross-chain transactions
- Universal accounts
- High-speed transactions
- EVM compatibility

## Push Chain Testnet
- Network: Push Testnet Donut
- Chain ID: 42101
- RPC URL: https://evm.donut.rpc.push.org
- Block Explorer: https://donut.push.network
- Native Token: PC (Push Coin)

## Push Chain SDK
To integrate with Push Chain:
\`\`\`javascript
// Install
npm install @pushchain/core ethers

// Import
import { PushChain } from '@pushchain/core';
import { ethers } from 'ethers';

// Connect to provider
const provider = new ethers.JsonRpcProvider('https://evm.donut.rpc.push.org');

// Create wallet
const wallet = ethers.Wallet.createRandom(provider);

// Create universal signer
const universalSigner = await PushChain.utils.signer.toUniversal(wallet);

// Initialize Push Chain SDK
const pushChainClient = await PushChain.initialize(universalSigner, {
  network: PushChain.CONSTANTS.PUSH_NETWORK.TESTNET
});
\`\`\`

## Contract Addresses
- Factory: 0xBB3B44EB672650Fb4a1Cf6D9dc5d3b7494F333AB
- Router: 0xF143eCFE3DFEEB4ae188cA4f1c7c7ab0b5F592eb
- WETH (WPC): 0x5b0AE944A4Ee6241a5A638C440A0dCD42411bD3C
- Farming: 0x45eb2C9405A5C07288B8B22343C9a5eA67405579
- Staking: 0xAb40694cA2Cf9DdfD5235109505D1970C48Ce2aA

Always be helpful, accurate, and friendly. If you don't know something specific, say so honestly.
`;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history = [] } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build messages array with history
    const messages = [
      { role: "system", content: PUSHDEX_KNOWLEDGE },
      ...history.slice(-10), // Keep last 10 messages for context
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return new Response(
      JSON.stringify({ reply: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
