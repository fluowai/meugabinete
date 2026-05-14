-- =====================================================
-- HABILITAÇÃO DE RLS (ROW LEVEL SECURITY)
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE basic_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE ACESSO (POLICIES)
-- =====================================================

-- 1. Política para a tabela 'users'
-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view their own profile" 
ON users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Admins podem ver todos os usuários
CREATE POLICY "Admins can view all users" 
ON users FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2. Política para 'citizens'
-- Todos os usuários autenticados podem ver e editar cidadãos (Escopo de Gabinete)
CREATE POLICY "Authenticated users can manage citizens" 
ON citizens FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 3. Política para 'citizen_tags'
CREATE POLICY "Authenticated users can manage citizen tags" 
ON citizen_tags FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 4. Política para 'requests' (Demandas)
CREATE POLICY "Authenticated users can manage requests" 
ON requests FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 5. Política para 'request_attachments'
CREATE POLICY "Authenticated users can manage attachments" 
ON request_attachments FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 6. Política para 'basic_registers'
CREATE POLICY "Authenticated users can view basic registers" 
ON basic_registers FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Admins can manage basic registers" 
ON basic_registers FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 7. Política para 'whatsapp_campaigns'
CREATE POLICY "Authenticated users can manage campaigns" 
ON whatsapp_campaigns FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
