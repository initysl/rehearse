ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scenarios_select_public_or_owned" ON public.scenarios;
CREATE POLICY "scenarios_select_public_or_owned"
ON public.scenarios
FOR SELECT
TO authenticated
USING (is_custom = FALSE OR created_by = auth.uid());

DROP POLICY IF EXISTS "scenarios_insert_own" ON public.scenarios;
CREATE POLICY "scenarios_insert_own"
ON public.scenarios
FOR INSERT
TO authenticated
WITH CHECK (is_custom = TRUE AND created_by = auth.uid());

DROP POLICY IF EXISTS "scenarios_update_own" ON public.scenarios;
CREATE POLICY "scenarios_update_own"
ON public.scenarios
FOR UPDATE
TO authenticated
USING (is_custom = TRUE AND created_by = auth.uid())
WITH CHECK (is_custom = TRUE AND created_by = auth.uid());

DROP POLICY IF EXISTS "scenarios_delete_own" ON public.scenarios;
CREATE POLICY "scenarios_delete_own"
ON public.scenarios
FOR DELETE
TO authenticated
USING (is_custom = TRUE AND created_by = auth.uid());

DROP POLICY IF EXISTS "sessions_access_own" ON public.sessions;
CREATE POLICY "sessions_access_own"
ON public.sessions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "messages_access_session_owner" ON public.messages;
CREATE POLICY "messages_access_session_owner"
ON public.messages
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id
      AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "feedback_access_session_owner" ON public.feedback;
CREATE POLICY "feedback_access_session_owner"
ON public.feedback
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = session_id
      AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "progress_access_own" ON public.progress_snapshots;
CREATE POLICY "progress_access_own"
ON public.progress_snapshots
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
