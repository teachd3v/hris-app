-- Create Employees Table
CREATE TABLE public.employees (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_code text UNIQUE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  nik text,
  birth_date date,
  gender text,
  nationality text,
  marital_status text,
  religion text,
  address text,
  city text,
  province text,
  postal_code text,
  country text,
  title text,
  dept text,
  level text,
  status text,
  join_date date,
  tenure text,
  manager text,
  bank text,
  leave_total integer DEFAULT 12,
  leave_used integer DEFAULT 0,
  attendance_present integer DEFAULT 0,
  attendance_late integer DEFAULT 0,
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profile" ON public.employees USING (auth.uid() = id);

-- Create Family Members Table
CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  relationship text NOT NULL,
  name text NOT NULL,
  birth_date date,
  occupation text,
  phone text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their family members" ON public.family_members USING (auth.uid() = employee_id);

-- Create Emergency Contacts Table
CREATE TABLE public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text NOT NULL,
  phone text NOT NULL,
  address text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their emergency contacts" ON public.emergency_contacts USING (auth.uid() = employee_id);

-- Create Work Experiences Table
CREATE TABLE public.work_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  company text NOT NULL,
  position text NOT NULL,
  start_date date,
  end_date date,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.work_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their work experiences" ON public.work_experiences USING (auth.uid() = employee_id);

-- Create Promotion History Table
CREATE TABLE public.promotion_histories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text NOT NULL,
  from_position text,
  to_position text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.promotion_histories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their promotion histories" ON public.promotion_histories USING (auth.uid() = employee_id);

-- Create Educations Table
CREATE TABLE public.educations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  institution text NOT NULL,
  level text NOT NULL,
  field text,
  year text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.educations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their educations" ON public.educations USING (auth.uid() = employee_id);

-- Create Non Formal Educations Table
CREATE TABLE public.non_formal_educations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  institution text NOT NULL,
  year text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.non_formal_educations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their non formal educations" ON public.non_formal_educations USING (auth.uid() = employee_id);

-- Create Languages Table
CREATE TABLE public.languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  proficiency text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their languages" ON public.languages USING (auth.uid() = employee_id);

-- Create Skills Table
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  proficiency text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their skills" ON public.skills USING (auth.uid() = employee_id);

-- Create Trainings Table
CREATE TABLE public.trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  provider text NOT NULL,
  date date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their trainings" ON public.trainings USING (auth.uid() = employee_id);

-- Create Career Interests Table
CREATE TABLE public.career_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  position text NOT NULL,
  department text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.career_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their career interests" ON public.career_interests USING (auth.uid() = employee_id);

-- Create Org Experiences Table
CREATE TABLE public.org_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  organization text NOT NULL,
  role text NOT NULL,
  period text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.org_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their org experiences" ON public.org_experiences USING (auth.uid() = employee_id);

-- Create Social Activities Table
CREATE TABLE public.social_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  activity text NOT NULL,
  organization text NOT NULL,
  role text NOT NULL,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.social_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their social activities" ON public.social_activities USING (auth.uid() = employee_id);

-- Create Committee Experiences Table
CREATE TABLE public.committee_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  event text NOT NULL,
  role text NOT NULL,
  year text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.committee_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their committee experiences" ON public.committee_experiences USING (auth.uid() = employee_id);

-- Create Achievements Table
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  issuer text NOT NULL,
  date date,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their achievements" ON public.achievements USING (auth.uid() = employee_id);

-- Create Employee Documents Table
CREATE TABLE public.employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL,
  size text,
  date date,
  category text NOT NULL,
  sub_category text,
  file_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their documents" ON public.employee_documents USING (auth.uid() = employee_id);

-- Create Storage Buckets (requires executing via Supabase Dashboard or superuser role if on self-hosted)
-- We will assume the user has to create the buckets 'avatars' and 'documents' via the dashboard,
-- but we can add the bucket configuration if the migration runs with correct privileges:
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT DO NOTHING;

-- RLS for avatars bucket
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar." ON storage.objects FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar." ON storage.objects FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- RLS for documents bucket
CREATE POLICY "Users can view their own documents." ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload their own documents." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own documents." ON storage.objects FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own documents." ON storage.objects FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
