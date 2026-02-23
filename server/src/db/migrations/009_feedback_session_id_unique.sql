-- Keep only the most recent feedback row per session before adding uniqueness.
DELETE FROM public.feedback older
USING public.feedback newer
WHERE older.session_id = newer.session_id
  AND older.id <> newer.id
  AND (
    older.generated_at < newer.generated_at
    OR (
      older.generated_at = newer.generated_at
      AND older.id::text < newer.id::text
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS feedback_session_id_unique
ON public.feedback(session_id);
