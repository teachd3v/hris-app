import { sqliteTable, text, integer, numeric, primaryKey } from "drizzle-orm/sqlite-core";

export const achievements = sqliteTable("achievements", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  title: text("title"),
  level: text("level"),
  date: text("date"),
  description: text("description"),
  created_at: text("created_at"),
});

export const assessment_templates = sqliteTable("assessment_templates", {
  id: text("id").primaryKey(),
  title: text("title"),
  category: text("category"),
  description: text("description"),
  opening_text: text("opening_text"),
  schema: text("schema", { mode: "json" }),
  created_at: text("created_at"),
  updated_at: text("updated_at"),
});

export const attendances = sqliteTable("attendances", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  date: text("date"),
  clock_in: text("clock_in"),
  clock_in_lat: text("clock_in_lat"),
  clock_in_lng: text("clock_in_lng"),
  clock_in_photo_url: text("clock_in_photo_url"),
  clock_out: text("clock_out"),
  clock_out_lat: text("clock_out_lat"),
  clock_out_lng: text("clock_out_lng"),
  clock_out_photo_url: text("clock_out_photo_url"),
  duration_hours: numeric("duration_hours"),
  face_match_score: text("face_match_score"),
  status: text("status"),
  created_at: text("created_at"),
});

export const career_interests = sqliteTable("career_interests", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  position: text("position"),
  department: text("department"),
  created_at: text("created_at"),
});

export const committee_experiences = sqliteTable("committee_experiences", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  event: text("event"),
  role: text("role"),
  year: text("year"),
  created_at: text("created_at"),
});

export const educations = sqliteTable("educations", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  institution: text("institution"),
  level: text("level"),
  field: text("field"),
  year: text("year"),
  created_at: text("created_at"),
});

export const emergency_contacts = sqliteTable("emergency_contacts", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  name: text("name"),
  relationship: text("relationship"),
  phone: text("phone"),
  address: text("address"),
  created_at: text("created_at"),
});

export const employee_assessments = sqliteTable("employee_assessments", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  template_id: text("template_id"),
  status: text("status"),
  deadline: text("deadline"),
  answers: text("answers", { mode: "json" }),
  score: numeric("score"),
  feedback: text("feedback"),
  submitted_at: text("submitted_at"),
  created_at: text("created_at"),
  updated_at: text("updated_at"),
});

export const employee_documents = sqliteTable("employee_documents", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  title: text("title"),
  type: text("type"),
  size: text("size"),
  date: text("date"),
  category: text("category"),
  sub_category: text("sub_category"),
  file_url: text("file_url"),
  created_at: text("created_at"),
  files: text("files", { mode: "json" }),
});

export const employees = sqliteTable("employees", {
  id: text("id").primaryKey(),
  employee_code: text("employee_code"),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  nik: text("nik"),
  birth_date: text("birth_date"),
  gender: text("gender"),
  nationality: text("nationality"),
  marital_status: text("marital_status"),
  religion: text("religion"),
  address: text("address"),
  city: text("city"),
  province: text("province"),
  postal_code: text("postal_code"),
  country: text("country"),
  title: text("title"),
  dept: text("dept"),
  level: text("level"),
  status: text("status"),
  join_date: text("join_date"),
  tenure: text("tenure"),
  manager: text("manager"),
  bank: text("bank"),
  leave_total: numeric("leave_total"),
  leave_used: numeric("leave_used"),
  attendance_present: integer("attendance_present"),
  attendance_late: integer("attendance_late"),
  photo_url: text("photo_url"),
  created_at: text("created_at"),
  updated_at: text("updated_at"),
  blood_type: text("blood_type"),
  role: text("role"),
  ktp_address: text("ktp_address"),
  manager_id: text("manager_id"),
  leave_ganti_hari: text("leave_ganti_hari"),
});

export const family_members = sqliteTable("family_members", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  relationship: text("relationship"),
  name: text("name"),
  birth_date: text("birth_date"),
  occupation: text("occupation"),
  phone: text("phone"),
  created_at: text("created_at"),
});

export const languages = sqliteTable("languages", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  name: text("name"),
  proficiency: text("proficiency"),
  created_at: text("created_at"),
});

export const non_formal_educations = sqliteTable("non_formal_educations", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  name: text("name"),
  institution: text("institution"),
  year: text("year"),
  created_at: text("created_at"),
});

export const org_experiences = sqliteTable("org_experiences", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  organization: text("organization"),
  role: text("role"),
  period: text("period"),
  created_at: text("created_at"),
});

export const promotion_histories = sqliteTable("promotion_histories", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  date: text("date"),
  type: text("type"),
  from_position: text("from_position"),
  to_position: text("to_position"),
  created_at: text("created_at"),
});

export const skills = sqliteTable("skills", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  name: text("name"),
  proficiency: text("proficiency"),
  created_at: text("created_at"),
});

export const social_activities = sqliteTable("social_activities", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  activity: text("activity"),
  organization: text("organization"),
  role: text("role"),
  start_date: text("start_date"),
  end_date: text("end_date"),
  created_at: text("created_at"),
});

export const trainings = sqliteTable("trainings", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  name: text("name"),
  provider: text("provider"),
  date: text("date"),
  created_at: text("created_at"),
});

export const work_experiences = sqliteTable("work_experiences", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  company: text("company"),
  position: text("position"),
  start_date: text("start_date"),
  end_date: text("end_date"),
  description: text("description"),
  created_at: text("created_at"),
});


export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
  image: text('image'),
});

export const accounts = sqliteTable('account', {
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => ({
  compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] })
}));

export const sessions = sqliteTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
});

export const verificationTokens = sqliteTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] })
}));

export const leave_requests = sqliteTable("leave_requests", {
  id: text("id").primaryKey(),
  employee_id: text("employee_id"),
  leave_type: text("leave_type"),
  start_date: text("start_date"),
  end_date: text("end_date"),
  start_time: text("start_time"),
  end_time: text("end_time"),
  total_days: numeric("total_days"),
  reason: text("reason"),
  attachment_url: text("attachment_url"),
  status: text("status"),
  manager_approved_by: text("manager_approved_by"),
  manager_approved_at: text("manager_approved_at"),
  manager_notes: text("manager_notes"),
  hc_approved_by: text("hc_approved_by"),
  hc_approved_at: text("hc_approved_at"),
  hc_notes: text("hc_notes"),
  created_at: text("created_at"),
  updated_at: text("updated_at"),
});
