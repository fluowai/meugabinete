-- Corrige/garante o schema usado pela aba Atendimentos WhatsApp.
-- Execute no Supabase SQL Editor. Este arquivo e idempotente.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS whatsapp_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    chat_jid TEXT UNIQUE NOT NULL,
    chat_type VARCHAR(20) NOT NULL CHECK (chat_type IN ('direct', 'group')),
    display_name VARCHAR(255) NOT NULL,
    normalized_phone VARCHAR(20),
    country_code VARCHAR(8),
    group_name VARCHAR(255),
    profile_picture_url TEXT,
    participant_count INTEGER DEFAULT 0,
    last_message TEXT,
    last_message_at TIMESTAMP,
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES whatsapp_chats(id) ON DELETE CASCADE,
    message_id TEXT UNIQUE NOT NULL,
    chat_jid TEXT NOT NULL,
    sender_jid TEXT,
    sender_push_name VARCHAR(255),
    sender_phone VARCHAR(20),
    sender_country_code VARCHAR(8),
    sender_profile_picture_url TEXT,
    sender_display_name VARCHAR(255),
    is_group BOOLEAN DEFAULT false,
    group_name VARCHAR(255),
    message_type VARCHAR(30) DEFAULT 'text',
    text_content TEXT,
    media_url TEXT,
    media_mime_type VARCHAR(255),
    media_filename VARCHAR(255),
    quoted_message_id TEXT,
    mentioned_phones JSONB DEFAULT '[]'::jsonb,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_request_id UUID REFERENCES requests(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS whatsapp_group_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_jid TEXT NOT NULL,
    participant_jid TEXT NOT NULL,
    normalized_phone VARCHAR(20) NOT NULL,
    country_code VARCHAR(8),
    push_name VARCHAR(255),
    display_name VARCHAR(255) NOT NULL,
    profile_picture_url TEXT,
    is_admin BOOLEAN DEFAULT false,
    is_super_admin BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_jid, participant_jid)
);

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

ALTER TABLE whatsapp_chats
    ADD COLUMN IF NOT EXISTS country_code VARCHAR(8),
    ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
    ADD COLUMN IF NOT EXISTS participant_count INTEGER DEFAULT 0;

ALTER TABLE whatsapp_messages
    ADD COLUMN IF NOT EXISTS sender_country_code VARCHAR(8),
    ADD COLUMN IF NOT EXISTS sender_profile_picture_url TEXT,
    ADD COLUMN IF NOT EXISTS media_url TEXT,
    ADD COLUMN IF NOT EXISTS media_mime_type VARCHAR(255),
    ADD COLUMN IF NOT EXISTS media_filename VARCHAR(255),
    ADD COLUMN IF NOT EXISTS created_request_id UUID REFERENCES requests(id);

ALTER TABLE whatsapp_group_participants
    ADD COLUMN IF NOT EXISTS country_code VARCHAR(8),
    ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_type ON whatsapp_chats(chat_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_last_message_at ON whatsapp_chats(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_phone ON whatsapp_chats(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat_id ON whatsapp_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_received_at ON whatsapp_messages(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sender_phone ON whatsapp_messages(sender_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_is_group ON whatsapp_messages(is_group);
CREATE INDEX IF NOT EXISTS idx_whatsapp_group_participants_group ON whatsapp_group_participants(group_jid);
CREATE INDEX IF NOT EXISTS idx_whatsapp_group_participants_phone ON whatsapp_group_participants(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_status ON whatsapp_connections(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_instance ON whatsapp_connections(instance_key);
