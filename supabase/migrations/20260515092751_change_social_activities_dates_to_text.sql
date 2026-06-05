ALTER TABLE public.social_activities ALTER COLUMN start_date TYPE text USING start_date::text;
ALTER TABLE public.social_activities ALTER COLUMN end_date TYPE text USING end_date::text;
