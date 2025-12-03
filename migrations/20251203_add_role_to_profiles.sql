-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');

-- Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN role user_role NOT NULL DEFAULT 'user';

-- Create index for faster role-based queries
CREATE INDEX idx_profiles_role ON profiles(role);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
  )
);

-- Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
  )
);
