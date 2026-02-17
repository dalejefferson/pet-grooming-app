-- 009: Add missing foreign key constraints for referential integrity
-- These columns store UUID values as TEXT — convert to UUID and add FK constraints

-- staff_availability.staff_id → groomers.id
ALTER TABLE staff_availability
  ALTER COLUMN staff_id TYPE UUID USING staff_id::uuid;
ALTER TABLE staff_availability
  ADD CONSTRAINT fk_staff_availability_groomer
  FOREIGN KEY (staff_id) REFERENCES groomers(id) ON DELETE CASCADE;

-- time_off_requests.staff_id → groomers.id
ALTER TABLE time_off_requests
  ALTER COLUMN staff_id TYPE UUID USING staff_id::uuid;
ALTER TABLE time_off_requests
  ADD CONSTRAINT fk_time_off_requests_groomer
  FOREIGN KEY (staff_id) REFERENCES groomers(id) ON DELETE CASCADE;

-- appointments.groomer_id → groomers.id (nullable, SET NULL on delete)
ALTER TABLE appointments
  ALTER COLUMN groomer_id TYPE UUID USING groomer_id::uuid;
ALTER TABLE appointments
  ADD CONSTRAINT fk_appointments_groomer
  FOREIGN KEY (groomer_id) REFERENCES groomers(id) ON DELETE SET NULL;

-- appointment_pets.pet_id → pets.id
ALTER TABLE appointment_pets
  ALTER COLUMN pet_id TYPE UUID USING pet_id::uuid;
ALTER TABLE appointment_pets
  ADD CONSTRAINT fk_appointment_pets_pet
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE;

-- appointment_services.service_id → services.id
ALTER TABLE appointment_services
  ALTER COLUMN service_id TYPE UUID USING service_id::uuid;
ALTER TABLE appointment_services
  ADD CONSTRAINT fk_appointment_services_service
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
