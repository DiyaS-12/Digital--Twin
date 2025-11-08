-- Fix critical security vulnerability: restrict site access to owners only
DROP POLICY IF EXISTS "Users can view all sites" ON public.sites;

CREATE POLICY "Users can view their own sites" 
ON public.sites 
FOR SELECT 
USING (auth.uid() = user_id);