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
ALTER TABLE whatsapp_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobilizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE ACESSO BASEADAS EM TENANT
-- =====================================================

-- 1. Política para a tabela 'users'
-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view their own profile" 
ON users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Admins podem ver todos os usuários do mesmo tenant
CREATE POLICY "Admins can view tenant users" 
ON users FOR SELECT 
TO authenticated 
USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

-- 2. Helper: função para obter tenant_id do usuário atual
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid();
$$;

-- 3. Política para 'citizens' baseada em tenant
-- Usuários só acessam dados do seu próprio tenant
CREATE POLICY "Users can manage own tenant citizens" 
ON citizens FOR ALL 
TO authenticated 
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 4. Política para 'citizen_tags' baseada em tenant
CREATE POLICY "Users can manage own tenant citizen tags" 
ON citizen_tags FOR ALL 
TO authenticated 
USING (
  citizen_id IN (SELECT id FROM citizens WHERE tenant_id = get_user_tenant_id())
)
WITH CHECK (
  citizen_id IN (SELECT id FROM citizens WHERE tenant_id = get_user_tenant_id())
);

-- 5. Política para 'requests' baseada em tenant
CREATE POLICY "Users can manage own tenant requests" 
ON requests FOR ALL 
TO authenticated 
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 6. Política para 'request_attachments' baseada em tenant
CREATE POLICY "Users can manage own tenant attachments" 
ON request_attachments FOR ALL 
TO authenticated 
USING (
  request_id IN (SELECT id FROM requests WHERE tenant_id = get_user_tenant_id())
)
WITH CHECK (
  request_id IN (SELECT id FROM requests WHERE tenant_id = get_user_tenant_id())
);

-- 7. Política para 'basic_registers' baseada em tenant
CREATE POLICY "Users can view own tenant basic registers" 
ON basic_registers FOR SELECT 
TO authenticated 
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage own tenant basic registers" 
ON basic_registers FOR ALL 
TO authenticated 
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 8. Política para 'whatsapp_campaigns' baseada em tenant
CREATE POLICY "Users can manage own tenant campaigns" 
ON whatsapp_campaigns FOR ALL 
TO authenticated 
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 9. Política para 'whatsapp_chats' baseada em tenant
CREATE POLICY "Users can view own tenant chats" 
ON whatsapp_chats FOR SELECT 
TO authenticated 
USING (tenant_id = get_user_tenant_id());

-- 10. Política para 'whatsapp_messages' baseada em tenant
-- Aplica tenant_id via chat_id -> whatsapp_chats
CREATE POLICY "Users can view own tenant messages" 
ON whatsapp_messages FOR SELECT 
TO authenticated 
USING (
  chat_id IN (SELECT id FROM whatsapp_chats WHERE tenant_id = get_user_tenant_id())
);

-- 11. Política para 'organizations' baseada em tenant
CREATE POLICY "Users can manage own tenant organizations" 
ON organizations FOR ALL 
TO authenticated 
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 12. Política para 'appointments' baseada em tenant
CREATE POLICY "Users can manage own tenant appointments" 
ON appointments FOR ALL 
TO authenticated 
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 13. Política para 'mobilizations' baseada em tenant
CREATE POLICY "Users can manage own tenant mobilizations" 
ON mobilizations FOR ALL 
TO authenticated 
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 14. Política para 'landing_pages' baseada em tenant
CREATE POLICY "Users can manage own tenant landing pages" 
ON landing_pages FOR ALL 
TO authenticated 
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- 15. Super admins podem acessar todos os dados
CREATE POLICY "Super admins can access all data" 
ON citizens FOR ALL 
TO authenticated 
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'super_admin')
WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can access all requests" 
ON requests FOR ALL 
TO authenticated 
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'super_admin')
WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'super_admin');
