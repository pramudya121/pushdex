import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin wallet addresses (lowercase)
const ADMIN_WALLETS = [
  // Add admin wallets here, or empty = all allowed (dev mode)
];

const isAdmin = (wallet: string): boolean => {
  if (ADMIN_WALLETS.length === 0) return true; // dev mode
  return ADMIN_WALLETS.some((w: string) => w.toLowerCase() === wallet.toLowerCase());
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, wallet_address, task } = await req.json();

    if (!wallet_address || !isAdmin(wallet_address)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: not an admin wallet" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role key for admin operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result;

    switch (action) {
      case "create_task": {
        const { data, error } = await supabase.from("airdrop_tasks").insert({
          title: task.title,
          description: task.description || "",
          type: task.type,
          action: task.action,
          points: task.points || 1,
          link: task.link || null,
          active: task.active !== false,
        }).select().single();
        if (error) throw error;
        result = data;
        break;
      }
      case "update_task": {
        const { data, error } = await supabase
          .from("airdrop_tasks")
          .update(task)
          .eq("id", task.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }
      case "delete_task": {
        const { error } = await supabase
          .from("airdrop_tasks")
          .delete()
          .eq("id", task.id);
        if (error) throw error;
        result = { deleted: true };
        break;
      }
      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
