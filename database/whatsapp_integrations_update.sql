-- WhatsApp connections, enriched messages/groups and free CEP lookup support.
-- If this is the first WhatsApp migration in the project, prefer running
-- database/whatsapp_atendimentos_schema_fix.sql, which creates the base tables
-- before applying compatibility ALTER statements.

ALTER TABLE whatsapp_chats
    ADD COLUMN IF NOT EXISTS country_code VARCHAR(8),
    ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
    ADD COLUMN IF NOT EXISTS participant_count INTEGER DEFAULT 0;

ALTER TABLE whatsapp_messages
    ADD COLUMN IF NOT EXISTS sender_country_code VARCHAR(8),
    ADD COLUMN IF NOT EXISTS sender_profile_picture_url TEXT;

ALTER TABLE whatsapp_group_participants
    ADD COLUMN IF NOT EXISTS country_code VARCHAR(8),
    ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) DEFAULT 'whatsmeow',
    status VARCHAR(30) DEFAULT 'disconnected',
    connected BOOLEAN DEFAULT false,
    jid TEXT,
    phone VARCHAR(20),
    push_name VARCHAR(255),
    profile_picture_url TEXT,
    last_seen_at TIMESTAMP,
    last_connected_at TIMESTAMP,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_status ON whatsapp_connections(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_instance ON whatsapp_connections(instance_key);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_whatsapp_connections_updated_at'
    ) THEN
        CREATE TRIGGER update_whatsapp_connections_updated_at
        BEFORE UPDATE ON whatsapp_connections
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;
