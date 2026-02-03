-- ============================================
-- Row-Level Security Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE groomers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_items ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's organization_id
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- Organizations
-- ============================================
CREATE POLICY "Public can view organizations"
  ON organizations FOR SELECT USING (true);

CREATE POLICY "Admins can update their org"
  ON organizations FOR UPDATE USING (
    id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- Users
-- ============================================
CREATE POLICY "Users can view users in their org"
  ON users FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Admins can update users in their org"
  ON users FOR UPDATE USING (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Allow users to update their own profile (avatar, etc.)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (id = auth.uid());

-- ============================================
-- Clients
-- ============================================
CREATE POLICY "Authenticated users can view clients in their org"
  ON clients FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Authenticated users can create clients"
  ON clients FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

-- Public booking: anonymous can create clients
CREATE POLICY "Anon can create clients for booking"
  ON clients FOR INSERT WITH CHECK (auth.uid() IS NULL);

-- Public booking: anonymous can search clients by email
CREATE POLICY "Anon can view clients for booking"
  ON clients FOR SELECT USING (auth.uid() IS NULL);

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE USING (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- Payment Methods (via client)
-- ============================================
CREATE POLICY "Users can view payment methods"
  ON payment_methods FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = payment_methods.client_id AND clients.organization_id = get_user_organization_id())
  );

CREATE POLICY "Users can manage payment methods"
  ON payment_methods FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = payment_methods.client_id AND clients.organization_id = get_user_organization_id())
  );

CREATE POLICY "Users can update payment methods"
  ON payment_methods FOR UPDATE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = payment_methods.client_id AND clients.organization_id = get_user_organization_id())
  );

CREATE POLICY "Users can delete payment methods"
  ON payment_methods FOR DELETE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = payment_methods.client_id AND clients.organization_id = get_user_organization_id())
  );

-- ============================================
-- Pets
-- ============================================
CREATE POLICY "Users can view pets in their org"
  ON pets FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Anon can view pets for booking"
  ON pets FOR SELECT USING (auth.uid() IS NULL);

CREATE POLICY "Users can create pets"
  ON pets FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Anon can create pets for booking"
  ON pets FOR INSERT WITH CHECK (auth.uid() IS NULL);

CREATE POLICY "Users can update pets"
  ON pets FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can delete pets"
  ON pets FOR DELETE USING (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- Vaccination Records (via pet)
-- ============================================
CREATE POLICY "Users can view vaccination records"
  ON vaccination_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = vaccination_records.pet_id AND pets.organization_id = get_user_organization_id())
  );

CREATE POLICY "Users can create vaccination records"
  ON vaccination_records FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = vaccination_records.pet_id AND pets.organization_id = get_user_organization_id())
  );

CREATE POLICY "Users can update vaccination records"
  ON vaccination_records FOR UPDATE USING (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = vaccination_records.pet_id AND pets.organization_id = get_user_organization_id())
  );

CREATE POLICY "Users can delete vaccination records"
  ON vaccination_records FOR DELETE USING (
    EXISTS (SELECT 1 FROM pets WHERE pets.id = vaccination_records.pet_id AND pets.organization_id = get_user_organization_id())
  );

-- ============================================
-- Services (public read for booking)
-- ============================================
CREATE POLICY "Anyone can view services"
  ON services FOR SELECT USING (true);

