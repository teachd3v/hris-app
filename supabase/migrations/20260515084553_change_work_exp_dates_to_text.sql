ALTER TABLE public.work_experiences ALTER COLUMN start_date TYPE text USING start_date::text;
ALTER TABLE public.work_experiences ALTER COLUMN end_date TYPE text USING end_date::text;
