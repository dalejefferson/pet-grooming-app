-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================
-- Strategy:
--   - Staff authenticate via Supabase Auth (auth.uid())
--   - Staff can only access data belonging to their organization
--   - Public booking portal uses anon key with limited read access
--   - Helper function resolves auth.uid() -> organization_id
-- ============================================================

-- Helper: get the organization_id for the current authenticated user
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id
  FROM staff
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get the staff role for the current authenticated user
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS staff_role AS $$
  SELECT role
  FROM staff
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get the staff id for the current authenticated user
CREATE OR REPLACE FUNCTION get_user_staff_id()
RETURNS UUID AS $$
  SELECT id
  FROM staff
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_pet_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Organizations
-- ============================================================

-- Staff can read their own organization
CREATE POLICY "staff_read_own_org" ON organizations
  FOR SELECT USING (id = get_user_org_id());

-- Anon can read org by slug (for public booking portal)
CREATE POLICY "anon_read_org_by_slug" ON organizations
  FOR SELECT TO anon USING (true);

-- Only owners can update their organization
CREATE POLICY "owner_update_org" ON organizations
  FOR UPDATE USING (
    id = get_user_org_id()
    AND get_user_role() IN ('owner', 'admin')
  );

-- ============================================================
-- Staff
-- ============================================================

CREATE POLICY "staff_read_own_org_staff" ON staff
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "owner_admin_insert_staff" ON staff
  FOR INSERT WITH CHECK (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('owner', 'admin')
  );

CREATE POLICY "owner_admin_update_staff" ON staff
  FOR UPDATE USING (
    organization_id = get_user_org_id()
    AND (
      get_user_role() IN ('owner', 'admin')
      OR id = get_user_staff_id()  -- staff can update own profile
    )
  );

-- ============================================================
-- Clients
-- ============================================================

CREATE POLICY "staff_read_clients" ON clients
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "staff_insert_clients" ON clients
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "staff_update_clients" ON clients
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "staff_delete_clients" ON clients
  FOR DELETE USING (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('owner', 'admin')
  );

-- Anon can insert clients (new client booking flow)
CREATE POLICY "anon_insert_clients" ON clients
  FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- Pets
-- ============================================================

CREATE POLICY "staff_read_pets" ON pets
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "staff_insert_pets" ON pets
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "staff_update_pets" ON pets
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "staff_delete_pets" ON pets
  FOR DELETE USING (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('owner', 'admin')
  );

-- Anon can insert pets (booking flow)
CREATE POLICY "anon_insert_pets" ON pets
  FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- Vaccinations
-- ============================================================

CREATE POLICY "staff_read_vaccinations" ON vaccinations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets WHERE pets.id = vaccinations.pet_id
      AND pets.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "staff_insert_vaccinations" ON vaccinations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets WHERE pets.id = vaccinations.pet_id
      AND pets.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "staff_update_vaccinations" ON vaccinations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pets WHERE pets.id = vaccinations.pet_id
      AND pets.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "staff_delete_vaccinations" ON vaccinations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pets WHERE pets.id = vaccinations.pet_id
      AND pets.organization_id = get_user_org_id()
    )
  );

-- ============================================================
-- Services
-- ============================================================

CREATE POLICY "staff_read_services" ON services
  FOR SELECT USING (organization_id = get_user_org_id());

-- Anon can read active services (booking flow)
CREATE POLICY "anon_read_active_services" ON services
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "admin_manage_services" ON services
  FOR ALL USING (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('owner', 'admin')
  );

-- ============================================================
-- Service Modifiers
-- ============================================================

CREATE POLICY "read_modifiers" ON service_modifiers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM services WHERE services.id = service_modifiers.service_id
      AND services.organization_id = get_user_org_id()
    )
  );

-- Anon can read modifiers for active services (booking flow)
CREATE POLICY "anon_read_modifiers" ON service_modifiers
  FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM services WHERE services.id = service_modifiers.service_id
      AND services.is_active = true
    )
  );

CREATE POLICY "admin_manage_modifiers" ON service_modifiers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM services WHERE services.id = service_modifiers.service_id
      AND services.organization_id = get_user_org_id()
    )
    AND get_user_role() IN ('owner', 'admin')
  );

-- ============================================================
-- Appointments
-- ============================================================

CREATE POLICY "staff_read_appointments" ON appointments
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "staff_insert_appointments" ON appointments
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

-- Anon can insert appointments (booking flow)
CREATE POLICY "anon_insert_appointments" ON appointments
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "staff_update_appointments" ON appointments
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "admin_delete_appointments" ON appointments
  FOR DELETE USING (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('owner', 'admin')
  );

-- ============================================================
-- Appointment Pets & Services
-- ============================================================

CREATE POLICY "read_appointment_pets" ON appointment_pets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments WHERE appointments.id = appointment_pets.appointment_id
      AND appointments.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "insert_appointment_pets" ON appointment_pets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments WHERE appointments.id = appointment_pets.appointment_id
      AND appointments.organization_id = get_user_org_id()
    )
  );

