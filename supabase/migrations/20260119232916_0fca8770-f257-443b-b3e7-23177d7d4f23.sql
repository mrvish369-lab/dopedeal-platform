-- Create rate limiting helper functions

-- Check if too many sessions created by this anonymous_id recently (max 10 per hour)
CREATE OR REPLACE FUNCTION public.check_session_rate_limit(p_anonymous_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM sessions
  WHERE anonymous_id = p_anonymous_id
    AND created_at > now() - interval '1 hour';
  
  RETURN recent_count < 10;
END;
$$;

-- Check if too many events logged for this session recently (max 100 per minute)
CREATE OR REPLACE FUNCTION public.check_event_rate_limit(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Allow null session_id (for events without sessions)
  IF p_session_id IS NULL THEN
    RETURN true;
  END IF;
  
  SELECT COUNT(*) INTO recent_count
  FROM events
  WHERE session_id = p_session_id
    AND created_at > now() - interval '1 minute';
  
  RETURN recent_count < 100;
END;
$$;

-- Check offer_events rate limit (max 50 per minute per session)
CREATE OR REPLACE FUNCTION public.check_offer_event_rate_limit(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  IF p_session_id IS NULL THEN
    RETURN true;
  END IF;
  
  SELECT COUNT(*) INTO recent_count
  FROM offer_events
  WHERE session_id = p_session_id
    AND created_at > now() - interval '1 minute';
  
  RETURN recent_count < 50;
END;
$$;

-- Update sessions INSERT policy with rate limiting
DROP POLICY IF EXISTS "Anyone can create sessions with valid data" ON public.sessions;
CREATE POLICY "Anyone can create sessions with rate limit" 
ON public.sessions 
FOR INSERT 
WITH CHECK (
  anonymous_id IS NOT NULL 
  AND length(anonymous_id) > 0
  AND length(anonymous_id) <= 100
  AND check_session_rate_limit(anonymous_id)
);

-- Update events INSERT policy with rate limiting
DROP POLICY IF EXISTS "Anyone can create events with valid data" ON public.events;
CREATE POLICY "Anyone can create events with rate limit" 
ON public.events 
FOR INSERT 
WITH CHECK (
  event_type IS NOT NULL 
  AND length(event_type) > 0
  AND length(event_type) <= 100
  AND check_event_rate_limit(session_id)
);

-- Update offer_events INSERT policy with rate limiting
DROP POLICY IF EXISTS "Anyone can log offer events with valid data" ON public.offer_events;
CREATE POLICY "Anyone can log offer events with rate limit" 
ON public.offer_events 
FOR INSERT 
WITH CHECK (
  event_type IS NOT NULL 
  AND length(event_type) > 0
  AND length(event_type) <= 100
  AND check_offer_event_rate_limit(session_id)
);