CREATE POLICY "Admins can create services"
  ON services FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Admins can update services"
  ON services FOR UPDATE USING (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Admins can delete services"
  ON services FOR DELETE USING (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- Service Modifiers (public read for booking)
-- ============================================
CREATE POLICY "Anyone can view service modifiers"
  ON service_modifiers FOR SELECT USING (true);

CREATE POLICY "Admins can manage service modifiers"
  ON service_modifiers FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM services WHERE services.id = service_modifiers.service_id AND services.organization_id = get_user_organization_id())
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Admins can update service modifiers"
  ON service_modifiers FOR UPDATE USING (
    EXISTS (SELECT 1 FROM services WHERE services.id = service_modifiers.service_id AND services.organization_id = get_user_organization_id())
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Admins can delete service modifiers"
  ON service_modifiers FOR DELETE USING (
    EXISTS (SELECT 1 FROM services WHERE services.id = service_modifiers.service_id AND services.organization_id = get_user_organization_id())
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- Appointments
-- ============================================
CREATE POLICY "Users can view appointments in their org"
  ON appointments FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create appointments"
  ON appointments FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Anon can create appointments for booking"
  ON appointments FOR INSERT WITH CHECK (auth.uid() IS NULL);

CREATE POLICY "Users can update appointments"
  ON appointments FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can delete appointments"
  ON appointments FOR DELETE USING (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- Appointment Pets & Services
-- ============================================
CREATE POLICY "Users can view appointment pets"
  ON appointment_pets FOR SELECT USING (
    EXISTS (SELECT 1 FROM appointments WHERE appointments.id = appointment_pets.appointment_id AND appointments.organization_id = get_user_organization_id())
  );

CREATE POLICY "Users can create appointment pets"
  ON appointment_pets FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM appointments WHERE appointments.id = appointment_pets.appointment_id AND appointments.organization_id = get_user_organization_id())
  );

CREATE POLICY "Anon can create appointment pets"
  ON appointment_pets FOR INSERT WITH CHECK (auth.uid() IS NULL);

CREATE POLICY "Users can delete appointment pets"
  ON appointment_pets FOR DELETE USING (
    EXISTS (SELECT 1 FROM appointments WHERE appointments.id = appointment_pets.appointment_id AND appointments.organization_id = get_user_organization_id())
  );

CREATE POLICY "Users can view appointment services"
  ON appointment_services FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointment_pets
      JOIN appointments ON appointments.id = appointment_pets.appointment_id
      WHERE appointment_pets.id = appointment_services.appointment_pet_id
      AND appointments.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can create appointment services"
  ON appointment_services FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointment_pets
      JOIN appointments ON appointments.id = appointment_pets.appointment_id
      WHERE appointment_pets.id = appointment_services.appointment_pet_id
      AND appointments.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Anon can create appointment services"
  ON appointment_services FOR INSERT WITH CHECK (auth.uid() IS NULL);

CREATE POLICY "Users can delete appointment services"
  ON appointment_services FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM appointment_pets
      JOIN appointments ON appointments.id = appointment_pets.appointment_id
      WHERE appointment_pets.id = appointment_services.appointment_pet_id
      AND appointments.organization_id = get_user_organization_id()
    )
  );

-- ============================================
-- Groomers (public read for booking)
-- ============================================
CREATE POLICY "Anyone can view groomers"
  ON groomers FOR SELECT USING (true);

CREATE POLICY "Admins can create groomers"
  ON groomers FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Admins can update groomers"
  ON groomers FOR UPDATE USING (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Admins can delete groomers"
  ON groomers FOR DELETE USING (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- Staff Availability (public read for booking slots)
-- ============================================
CREATE POLICY "Anyone can view staff availability"
  ON staff_availability FOR SELECT USING (true);

CREATE POLICY "Admins can manage staff availability"
  ON staff_availability FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Admins can update staff availability"
  ON staff_availability FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- Time Off Requests
-- ============================================
CREATE POLICY "Users can view time off in their org"
  ON time_off_requests FOR SELECT USING (true);

CREATE POLICY "Users can create time off requests"
  ON time_off_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update time off requests"
  ON time_off_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Admins can delete time off requests"
  ON time_off_requests FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- Booking Policies (public read)
-- ============================================
CREATE POLICY "Anyone can view booking policies"
  ON booking_policies FOR SELECT USING (true);

CREATE POLICY "Admins can manage booking policies"
  ON booking_policies FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Admins can update booking policies"
  ON booking_policies FOR UPDATE USING (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- Reminder Schedules
-- ============================================
CREATE POLICY "Users can view reminder schedules"
  ON reminder_schedules FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can manage reminder schedules"
  ON reminder_schedules FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Admins can update reminder schedules"
  ON reminder_schedules FOR UPDATE USING (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- Vaccination Reminder Settings
-- ============================================
CREATE POLICY "Users can view vaccination reminder settings"
  ON vaccination_reminder_settings FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can manage vaccination reminder settings"
  ON vaccination_reminder_settings FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Admins can update vaccination reminder settings"
  ON vaccination_reminder_settings FOR UPDATE USING (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- Vaccination Reminders
-- ============================================
CREATE POLICY "Users can view vaccination reminders"
  ON vaccination_reminders FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create vaccination reminders"
  ON vaccination_reminders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update vaccination reminders"
  ON vaccination_reminders FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================
-- In-App Notifications
-- ============================================
CREATE POLICY "Users can view notifications in their org"
  ON in_app_notifications FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create notifications"
  ON in_app_notifications FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update notifications"
  ON in_app_notifications FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete notifications"
  ON in_app_notifications FOR DELETE USING (organization_id = get_user_organization_id());

-- ============================================
-- Deleted Items
-- ============================================
CREATE POLICY "Users can view deleted items in their org"
  ON deleted_items FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create deleted items"
  ON deleted_items FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete deleted items (restore)"
  ON deleted_items FOR DELETE USING (organization_id = get_user_organization_id());
