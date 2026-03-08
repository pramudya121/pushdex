
CREATE TABLE public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  streak integer NOT NULL DEFAULT 1,
  bonus_points integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wallet_address, checkin_date)
);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read checkins" ON public.daily_checkins FOR SELECT USING (true);
CREATE POLICY "Anyone can insert checkins" ON public.daily_checkins FOR INSERT WITH CHECK (true);

CREATE INDEX idx_checkins_wallet_date ON public.daily_checkins (wallet_address, checkin_date DESC);