-- Anon can insert appointment_pets (booking flow)
CREATE POLICY "anon_insert_appointment_pets" ON appointment_pets
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "read_appointment_pet_services" ON appointment_pet_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointment_pets
      JOIN appointments ON appointments.id = appointment_pets.appointment_id
      WHERE appointment_pets.id = appointment_pet_services.appointment_pet_id
      AND appointments.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "insert_appointment_pet_services" ON appointment_pet_services
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointment_pets
      JOIN appointments ON appointments.id = appointment_pets.appointment_id
      WHERE appointment_pets.id = appointment_pet_services.appointment_pet_id
      AND appointments.organization_id = get_user_org_id()
    )
  );

-- Anon can insert appointment_pet_services (booking flow)
CREATE POLICY "anon_insert_apt_pet_services" ON appointment_pet_services
  FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- Booking Policies
-- ============================================================

CREATE POLICY "staff_read_policies" ON booking_policies
  FOR SELECT USING (organization_id = get_user_org_id());

-- Anon can read policies (shown during booking)
CREATE POLICY "anon_read_policies" ON booking_policies
  FOR SELECT TO anon USING (true);

CREATE POLICY "admin_manage_policies" ON booking_policies
  FOR ALL USING (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('owner', 'admin')
  );

-- ============================================================
-- Reminder Schedules
-- ============================================================

CREATE POLICY "staff_read_reminders" ON reminder_schedules
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "admin_manage_reminders" ON reminder_schedules
  FOR ALL USING (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('owner', 'admin')
  );

-- ============================================================
-- Vaccination Reminder Settings
-- ============================================================

CREATE POLICY "staff_read_vax_settings" ON vaccination_reminder_settings
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "admin_manage_vax_settings" ON vaccination_reminder_settings
  FOR ALL USING (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('owner', 'admin')
  );

-- ============================================================
-- Vaccination Reminders
-- ============================================================

CREATE POLICY "staff_read_vax_reminders" ON vaccination_reminders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets WHERE pets.id = vaccination_reminders.pet_id
      AND pets.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "staff_manage_vax_reminders" ON vaccination_reminders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pets WHERE pets.id = vaccination_reminders.pet_id
      AND pets.organization_id = get_user_org_id()
    )
  );

-- ============================================================
-- Notifications
-- ============================================================

CREATE POLICY "staff_read_own_notifications" ON notifications
  FOR SELECT USING (
    organization_id = get_user_org_id()
    AND (target_staff_id IS NULL OR target_staff_id = get_user_staff_id())
  );

CREATE POLICY "staff_update_own_notifications" ON notifications
  FOR UPDATE USING (
    organization_id = get_user_org_id()
    AND (target_staff_id IS NULL OR target_staff_id = get_user_staff_id())
  );

CREATE POLICY "system_insert_notifications" ON notifications
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

-- ============================================================
-- Payment Methods
-- ============================================================

CREATE POLICY "staff_read_payment_methods" ON payment_methods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = payment_methods.client_id
      AND clients.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "staff_manage_payment_methods" ON payment_methods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = payment_methods.client_id
      AND clients.organization_id = get_user_org_id()
    )
  );

-- ============================================================
-- Staff Availability
-- ============================================================

CREATE POLICY "staff_read_availability" ON staff_availability
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff WHERE staff.id = staff_availability.staff_id
      AND staff.organization_id = get_user_org_id()
    )
  );

-- Anon can read availability (booking flow time selection)
CREATE POLICY "anon_read_availability" ON staff_availability
  FOR SELECT TO anon USING (true);

CREATE POLICY "staff_manage_own_availability" ON staff_availability
  FOR ALL USING (
    staff_id = get_user_staff_id()
    OR get_user_role() IN ('owner', 'admin')
  );

-- ============================================================
-- Time Off Requests
-- ============================================================

CREATE POLICY "staff_read_time_off" ON time_off_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff WHERE staff.id = time_off_requests.staff_id
      AND staff.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "staff_insert_own_time_off" ON time_off_requests
  FOR INSERT WITH CHECK (staff_id = get_user_staff_id());

CREATE POLICY "admin_manage_time_off" ON time_off_requests
  FOR ALL USING (get_user_role() IN ('owner', 'admin'));

CREATE POLICY "staff_update_own_time_off" ON time_off_requests
  FOR UPDATE USING (
    staff_id = get_user_staff_id()
    AND status = 'pending'
  );

-- ============================================================
-- Deleted Items (audit trail)
-- ============================================================

CREATE POLICY "admin_read_deleted" ON deleted_items
  FOR SELECT USING (get_user_role() IN ('owner', 'admin'));

CREATE POLICY "admin_insert_deleted" ON deleted_items
  FOR INSERT WITH CHECK (get_user_role() IN ('owner', 'admin'));
