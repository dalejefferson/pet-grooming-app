-- Add email settings to organizations for Resend integration
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email_settings JSONB DEFAULT NULL;
