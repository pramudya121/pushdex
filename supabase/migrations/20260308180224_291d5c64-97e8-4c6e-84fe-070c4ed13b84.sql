-- Add unique constraint to prevent duplicate task claims
ALTER TABLE public.airdrop_completions 
ADD CONSTRAINT unique_wallet_task UNIQUE (wallet_address, task_id);

-- Make airdrop_tasks DELETE/UPDATE/INSERT policies more restrictive
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can delete tasks" ON public.airdrop_tasks;
DROP POLICY IF EXISTS "Anyone can insert tasks" ON public.airdrop_tasks;
DROP POLICY IF EXISTS "Anyone can update tasks" ON public.airdrop_tasks;

-- Create restrictive SELECT-only policy for airdrop_tasks (management via edge function)
-- Tasks should be readable by everyone but only manageable via edge functions with service role key
CREATE POLICY "Tasks are read-only for anon"
ON public.airdrop_tasks
FOR SELECT
TO anon
USING (true);