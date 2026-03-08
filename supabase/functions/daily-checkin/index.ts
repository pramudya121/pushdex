import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Streak bonus: 1pt base, +1 for every 7-day streak milestone
const calcBonus = (streak: number) => 1 + Math.floor(streak / 7);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wallet_address } = await req.json();

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

    const today = new Date().toISOString().split("T")[0];

    // Check if already checked in today
    const { data: todayCheckin } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("wallet_address", wallet)
      .eq("checkin_date", today)
      .limit(1);

    if (todayCheckin && todayCheckin.length > 0) {
      return new Response(JSON.stringify({
        error: "Already checked in today",
        already_checked: true,
        streak: todayCheckin[0].streak,
        bonus_points: todayCheckin[0].bonus_points,
      }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get yesterday's checkin to calculate streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const { data: yesterdayCheckin } = await supabase
      .from("daily_checkins")
      .select("streak")
      .eq("wallet_address", wallet)
      .eq("checkin_date", yesterday)
      .limit(1);

    const prevStreak = yesterdayCheckin && yesterdayCheckin.length > 0 ? yesterdayCheckin[0].streak : 0;
    const newStreak = prevStreak + 1;
    const bonus = calcBonus(newStreak);

    // Insert check-in
    const { error: insertError } = await supabase.from("daily_checkins").insert({
      wallet_address: wallet,
      checkin_date: today,
      streak: newStreak,
      bonus_points: bonus,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return new Response(JSON.stringify({ error: "Already checked in today", already_checked: true }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw insertError;
    }

    return new Response(JSON.stringify({
      success: true,
      streak: newStreak,
      bonus_points: bonus,
      message: `Day ${newStreak} streak! +${bonus} bonus points`,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Daily check-in error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
