-- Add ktp_address to employees table
ALTER TABLE public.employees ADD COLUMN ktp_address text;

-- Add files JSONB column to employee_documents table
ALTER TABLE public.employee_documents ADD COLUMN files jsonb DEFAULT '[]'::jsonb;

-- Comment on the new columns
COMMENT ON COLUMN public.employees.ktp_address IS 'Alamat sesuai KTP karyawan';
COMMENT ON COLUMN public.employee_documents.files IS 'Array of file metadata [{url, name, size, type}] for multiple file uploads';
