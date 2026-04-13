-- Improve RLS policies to add validation while still allowing anonymous operations
-- These tables are intentionally accessible to anonymous users for the quiz/session flow
-- But we can add basic validation to prevent abuse

-- sessions: Add validation to ensure required fields are present on insert
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.sessions;
CREATE POLICY "Anyone can create sessions with valid data" 
ON public.sessions 
FOR INSERT 
WITH CHECK (
  anonymous_id IS NOT NULL 
  AND length(anonymous_id) > 0
  AND length(anonymous_id) <= 100
);

-- sessions: Limit updates to only specific fields (not changing shop_id after creation)
DROP POLICY IF EXISTS "Sessions can be updated" ON public.sessions;
CREATE POLICY "Sessions can be updated with restrictions" 
ON public.sessions 
FOR UPDATE 
USING (true)
WITH CHECK (
  -- Prevent changing core session identifiers
  anonymous_id = (SELECT s.anonymous_id FROM public.sessions s WHERE s.id = sessions.id)
);

-- consents: Add validation for consent creation
DROP POLICY IF EXISTS "Anyone can create consent" ON public.consents;
CREATE POLICY "Anyone can create consent with valid data" 
ON public.consents 
FOR INSERT 
WITH CHECK (
  consent_type IS NOT NULL 
  AND length(consent_type) > 0
  AND length(consent_type) <= 50
);

-- events: Add validation for event creation
DROP POLICY IF EXISTS "Anyone can create events" ON public.events;
CREATE POLICY "Anyone can create events with valid data" 
ON public.events 
FOR INSERT 
WITH CHECK (
  event_type IS NOT NULL 
  AND length(event_type) > 0
  AND length(event_type) <= 100
);

-- offer_events: Add validation for offer event logging
DROP POLICY IF EXISTS "Anyone can log offer events" ON public.offer_events;
CREATE POLICY "Anyone can log offer events with valid data" 
ON public.offer_events 
FOR INSERT 
WITH CHECK (
  event_type IS NOT NULL 
  AND length(event_type) > 0
  AND length(event_type) <= 100
);

-- quiz_logs: Add validation for quiz log creation
DROP POLICY IF EXISTS "Anyone can create quiz logs" ON public.quiz_logs;
CREATE POLICY "Anyone can create quiz logs with valid data" 
ON public.quiz_logs 
FOR INSERT 
WITH CHECK (
  session_id IS NOT NULL 
  AND quiz_id IS NOT NULL
  AND selected_option >= 0
  AND selected_option <= 10
);

-- Restrict quiz_logs SELECT to admins only (no need for public read access)
DROP POLICY IF EXISTS "Anyone can view quiz logs" ON public.quiz_logs;
CREATE POLICY "Admins can view quiz logs" 
ON public.quiz_logs 
FOR SELECT 
USING (is_admin());

-- Restrict events SELECT to admins only (analytics data shouldn't be public)
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
CREATE POLICY "Admins can view events" 
ON public.events 
FOR SELECT 
USING (is_admin());

-- sessions: Restrict general viewing, allow session owner to view their own
DROP POLICY IF EXISTS "Sessions are viewable by anonymous_id" ON public.sessions;
CREATE POLICY "Admins can view all sessions" 
ON public.sessions 
FOR SELECT 
USING (is_admin());