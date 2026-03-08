
-- Add unique constraint to prevent double claims per wallet+task
ALTER TABLE public.airdrop_completions 
ADD CONSTRAINT airdrop_completions_wallet_task_unique 
UNIQUE (wallet_address, task_id);

-- Add rate limiting tracking table
CREATE TABLE public.airdrop_claim_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT true
);

ALTER TABLE public.airdrop_claim_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert claim logs" ON public.airdrop_claim_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read claim logs" ON public.airdrop_claim_log FOR SELECT USING (true);

-- Index for fast rate limit lookups
CREATE INDEX idx_claim_log_wallet_time ON public.airdrop_claim_log (wallet_address, attempted_at DESC);
