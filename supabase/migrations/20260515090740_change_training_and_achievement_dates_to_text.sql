ALTER TABLE public.trainings ALTER COLUMN date TYPE text USING date::text;
ALTER TABLE public.achievements ALTER COLUMN date TYPE text USING date::text;
ALTER TABLE public.achievements RENAME COLUMN issuer TO level;
