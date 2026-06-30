-- Migration: Create Leave Requests Table & Relations
-- Timestamp: 20260630000000

-- 1. Modifikasi Tabel Employees untuk Relasi Atasan & Kuota Ganti Hari
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS leave_ganti_hari integer DEFAULT 0;

COMMENT ON COLUMN public.employees.manager_id IS 'ID Atasan Langsung (Direct Manager) karyawan';
COMMENT ON COLUMN public.employees.leave_ganti_hari IS 'Kuota ganti hari yang didapatkan dari kerja di hari libur';

-- 2. Pembuatan Tipe ENUM untuk Status dan Kategori Cuti
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_status') THEN
        CREATE TYPE leave_status AS ENUM ('PENDING_DIRECT_MANAGER', 'PENDING_HC_ADMIN', 'APPROVED', 'REJECTED');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_category') THEN
        CREATE TYPE leave_category AS ENUM (
            'Cuti Tahunan', 
            'Cuti Ayah', 
            'Cuti Berkabung', 
            'Cuti Melahirkan', 
            'Cuti Pernikahan', 
            'Cuti Unpaid', 
            'Sakit', 
            'Ganti Hari', 
            'Izin Terlambat', 
            'Izin Pulang Cepat', 
            'Dinas Luar Kota'
        );
    END IF;
END $$;

-- 3. Pembuatan Tabel Leave Requests
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type leave_category NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    duration_days numeric NOT NULL CHECK (duration_days >= 0),
    reason text NOT NULL,
    status leave_status DEFAULT 'PENDING_DIRECT_MANAGER',
    
    -- Khusus Izin Terlambat & Pulang Cepat
    start_time time,
    end_time time,
    
    -- Lampiran (Surat Dokter / Dokumen Pendukung / SPD)
    attachment_url text,
    spd_id uuid,
    
    -- Level 1: Direct Manager Approval
    manager_approved_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
    manager_approved_at timestamptz,
    manager_notes text,
    
    -- Level 2: HC Admin Final Approval
    hc_approved_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
    hc_approved_at timestamptz,
    hc_notes text,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT check_dates CHECK (start_date <= end_date)
);

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- 5. Kebijakan RLS (Policies) untuk leave_requests

-- SELECT: Karyawan melihat milik sendiri, atasan melihat milik bawahan, admin melihat semua, rekan kerja melihat yang APPROVED di dept yang sama
CREATE POLICY "Users can view their own leave requests" 
ON public.leave_requests FOR SELECT 
USING (auth.uid() = employee_id);

CREATE POLICY "Managers can view subordinates leave requests" 
ON public.leave_requests FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.employees 
        WHERE id = leave_requests.employee_id AND manager_id = auth.uid()
    )
);

CREATE POLICY "Same department can view approved leave requests" 
ON public.leave_requests FOR SELECT 
USING (
    status = 'APPROVED' AND
    EXISTS (
        SELECT 1 FROM public.employees e1
        JOIN public.employees e2 ON e1.dept = e2.dept
        WHERE e1.id = auth.uid() AND e2.id = leave_requests.employee_id
    )
);

CREATE POLICY "Admin can view all leave requests" 
ON public.leave_requests FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.employees 
        WHERE id = auth.uid() AND role = 'Admin'
    )
);

-- INSERT: Hanya bisa membuat atas nama sendiri
CREATE POLICY "Users can create their own leave requests" 
ON public.leave_requests FOR INSERT 
WITH CHECK (auth.uid() = employee_id);

-- UPDATE: Karyawan (jika pending), Manager (jika di-assign), Admin (semua)
CREATE POLICY "Users can update their own pending leave requests" 
ON public.leave_requests FOR UPDATE 
USING (auth.uid() = employee_id AND status = 'PENDING_DIRECT_MANAGER')
WITH CHECK (auth.uid() = employee_id AND status = 'PENDING_DIRECT_MANAGER');

CREATE POLICY "Managers can approve/reject subordinate leave requests" 
ON public.leave_requests FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.employees 
        WHERE id = leave_requests.employee_id AND manager_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.employees 
        WHERE id = leave_requests.employee_id AND manager_id = auth.uid()
    )
);

CREATE POLICY "Admin can update all leave requests" 
ON public.leave_requests FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.employees 
        WHERE id = auth.uid() AND role = 'Admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.employees 
        WHERE id = auth.uid() AND role = 'Admin'
    )
);

-- DELETE: Karyawan (jika pending), Admin (semua)
CREATE POLICY "Users can delete their own pending leave requests" 
ON public.leave_requests FOR DELETE 
USING (auth.uid() = employee_id AND status = 'PENDING_DIRECT_MANAGER');

CREATE POLICY "Admin can delete any leave requests" 
ON public.leave_requests FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.employees 
        WHERE id = auth.uid() AND role = 'Admin'
    )
);

-- 6. Trigger Pengurangan Kuota Cuti Otomatis
CREATE OR REPLACE FUNCTION public.handle_leave_approval_quota()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED')) THEN
        -- 1. Jika Cuti Tahunan
        IF NEW.leave_type = 'Cuti Tahunan' THEN
            UPDATE public.employees
            SET leave_used = leave_used + NEW.duration_days
            WHERE id = NEW.employee_id;
            
        -- 2. Jika Ganti Hari
        ELSIF NEW.leave_type = 'Ganti Hari' THEN
            UPDATE public.employees
            SET leave_ganti_hari = GREATEST(0, leave_ganti_hari - NEW.duration_days)
            WHERE id = NEW.employee_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_leave_approved
AFTER UPDATE OF status ON public.leave_requests
FOR EACH ROW
WHEN (NEW.status = 'APPROVED')
EXECUTE FUNCTION public.handle_leave_approval_quota();

-- 7. Pembuatan Bucket untuk Lampiran Cuti
INSERT INTO storage.buckets (id, name, public) VALUES ('leave_attachments', 'leave_attachments', true) ON CONFLICT DO NOTHING;

-- Kebijakan RLS untuk Bucket Lampiran Cuti
CREATE POLICY "Leave attachments are publicly accessible." 
ON storage.objects FOR SELECT 
USING (bucket_id = 'leave_attachments');

CREATE POLICY "Users can upload their own leave attachments." 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'leave_attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own leave attachments." 
ON storage.objects FOR UPDATE 
USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own leave attachments." 
ON storage.objects FOR DELETE 
USING (auth.uid()::text = (storage.foldername(name))[1]);
