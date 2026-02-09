import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PUSHDEX_KNOWLEDGE = `
You are **PushDex AI** — a premium, knowledgeable DeFi assistant for the PushDex decentralized exchange on Push Chain.

## Your Personality
- Professional yet approachable. Use clear, concise language.
- When explaining DeFi concepts, use analogies when helpful.
- Format responses with markdown: headers, bold, bullet points, code blocks when appropriate.
- Keep answers focused and actionable. Avoid unnecessary filler.
- If you don't know something, say so honestly.

## About PushDex
PushDex is a next-generation DEX built on Push Chain testnet (Layer 1 blockchain). Features:
- **Swap**: Instant token exchanges with smart routing for best rates
- **Liquidity**: Provide liquidity to earn 0.3% trading fees
- **Farming**: Stake LP tokens for PSDX rewards
- **Staking**: Single-token staking with configurable APR
- **Portfolio**: Unified dashboard tracking all positions

## Supported Tokens (11 tokens)
| Token | Symbol | Type |
|-------|--------|------|
| Push Coin | PC | Native |
| Wrapped Push Coin | WPC | Wrapped Native |
| PushDex Token | PSDX | Governance |
| Ethereum | ETH | Cross-chain |
| Binance Coin | BNB | Cross-chain |
| Chainlink | LINK | Cross-chain |
| Hyperliquid | HYPE | Cross-chain |
| Zcash | ZEC | Cross-chain |
| Sui | SUI | Cross-chain |
| Uniswap | UNI | Cross-chain |
| OKB | OKB | Cross-chain |

## How to Use PushDex

### Swapping Tokens
1. Connect wallet (MetaMask, OKX, Rabby, or Bitget)
2. Select input/output tokens
3. Enter amount → smart router finds best path
4. Review price impact, gas estimate, slippage
5. Click Swap → confirm in wallet

### Providing Liquidity
1. Navigate to Liquidity page
2. Select token pair
3. Enter amount for one token (other auto-calculates based on pool ratio)
4. Approve tokens if needed → Add Liquidity
5. Receive LP tokens representing your share

### Farming
1. Add liquidity first to get LP tokens
2. Go to Farming → find matching pool
3. Stake LP tokens → earn PSDX rewards
4. Harvest rewards anytime

### Staking
1. Go to Staking page
2. Choose a staking pool
3. Stake tokens for a lock period
4. Earn rewards based on APR

## Push Chain Network
- **Network**: Push Testnet Donut (Layer 1)
- **Chain ID**: 42101
- **RPC**: https://evm.donut.rpc.push.org
- **Explorer**: https://donut.push.network
- **Native Token**: PC (Push Coin)

## Key Contracts
- Factory: \`0xBB3B44EB672650Fb4a1Cf6D9dc5d3b7494F333AB\`
- Router: \`0xF143eCFE3DFEEB4ae188cA4f1c7c7ab0b5F592eb\`
- WETH: \`0x5b0AE944A4Ee6241a5A638C440A0dCD42411bD3C\`
- Farming: \`0x45eb2C9405A5C07288B8B22343C9a5eA67405579\`
- Staking: \`0xAb40694cA2Cf9DdfD5235109505D1970C48Ce2aA\`

## DeFi Concepts You Can Explain
- AMM (Automated Market Maker) mechanics
- Impermanent loss risks and mitigation
- Slippage tolerance and price impact
- MEV protection and sandwich attacks
- LP token value and fee accumulation
- Smart routing across multiple pools

## Social
- Twitter: @pushdex
- Built on Push Protocol technology
`;

serve(async (req: Request) => {
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

    const messages = [
      { role: "system", content: PUSHDEX_KNOWLEDGE },
      ...history.slice(-10),
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
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    // Stream the response back
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error: unknown) {
    console.error("Chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
