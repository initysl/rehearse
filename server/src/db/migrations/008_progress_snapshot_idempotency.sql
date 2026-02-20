ALTER TABLE public.progress_snapshots
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS progress_snapshots_session_id_unique
ON public.progress_snapshots(session_id)
WHERE session_id IS NOT NULL;
