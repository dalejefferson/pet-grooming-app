-- Enable Supabase Realtime on subscriptions table
-- Realtime respects RLS — users only see their own org's subscription changes
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
