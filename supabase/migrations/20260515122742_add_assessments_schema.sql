-- Create Assessment Templates Table
CREATE TABLE public.assessment_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  description text,
  opening_text text,
  schema jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Assessment templates are viewable by everyone" ON public.assessment_templates FOR SELECT USING (true);
CREATE POLICY "Only admins can insert assessment templates" ON public.assessment_templates FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Only admins can update assessment templates" ON public.assessment_templates FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Only admins can delete assessment templates" ON public.assessment_templates FOR DELETE USING (auth.role() = 'service_role');

-- Create Employee Assessments Table
CREATE TABLE public.employee_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.assessment_templates(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Belum Diisi',
  deadline date,
  answers jsonb,
  score numeric,
  feedback text,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.employee_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own assessments" ON public.employee_assessments FOR SELECT USING (auth.uid() = employee_id);
CREATE POLICY "Users can update their own assessments" ON public.employee_assessments FOR UPDATE USING (auth.uid() = employee_id);
CREATE POLICY "Admins can insert employee assessments" ON public.employee_assessments FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Admins can delete employee assessments" ON public.employee_assessments FOR DELETE USING (auth.role() = 'service_role');

-- Seed Data for the first template (Self-Assessment Motivasi Kerja)
INSERT INTO public.assessment_templates (id, title, category, description, opening_text, schema)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Self-Assessment Motivasi Kerja (SDT)',
  'SELF-ASSESSMENT',
  'Evaluasi mandiri mengenai motivasi bekerja berdasarkan Self Determination Theory (SDT) untuk memahami dorongan internal dan eksternal Anda.',
  'Dalam upaya menjaga kualitas SDM dan memastikan keberlanjutan kontribusi setiap karyawan, Transformative EduAction Hub (TEACH) sebagai bagian dari Yayasan Pendidikan Umar Usman (YPUU) mengajak rekan-rekan untuk mengikuti proses Self Assessment.

Proses ini kami hadirkan sebagai ruang refleksi bersama—agar setiap individu dapat melihat kembali perjalanan, kontribusi, serta hal-hal yang masih bisa dikembangkan ke depan. Kami mengajak rekan-rekan untuk mengisi dengan jujur, terbuka, dan profesional.

Perlu kami sampaikan bahwa hasil self assessment bukanlah satu-satunya dasar dalam pengambilan keputusan, melainkan menjadi bagian dari proses evaluasi yang lebih menyeluruh bersama atasan dan manajemen.

Kami berharap, proses ini dapat menjadi momen untuk saling memahami, bertumbuh, dan memperkuat komitmen dalam memberikan kontribusi terbaik bagi lembaga serta para penerima manfaat.

Salam hangat,
Human & Digital Optimization',
  '[
    {
      "id": "q1",
      "type": "scale",
      "question": "Seberapa sering Anda merasa pekerjaan Anda saat ini bermakna dan sejalan dengan nilai-nilai personal Anda?",
      "minLabel": "Sangat Jarang",
      "maxLabel": "Sangat Sering",
      "maxScore": 5
    },
    {
      "id": "q2",
      "type": "scale",
      "question": "Saya merasa memiliki otonomi yang cukup dalam mengambil keputusan terkait pekerjaan saya sehari-hari.",
      "minLabel": "Sangat Tidak Setuju",
      "maxLabel": "Sangat Setuju",
      "maxScore": 5
    },
    {
      "id": "q3",
      "type": "textarea",
      "question": "Faktor apa yang paling memotivasi Anda dalam bekerja saat ini?",
      "placeholder": "Ceritakan hal-hal yang membuat Anda semangat bekerja..."
    }
  ]'::jsonb
);
