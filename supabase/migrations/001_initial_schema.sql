-- ============================================
-- Sit Pretty Club - Initial Supabase Schema
-- Run this in Supabase SQL Editor or via CLI
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Core Tables
-- ============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extends auth.users with app-specific profile data
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'groomer', 'receptionist')),
  avatar TEXT,
  permission_overrides JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  image_url TEXT,
  preferred_contact_method TEXT NOT NULL DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'text')),
  is_new_client BOOLEAN NOT NULL DEFAULT true,
  notification_preferences JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'card',
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'other')),
  breed TEXT NOT NULL DEFAULT '',
  weight NUMERIC NOT NULL DEFAULT 0,
  weight_range TEXT NOT NULL CHECK (weight_range IN ('small', 'medium', 'large', 'xlarge')),
  coat_type TEXT NOT NULL CHECK (coat_type IN ('short', 'medium', 'long', 'curly', 'double', 'wire')),
  birth_date TEXT,
  behavior_level INTEGER NOT NULL DEFAULT 1 CHECK (behavior_level BETWEEN 1 AND 5),
  grooming_notes TEXT,
  medical_notes TEXT,
  image_url TEXT,
  last_grooming_date TEXT,
  preferred_groomer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vaccination_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_administered TEXT NOT NULL,
  expiration_date TEXT NOT NULL,
  document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  base_duration_minutes INTEGER NOT NULL,
  base_price NUMERIC NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bath', 'haircut', 'nail', 'specialty', 'package')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE service_modifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('weight', 'coat', 'breed', 'addon')),
  condition JSONB,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  price_adjustment NUMERIC NOT NULL,
  is_percentage BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE groomers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  specialties TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'groomer', 'receptionist')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE staff_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id TEXT NOT NULL,
  weekly_schedule JSONB NOT NULL DEFAULT '[]',
  max_appointments_per_day INTEGER NOT NULL DEFAULT 8,
  buffer_minutes_between_appointments INTEGER NOT NULL DEFAULT 15,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE time_off_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  groomer_id TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
  status_notes TEXT,
  internal_notes TEXT,
  client_notes TEXT,
  deposit_amount NUMERIC,
  deposit_paid BOOLEAN NOT NULL DEFAULT false,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  tip_amount NUMERIC,
  payment_status TEXT CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed')),
  paid_at TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE appointment_pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  pet_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE appointment_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_pet_id UUID NOT NULL REFERENCES appointment_pets(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  applied_modifier_ids TEXT[] NOT NULL DEFAULT '{}',
  final_duration INTEGER NOT NULL,
  final_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE booking_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  new_client_mode TEXT NOT NULL DEFAULT 'auto_confirm' CHECK (new_client_mode IN ('auto_confirm', 'request_only', 'blocked')),
  existing_client_mode TEXT NOT NULL DEFAULT 'auto_confirm' CHECK (existing_client_mode IN ('auto_confirm', 'request_only')),
  deposit_required BOOLEAN NOT NULL DEFAULT false,
  deposit_percentage NUMERIC NOT NULL DEFAULT 0,
  deposit_minimum NUMERIC NOT NULL DEFAULT 0,
  no_show_fee_percentage NUMERIC NOT NULL DEFAULT 0,
  cancellation_window_hours INTEGER NOT NULL DEFAULT 24,
  late_cancellation_fee_percentage NUMERIC NOT NULL DEFAULT 0,
  max_pets_per_appointment INTEGER NOT NULL DEFAULT 3,
  min_advance_booking_hours INTEGER NOT NULL DEFAULT 2,
  max_advance_booking_days INTEGER NOT NULL DEFAULT 60,
  policy_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reminder_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  appointment_reminders JSONB NOT NULL DEFAULT '{}',
  due_for_grooming JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vaccination_reminder_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_days INTEGER[] NOT NULL DEFAULT '{30, 7}',
  channels JSONB NOT NULL DEFAULT '{"inApp": true, "email": false, "sms": false}',
  block_booking_on_expired BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vaccination_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  vaccination_id TEXT NOT NULL,
  vaccination_name TEXT NOT NULL,
  expiration_date TEXT NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('30_day', '7_day', 'expired')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed')),
  channels TEXT[] NOT NULL DEFAULT '{}',
  sent_at TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE in_app_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('vaccination_expiring', 'vaccination_expired', 'appointment_reminder', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  pet_id TEXT,
  client_id TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE deleted_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client', 'pet', 'groomer', 'service')),
  entity_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  data JSONB NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_clients_org ON clients(organization_id);
CREATE INDEX idx_clients_email ON clients(organization_id, email);
CREATE INDEX idx_pets_client ON pets(client_id);
CREATE INDEX idx_pets_org ON pets(organization_id);
CREATE INDEX idx_vaccination_records_pet ON vaccination_records(pet_id);
CREATE INDEX idx_payment_methods_client ON payment_methods(client_id);
CREATE INDEX idx_services_org ON services(organization_id);
CREATE INDEX idx_service_modifiers_service ON service_modifiers(service_id);
CREATE INDEX idx_appointments_org ON appointments(organization_id);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_groomer ON appointments(groomer_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointment_pets_appointment ON appointment_pets(appointment_id);
CREATE INDEX idx_appointment_services_pet ON appointment_services(appointment_pet_id);
CREATE INDEX idx_groomers_org ON groomers(organization_id);
CREATE INDEX idx_time_off_staff ON time_off_requests(staff_id);
CREATE INDEX idx_vaccination_reminders_pet ON vaccination_reminders(pet_id);
CREATE INDEX idx_in_app_notifications_org ON in_app_notifications(organization_id);
CREATE INDEX idx_deleted_items_org ON deleted_items(organization_id);

-- ============================================
-- Auto-update updated_at triggers
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groomers_updated_at BEFORE UPDATE ON groomers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_availability_updated_at BEFORE UPDATE ON staff_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_off_requests_updated_at BEFORE UPDATE ON time_off_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_booking_policies_updated_at BEFORE UPDATE ON booking_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reminder_schedules_updated_at BEFORE UPDATE ON reminder_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vaccination_reminder_settings_updated_at BEFORE UPDATE ON vaccination_reminder_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
