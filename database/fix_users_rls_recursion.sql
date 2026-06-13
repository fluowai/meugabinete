-- Script de migração: aplica as novas políticas RLS baseadas em tenant
--
-- Execute no SQL Editor do Supabase para substituir as policies antigas
-- pelas novas policies com escopo de tenant.

-- Remove políticas antigas
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage basic registers" ON basic_registers;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can manage citizens" ON citizens;
DROP POLICY IF EXISTS "Authenticated users can manage citizen tags" ON citizen_tags;
DROP POLICY IF EXISTS "Authenticated users can manage requests" ON requests;
DROP POLICY IF EXISTS "Authenticated users can manage attachments" ON request_attachments;
DROP POLICY IF EXISTS "Authenticated users can view basic registers" ON basic_registers;
DROP POLICY IF EXISTS "Authenticated users can manage basic registers" ON basic_registers;
DROP POLICY IF EXISTS "Authenticated users can manage campaigns" ON whatsapp_campaigns;

-- Aplica novas policies (copie e execute o conteúdo completo do security_policies.sql)
