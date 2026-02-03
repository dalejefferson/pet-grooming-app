-- ============================================================
-- Sit Pretty Club - Supabase Database Schema
-- Migration: 00001_create_schema
-- ============================================================

-- ============================================================
-- Custom ENUM types
-- ============================================================

CREATE TYPE staff_role AS ENUM ('owner', 'admin', 'groomer', 'receptionist');
CREATE TYPE pet_species AS ENUM ('dog', 'cat', 'other');
CREATE TYPE coat_type AS ENUM ('short', 'medium', 'long', 'curly', 'double', 'wire');
CREATE TYPE weight_range AS ENUM ('small', 'medium', 'large', 'xlarge');
CREATE TYPE service_category AS ENUM ('bath', 'haircut', 'nail', 'specialty', 'package');
CREATE TYPE modifier_type AS ENUM ('weight', 'coat', 'breed', 'addon');
CREATE TYPE appointment_status AS ENUM ('requested', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE contact_method AS ENUM ('email', 'phone', 'text');
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms');
CREATE TYPE notification_type AS ENUM ('vaccination_expiring', 'vaccination_expired', 'appointment_reminder', 'general');
CREATE TYPE card_brand AS ENUM ('visa', 'mastercard', 'amex', 'discover', 'unknown');
CREATE TYPE booking_mode AS ENUM ('auto_confirm', 'request_only', 'blocked');
CREATE TYPE existing_client_mode AS ENUM ('auto_confirm', 'request_only');
CREATE TYPE time_off_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE vaccination_reminder_type AS ENUM ('30_day', '7_day', 'expired');
CREATE TYPE reminder_status AS ENUM ('pending', 'sent', 'dismissed');
CREATE TYPE deleted_entity_type AS ENUM ('client', 'pet', 'groomer', 'service');

-- ============================================================
-- Organizations
-- ============================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_organizations_slug ON organizations (slug);

-- ============================================================
-- Staff / Users (extends Supabase auth.users)
-- ============================================================

CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users (id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role staff_role NOT NULL DEFAULT 'groomer',
  avatar_url TEXT,
  permission_overrides JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_organization ON staff (organization_id);
CREATE INDEX idx_staff_auth_user ON staff (auth_user_id);
CREATE INDEX idx_staff_role ON staff (organization_id, role);

-- ============================================================
-- Clients
-- ============================================================

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT,
  notes TEXT,
  image_url TEXT,
  preferred_contact_method contact_method NOT NULL DEFAULT 'email',
  is_new_client BOOLEAN NOT NULL DEFAULT true,
  notification_preferences JSONB DEFAULT '{
    "vaccinationReminders": { "enabled": true, "channels": ["email"] },
    "appointmentReminders": { "enabled": true, "channels": ["email"] }
  }',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_organization ON clients (organization_id);
CREATE INDEX idx_clients_email ON clients (organization_id, email);
CREATE INDEX idx_clients_name ON clients (organization_id, last_name, first_name);

-- ============================================================
-- Pets
-- ============================================================

CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species pet_species NOT NULL DEFAULT 'dog',
  breed TEXT NOT NULL DEFAULT '',
  weight NUMERIC(6, 2) NOT NULL DEFAULT 0,
  weight_range weight_range NOT NULL DEFAULT 'medium',
  coat_type coat_type NOT NULL DEFAULT 'medium',
  birth_date DATE,
  behavior_level SMALLINT NOT NULL DEFAULT 3 CHECK (behavior_level BETWEEN 1 AND 5),
  grooming_notes TEXT,
  medical_notes TEXT,
  image_url TEXT,
  last_grooming_date DATE,
  preferred_groomer_id UUID REFERENCES staff (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pets_client ON pets (client_id);
CREATE INDEX idx_pets_organization ON pets (organization_id);

-- ============================================================
-- Vaccinations
-- ============================================================

CREATE TABLE vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_administered DATE NOT NULL,
  expiration_date DATE NOT NULL,
  document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vaccinations_pet ON vaccinations (pet_id);
CREATE INDEX idx_vaccinations_expiration ON vaccinations (expiration_date);

-- ============================================================
-- Services
-- ============================================================

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  base_duration_minutes INTEGER NOT NULL DEFAULT 30,
  base_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  category service_category NOT NULL DEFAULT 'bath',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_organization ON services (organization_id);
CREATE INDEX idx_services_active ON services (organization_id, is_active);

-- ============================================================
-- Service Modifiers
-- ============================================================

CREATE TABLE service_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type modifier_type NOT NULL,
  condition JSONB DEFAULT '{}',
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  price_adjustment NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_percentage BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_modifiers_service ON service_modifiers (service_id);

-- ============================================================
-- Appointments
-- ============================================================

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  groomer_id UUID REFERENCES staff (id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status appointment_status NOT NULL DEFAULT 'requested',
  status_notes TEXT,
  internal_notes TEXT,
  client_notes TEXT,
  deposit_amount NUMERIC(10, 2),
  deposit_paid BOOLEAN NOT NULL DEFAULT false,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tip_amount NUMERIC(10, 2),
  payment_status payment_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_organization ON appointments (organization_id);
CREATE INDEX idx_appointments_client ON appointments (client_id);
CREATE INDEX idx_appointments_groomer ON appointments (groomer_id);
CREATE INDEX idx_appointments_time ON appointments (organization_id, start_time);
CREATE INDEX idx_appointments_status ON appointments (organization_id, status);

-- ============================================================
-- Appointment Pets (join table: appointment <-> pet + services)
-- ============================================================

CREATE TABLE appointment_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments (id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets (id) ON DELETE CASCADE
);

CREATE INDEX idx_appointment_pets_appointment ON appointment_pets (appointment_id);
CREATE INDEX idx_appointment_pets_pet ON appointment_pets (pet_id);

-- ============================================================
-- Appointment Pet Services (services selected for each pet in appointment)
-- ============================================================

CREATE TABLE appointment_pet_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_pet_id UUID NOT NULL REFERENCES appointment_pets (id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services (id) ON DELETE CASCADE,
  applied_modifier_ids UUID[] DEFAULT '{}',
  final_duration INTEGER NOT NULL DEFAULT 0,
  final_price NUMERIC(10, 2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_apt_pet_services_apt_pet ON appointment_pet_services (appointment_pet_id);

-- ============================================================
-- Booking Policies
-- ============================================================

CREATE TABLE booking_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations (id) ON DELETE CASCADE,
  new_client_mode booking_mode NOT NULL DEFAULT 'auto_confirm',
  existing_client_mode existing_client_mode NOT NULL DEFAULT 'auto_confirm',
  deposit_required BOOLEAN NOT NULL DEFAULT false,
  deposit_percentage NUMERIC(5, 2) NOT NULL DEFAULT 20,
  deposit_minimum NUMERIC(10, 2) NOT NULL DEFAULT 0,
  no_show_fee_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50,
  cancellation_window_hours INTEGER NOT NULL DEFAULT 24,
  late_cancellation_fee_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50,
  max_pets_per_appointment INTEGER NOT NULL DEFAULT 3,
  min_advance_booking_hours INTEGER NOT NULL DEFAULT 24,
  max_advance_booking_days INTEGER NOT NULL DEFAULT 60,
  policy_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Reminder Schedules
-- ============================================================

CREATE TABLE reminder_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations (id) ON DELETE CASCADE,
  appointment_reminders JSONB NOT NULL DEFAULT '{
    "enabled48h": true,
    "enabled24h": true,
    "enabled2h": false,
    "template48h": "Reminder: {petName} has a grooming appointment in 2 days at {time}.",
    "template24h": "Reminder: {petName}''s grooming appointment is tomorrow at {time}.",
    "template2h": "Reminder: {petName}''s grooming appointment is in 2 hours at {time}."
  }',
  due_for_grooming JSONB NOT NULL DEFAULT '{
    "enabled": false,
    "intervalDays": 42,
    "template": "It''s been a while since {petName}''s last grooming. Book an appointment today!"
  }',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Vaccination Reminder Settings
-- ============================================================

CREATE TABLE vaccination_reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations (id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_days INTEGER[] NOT NULL DEFAULT '{30, 7}',
  channels JSONB NOT NULL DEFAULT '{ "inApp": true, "email": true, "sms": false }',
  block_booking_on_expired BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Vaccination Reminders (sent/pending reminders)
-- ============================================================

CREATE TABLE vaccination_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets (id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  vaccination_id UUID NOT NULL REFERENCES vaccinations (id) ON DELETE CASCADE,
  vaccination_name TEXT NOT NULL,
  expiration_date DATE NOT NULL,
  reminder_type vaccination_reminder_type NOT NULL,
  status reminder_status NOT NULL DEFAULT 'pending',
  channels notification_channel[] NOT NULL DEFAULT '{email}',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vax_reminders_pet ON vaccination_reminders (pet_id);
CREATE INDEX idx_vax_reminders_status ON vaccination_reminders (status);

-- ============================================================
-- In-App Notifications
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  pet_id UUID REFERENCES pets (id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients (id) ON DELETE SET NULL,
  target_staff_id UUID REFERENCES staff (id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_org ON notifications (organization_id);
CREATE INDEX idx_notifications_target ON notifications (target_staff_id, read);

-- ============================================================
-- Payment Methods (tokenized references)
-- ============================================================

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'card',
  card_brand card_brand NOT NULL DEFAULT 'unknown',
  card_last4 TEXT NOT NULL DEFAULT '0000',
  card_exp_month SMALLINT NOT NULL,
  card_exp_year SMALLINT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  stripe_payment_method_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_methods_client ON payment_methods (client_id);

-- ============================================================
-- Staff Availability
-- ============================================================

CREATE TABLE staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL UNIQUE REFERENCES staff (id) ON DELETE CASCADE,
  weekly_schedule JSONB NOT NULL DEFAULT '[]',
  max_appointments_per_day INTEGER NOT NULL DEFAULT 8,
  buffer_minutes_between_appointments INTEGER NOT NULL DEFAULT 15,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Time Off Requests
-- ============================================================

CREATE TABLE time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff (id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status time_off_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_time_off_staff ON time_off_requests (staff_id);
CREATE INDEX idx_time_off_dates ON time_off_requests (start_date, end_date);

-- ============================================================
-- Deleted Items (soft-delete history / audit trail)
-- ============================================================

CREATE TABLE deleted_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type deleted_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  deleted_by UUID REFERENCES staff (id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deleted_items_type ON deleted_items (entity_type);

-- ============================================================
-- Trigger: auto-update updated_at columns
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_staff_updated_at
  BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_pets_updated_at
  BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_booking_policies_updated_at
  BEFORE UPDATE ON booking_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reminder_schedules_updated_at
  BEFORE UPDATE ON reminder_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_vaccination_reminder_settings_updated_at
  BEFORE UPDATE ON vaccination_reminder_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_staff_availability_updated_at
  BEFORE UPDATE ON staff_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at();
