-- Migration: Add role column to employees table
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS role text DEFAULT 'Employee';

-- Update your specific account to be an Admin
-- Replace 'teach.d3v@gmail.com' with your actual email if needed
UPDATE public.employees 
SET role = 'Admin' 
WHERE email = 'teach.d3v@gmail.com';

-- Update middleware/RBAC to use this new column in the future
-- (This SQL is just for the database part)