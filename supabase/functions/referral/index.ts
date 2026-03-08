import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, wallet_address, referral_code } = await req.json();

    if (!wallet_address || !/^0x[a-f0-9]{40}$/i.test(wallet_address)) {
      return new Response(JSON.stringify({ error: "Invalid wallet address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wallet = wallet_address.toLowerCase().trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ACTION: get_or_create_code — ensures the wallet has a referral code
    if (action === "get_code") {
      // Check if code exists
      const { data: existing } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("wallet_address", wallet)
        .limit(1);

      if (existing && existing.length > 0) {
        return new Response(JSON.stringify({ code: existing[0].code }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate unique code: PDX- + 6 random alphanumeric chars
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars
      let code = "PDX-";
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }

      const { error } = await supabase.from("referral_codes").insert({
        wallet_address: wallet,
        code,
      });

      if (error) {
        // Race condition: code already exists, retry with different code
        if (error.code === "23505") {
          // Wallet already has code, fetch it
          const { data: retry } = await supabase
            .from("referral_codes")
            .select("code")
            .eq("wallet_address", wallet)
            .limit(1);
          if (retry && retry.length > 0) {
            return new Response(JSON.stringify({ code: retry[0].code }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
        throw error;
      }

      return new Response(JSON.stringify({ code }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: apply_code — apply a referral code
    if (action === "apply_code") {
      if (!referral_code || typeof referral_code !== "string") {
        return new Response(JSON.stringify({ error: "Missing referral code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const code = referral_code.trim().toUpperCase();

      // Check if already referred
      const { data: alreadyReferred } = await supabase
        .from("airdrop_referrals")
        .select("id")
        .eq("referred_wallet", wallet)
        .limit(1);

      if (alreadyReferred && alreadyReferred.length > 0) {
        return new Response(JSON.stringify({ error: "You already used a referral code", already_referred: true }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Look up referrer by code
      const { data: referrerData } = await supabase
        .from("referral_codes")
        .select("wallet_address")
        .eq("code", code)
        .limit(1);

      if (!referrerData || referrerData.length === 0) {
        return new Response(JSON.stringify({ error: "Invalid referral code. Code not found." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const referrerWallet = referrerData[0].wallet_address;

      // Can't refer yourself
      if (referrerWallet === wallet) {
        return new Response(JSON.stringify({ error: "You can't refer yourself!" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Insert referral
      const { error: insertError } = await supabase.from("airdrop_referrals").insert({
        referral_code: code,
        referrer_wallet: referrerWallet,
        referred_wallet: wallet,
        bonus_points: 5,
      });

      if (insertError) {
        if (insertError.code === "23505") {
          return new Response(JSON.stringify({ error: "Already referred", already_referred: true }), {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw insertError;
      }

      return new Response(JSON.stringify({
        success: true,
        referrer: referrerWallet.slice(0, 6) + "..." + referrerWallet.slice(-4),
        bonus_points: 5,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Referral error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
