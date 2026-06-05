ALTER TABLE public.promotion_histories ALTER COLUMN date TYPE text USING date::text;
