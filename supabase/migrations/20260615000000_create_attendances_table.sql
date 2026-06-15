-- Create Attendances Table
CREATE TABLE public.attendances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
    date date NOT NULL,
    clock_in timestamptz,
    clock_in_lat numeric,
    clock_in_lng numeric,
    clock_in_photo_url text,
    clock_out timestamptz,
    clock_out_lat numeric,
    clock_out_lng numeric,
    clock_out_photo_url text,
    duration_hours numeric,
    face_match_score numeric,
    status text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(employee_id, date)
);

ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

-- Policy: Karyawan bisa melihat absensinya sendiri dan Admin bisa melihat semua
CREATE POLICY "Users can manage their own attendances" ON public.attendances USING (auth.uid() = employee_id);

-- Create Storage Bucket for Attendances
INSERT INTO storage.buckets (id, name, public) VALUES ('attendances', 'attendances', true) ON CONFLICT DO NOTHING;

-- RLS for attendances bucket
CREATE POLICY "Attendance images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'attendances');
CREATE POLICY "Users can upload their own attendance image." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attendances' AND auth.uid()::text = (storage.foldername(name))[1]);
