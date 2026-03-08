
-- Add a referral_codes table to properly map codes to wallets
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read referral codes" ON public.referral_codes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert referral codes" ON public.referral_codes FOR INSERT WITH CHECK (true);

CREATE INDEX idx_referral_codes_code ON public.referral_codes (code);
CREATE INDEX idx_referral_codes_wallet ON public.referral_codes (wallet_address);
