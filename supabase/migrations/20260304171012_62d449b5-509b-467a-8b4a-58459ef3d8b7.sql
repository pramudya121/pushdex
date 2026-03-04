
-- Airdrop tasks table
CREATE TABLE public.airdrop_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('onchain', 'social')),
  action TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  link TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Airdrop completions table
CREATE TABLE public.airdrop_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  task_id UUID REFERENCES public.airdrop_tasks(id) ON DELETE CASCADE NOT NULL,
  tx_hash TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_address, task_id)
);

-- Enable RLS
ALTER TABLE public.airdrop_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airdrop_completions ENABLE ROW LEVEL SECURITY;

-- Tasks are publicly readable
CREATE POLICY "Anyone can read active tasks" ON public.airdrop_tasks
  FOR SELECT USING (true);

-- Anyone can insert tasks (admin check done in frontend)
CREATE POLICY "Anyone can insert tasks" ON public.airdrop_tasks
  FOR INSERT WITH CHECK (true);

-- Anyone can update tasks
CREATE POLICY "Anyone can update tasks" ON public.airdrop_tasks
  FOR UPDATE USING (true);

-- Anyone can delete tasks
CREATE POLICY "Anyone can delete tasks" ON public.airdrop_tasks
  FOR DELETE USING (true);

-- Completions are publicly readable (for leaderboard)
CREATE POLICY "Anyone can read completions" ON public.airdrop_completions
  FOR SELECT USING (true);

-- Anyone can insert completions
CREATE POLICY "Anyone can insert completions" ON public.airdrop_completions
  FOR INSERT WITH CHECK (true);

-- Insert default onchain tasks
INSERT INTO public.airdrop_tasks (title, description, type, action, points) VALUES
  ('Perform a Swap', 'Execute a token swap on PushDex', 'onchain', 'swap', 2),
  ('Add Liquidity', 'Provide liquidity to any pool', 'onchain', 'add_liquidity', 2),
  ('Remove Liquidity', 'Remove liquidity from any pool', 'onchain', 'remove_liquidity', 2),
  ('Stake Tokens', 'Stake tokens in any staking pool', 'onchain', 'staking', 2),
  ('Farm LP Tokens', 'Deposit LP tokens in farming', 'onchain', 'farming', 2);
