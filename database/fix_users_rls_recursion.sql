-- Corrige a policy recursiva que causa:
-- infinite recursion detected in policy for relation "users"
--
-- Execute no SQL Editor do Supabase se o banco ja tiver recebido
-- a policy antiga "Admins can view all users".

DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage basic registers" ON basic_registers;

CREATE POLICY "Authenticated users can manage basic registers"
ON basic_registers FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
