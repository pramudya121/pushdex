import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_CLAIMS_PER_WINDOW = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wallet_address, task_id, tx_hash } = await req.json();

    // Validate inputs
    if (!wallet_address || !task_id) {
      return new Response(JSON.stringify({ error: "Missing wallet_address or task_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wallet = wallet_address.toLowerCase().trim();

    // Basic wallet format validation
    if (!/^0x[a-f0-9]{40}$/i.test(wallet)) {
      return new Response(JSON.stringify({ error: "Invalid wallet address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limit check
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count: recentClaims } = await supabase
      .from("airdrop_claim_log")
      .select("*", { count: "exact", head: true })
      .eq("wallet_address", wallet)
      .gte("attempted_at", windowStart);

    if ((recentClaims || 0) >= MAX_CLAIMS_PER_WINDOW) {
      await supabase.from("airdrop_claim_log").insert({ wallet_address: wallet, success: false });
      return new Response(JSON.stringify({ error: "Rate limited. Please wait before claiming again." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify task exists and is active
    const { data: task, error: taskError } = await supabase
      .from("airdrop_tasks")
      .select("*")
      .eq("id", task_id)
      .eq("active", true)
      .single();

    if (taskError || !task) {
      return new Response(JSON.stringify({ error: "Task not found or inactive" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- ANTI-CHEAT: On-chain tasks REQUIRE a valid tx_hash ---
    if (task.type === "onchain") {
      if (!tx_hash || typeof tx_hash !== "string") {
        await supabase.from("airdrop_claim_log").insert({ wallet_address: wallet, success: false });
        return new Response(JSON.stringify({ error: "On-chain tasks require a valid transaction hash. Complete the transaction first." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate tx_hash format (0x + 64 hex chars)
      if (!/^0x[a-f0-9]{64}$/i.test(tx_hash.trim())) {
        await supabase.from("airdrop_claim_log").insert({ wallet_address: wallet, success: false });
        return new Response(JSON.stringify({ error: "Invalid transaction hash format." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if this tx_hash was already used by anyone
      const { data: existingTx } = await supabase
        .from("airdrop_completions")
        .select("id")
        .eq("tx_hash", tx_hash.trim().toLowerCase())
        .limit(1);

      if (existingTx && existingTx.length > 0) {
        await supabase.from("airdrop_claim_log").insert({ wallet_address: wallet, success: false });
        return new Response(JSON.stringify({ error: "This transaction hash has already been used for a claim." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check duplicate completion
    const { data: existing } = await supabase
      .from("airdrop_completions")
      .select("id")
      .eq("wallet_address", wallet)
      .eq("task_id", task_id)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ error: "Task already completed", already_completed: true }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert completion with tx_hash for on-chain tasks
    const insertData: Record<string, string> = {
      wallet_address: wallet,
      task_id: task_id,
    };
    if (task.type === "onchain" && tx_hash) {
      insertData.tx_hash = tx_hash.trim().toLowerCase();
    }

    const { error: insertError } = await supabase.from("airdrop_completions").insert(insertData);

    if (insertError) {
      if (insertError.code === "23505") {
        return new Response(JSON.stringify({ error: "Task already completed", already_completed: true }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw insertError;
    }

    // Log successful claim
    await supabase.from("airdrop_claim_log").insert({ wallet_address: wallet, success: true });

    return new Response(JSON.stringify({ success: true, points: task.points }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Claim error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
