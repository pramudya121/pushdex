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
    const { wallet_address, task_id } = await req.json();

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
      // Log failed attempt
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

    // Check duplicate
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

    // Insert completion
    const { error: insertError } = await supabase.from("airdrop_completions").insert({
      wallet_address: wallet,
      task_id: task_id,
    });

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
