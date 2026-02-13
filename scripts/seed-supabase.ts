/**
 * Supabase Seed Script
 *
 * Seeds the Supabase database with demo data matching the existing
 * localStorage seed (src/modules/database/seed/seed.ts).
 *
 * Usage:
 *   npx tsx scripts/seed-supabase.ts
 *
 * Requires .env.local with:
 *   VITE_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { addDays, addHours, format, setHours, setMinutes, startOfDay } from 'date-fns'

// ---------------------------------------------------------------------------
// Load environment variables from .env.local (no dotenv dependency)
// ---------------------------------------------------------------------------

function loadEnv(): Record<string, string> {
  const envPath = resolve(import.meta.dirname ?? process.cwd(), '..', '.env.local')
  let content: string
  try {
    content = readFileSync(envPath, 'utf-8')
  } catch {
    console.error(`Could not read ${envPath}. Make sure .env.local exists.`)
    process.exit(1)
  }
  const vars: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    vars[key] = value
  }
  return vars
}

const env = loadEnv()
const SUPABASE_URL = env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = crypto.randomUUID()
const today = startOfDay(new Date())

function createAppointmentTime(dayOffset: number, hour: number, minute = 0): Date {
  return setMinutes(setHours(addDays(today, dayOffset), hour), minute)
}

function log(msg: string) {
  console.log(`\x1b[36m[seed]\x1b[0m ${msg}`)
}

function logSuccess(msg: string) {
  console.log(`\x1b[32m  OK\x1b[0m ${msg}`)
}

function logError(msg: string) {
  console.error(`\x1b[31m  ERR\x1b[0m ${msg}`)
}

// ---------------------------------------------------------------------------
// Auth user definitions
// ---------------------------------------------------------------------------

interface AuthUserDef {
  email: string
  password: string
  name: string
  role: string
  permissionOverrides?: Record<string, boolean>
  createdAt: string
}

const AUTH_USERS: AuthUserDef[] = [
  { email: 'admin@pawsclaws.com', password: 'demo123', name: 'Sarah Johnson', role: 'owner', createdAt: '2024-01-01T00:00:00Z' },
  { email: 'mike@pawsclaws.com', password: 'demo123', name: 'Mike Chen', role: 'groomer', permissionOverrides: { canViewReports: true }, createdAt: '2024-01-15T00:00:00Z' },
  { email: 'lisa@pawsclaws.com', password: 'demo123', name: 'Lisa Martinez', role: 'groomer', createdAt: '2024-02-01T00:00:00Z' },
  { email: 'alex@pawsclaws.com', password: 'demo123', name: 'Alex Kim', role: 'receptionist', createdAt: '2024-03-01T00:00:00Z' },
]

// ---------------------------------------------------------------------------
// Step 1: Create auth users
// ---------------------------------------------------------------------------

async function createAuthUsers(): Promise<Map<string, string>> {
  log('Creating auth users...')
  const emailToId = new Map<string, string>()

  for (const user of AUTH_USERS) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { name: user.name, role: user.role },
      })

      if (error) {
        // User may already exist -- try to find them
        if (error.message.includes('already been registered') || error.message.includes('already exists')) {
          const { data: listData } = await supabase.auth.admin.listUsers()
          const existing = listData?.users?.find((u) => u.email === user.email)
          if (existing) {
            emailToId.set(user.email, existing.id)
            logSuccess(`${user.email} (existing: ${existing.id})`)
            continue
          }
        }
        logError(`${user.email}: ${error.message}`)
        continue
      }

      if (data.user) {
        emailToId.set(user.email, data.user.id)
        logSuccess(`${user.email} -> ${data.user.id}`)
      }
    } catch (err: unknown) {
      logError(`${user.email}: ${(err as Error).message}`)
    }
  }
  return emailToId
}

// ---------------------------------------------------------------------------
// Step 2: Seed organizations
// ---------------------------------------------------------------------------

async function seedOrganizations() {
  log('Seeding organizations...')
  const { error } = await supabase.from('organizations').upsert(
    {
      id: ORG_ID,
      name: 'Paws & Claws Grooming',
      slug: 'paws-claws',
      address: '123 Pet Street, Dogtown, CA 90210',
      phone: '(555) 123-4567',
      email: 'hello@pawsclaws.com',
      timezone: 'America/Los_Angeles',
    },
    { onConflict: 'slug' },
  )

  if (error) {
    logError(`organizations: ${error.message}`)
    // If conflict on slug, retrieve existing org id
    const { data } = await supabase.from('organizations').select('id').eq('slug', 'paws-claws').single()
    if (data) return data.id as string
  } else {
    logSuccess('organizations')
  }
  return ORG_ID
}

// ---------------------------------------------------------------------------
// Step 3: Seed users table (app profiles linked to auth)
// ---------------------------------------------------------------------------

async function seedUsers(emailToId: Map<string, string>, orgId: string) {
  log('Seeding users...')
  const rows = AUTH_USERS.map((u) => ({
    id: emailToId.get(u.email)!,
    organization_id: orgId,
    email: u.email,
    name: u.name,
    role: u.role,
    permission_overrides: u.permissionOverrides ?? null,
    created_at: u.createdAt,
  })).filter((r) => r.id) // skip any that failed auth creation

  const { error } = await supabase.from('users').upsert(rows, { onConflict: 'id' })
  if (error) logError(`users: ${error.message}`)
  else logSuccess(`users (${rows.length})`)
  return rows
}

// ---------------------------------------------------------------------------
// Step 4: Seed clients
// ---------------------------------------------------------------------------

async function seedClients(orgId: string) {
  log('Seeding clients...')
  const clients = [
    {
      id: crypto.randomUUID(),
      key: 'client-1',
      organization_id: orgId,
      first_name: 'Emily',
      last_name: 'Wilson',
      email: 'emily.wilson@email.com',
      phone: '(555) 234-5678',
      address: '456 Oak Avenue, Dogtown, CA 90210',
      notes: 'Prefers morning appointments. Always tips well.',
      preferred_contact_method: 'email',
      is_new_client: false,
      notification_preferences: {
        vaccinationReminders: { enabled: true, channels: ['email'] },
        appointmentReminders: { enabled: true, channels: ['email'] },
      },
      created_at: '2024-02-01T00:00:00Z',
    },
    {
      id: crypto.randomUUID(),
      key: 'client-2',
      organization_id: orgId,
      first_name: 'David',
      last_name: 'Thompson',
      email: 'david.t@email.com',
      phone: '(555) 345-6789',
      address: '789 Maple Drive, Dogtown, CA 90210',
      notes: 'Has two dogs that need to be groomed together.',
      preferred_contact_method: 'email',
      is_new_client: false,
      notification_preferences: {
        vaccinationReminders: { enabled: true, channels: ['email'] },
        appointmentReminders: { enabled: true, channels: ['email'] },
      },
      created_at: '2024-03-10T00:00:00Z',
    },
    {
      id: crypto.randomUUID(),
      key: 'client-3',
      organization_id: orgId,
      first_name: 'Jennifer',
      last_name: 'Garcia',
      email: 'jen.garcia@email.com',
      phone: '(555) 456-7890',
      notes: 'New client - referred by Emily Wilson',
      preferred_contact_method: 'phone',
      is_new_client: true,
      notification_preferences: {
        vaccinationReminders: { enabled: true, channels: ['in_app'] },
        appointmentReminders: { enabled: true, channels: ['in_app', 'email'] },
      },
      created_at: '2024-08-01T00:00:00Z',
    },
    {
      id: crypto.randomUUID(),
      key: 'client-4',
      organization_id: orgId,
      first_name: 'Robert',
      last_name: 'Kim',
      email: 'robert.kim@email.com',
      phone: '(555) 567-8901',
      address: '321 Pine Street, Dogtown, CA 90210',
      preferred_contact_method: 'email',
      is_new_client: false,
      notification_preferences: {
        vaccinationReminders: { enabled: true, channels: ['email'] },
        appointmentReminders: { enabled: true, channels: ['email'] },
      },
      created_at: '2024-04-05T00:00:00Z',
    },
  ]

  // Build a key->id map for foreign key references
  const clientIdMap = new Map<string, string>()
  for (const c of clients) {
    clientIdMap.set(c.key, c.id)
  }

  // Remove the temporary "key" before inserting
  const rows = clients.map(({ key: _, ...rest }) => rest)
  const { error } = await supabase.from('clients').upsert(rows, { onConflict: 'id' })
  if (error) logError(`clients: ${error.message}`)
  else logSuccess(`clients (${rows.length})`)

  return clientIdMap
}

// ---------------------------------------------------------------------------
// Step 5: Seed payment methods
// ---------------------------------------------------------------------------

async function seedPaymentMethods(clientIdMap: Map<string, string>) {
  log('Seeding payment_methods...')
  const rows = [
    {
      id: crypto.randomUUID(),
      client_id: clientIdMap.get('client-1')!,
      type: 'card',
      card_brand: 'visa',
      card_last4: '4242',
      card_exp_month: 12,
      card_exp_year: 2026,
      is_default: true,
      created_at: '2024-02-01T00:00:00Z',
    },
    {
      id: crypto.randomUUID(),
      client_id: clientIdMap.get('client-1')!,
      type: 'card',
      card_brand: 'mastercard',
      card_last4: '5555',
      card_exp_month: 6,
      card_exp_year: 2025,
      is_default: false,
      created_at: '2024-05-15T00:00:00Z',
    },
    {
      id: crypto.randomUUID(),
      client_id: clientIdMap.get('client-2')!,
      type: 'card',
      card_brand: 'amex',
      card_last4: '0005',
      card_exp_month: 3,
      card_exp_year: 2027,
      is_default: true,
      created_at: '2024-03-10T00:00:00Z',
    },
    {
      id: crypto.randomUUID(),
      client_id: clientIdMap.get('client-4')!,
      type: 'card',
      card_brand: 'discover',
      card_last4: '1117',
      card_exp_month: 9,
      card_exp_year: 2026,
      is_default: true,
      created_at: '2024-04-05T00:00:00Z',
    },
  ]

  const { error } = await supabase.from('payment_methods').upsert(rows, { onConflict: 'id' })
  if (error) logError(`payment_methods: ${error.message}`)
  else logSuccess(`payment_methods (${rows.length})`)
}

// ---------------------------------------------------------------------------
// Step 6: Seed pets
// ---------------------------------------------------------------------------

async function seedPets(
  orgId: string,
  clientIdMap: Map<string, string>,
  userIdMap: Map<string, string>,
) {
  log('Seeding pets...')

  const pets = [
    {
      id: crypto.randomUUID(),
      key: 'pet-1',
      client_id: clientIdMap.get('client-1')!,
      organization_id: orgId,
      name: 'Buddy',
      species: 'dog',
      breed: 'Golden Retriever',
      weight: 70,
      weight_range: 'large',
      coat_type: 'long',
      birth_date: '2020-03-15',
      behavior_level: 2,
      grooming_notes: 'Loves water. Extra brushing needed during shedding season.',
      last_grooming_date: format(addDays(today, -30), 'yyyy-MM-dd'),
      preferred_groomer_id: userIdMap.get('mike@pawsclaws.com') ?? 'user-2',
      created_at: '2024-02-01T00:00:00Z',
    },
    {
      id: crypto.randomUUID(),
      key: 'pet-2',
      client_id: clientIdMap.get('client-2')!,
      organization_id: orgId,
      name: 'Max',
      species: 'dog',
      breed: 'German Shepherd',
      weight: 85,
      weight_range: 'xlarge',
      coat_type: 'double',
      birth_date: '2019-07-22',
      behavior_level: 3,
      grooming_notes: 'Can be nervous with nail trims. Use treats.',
      medical_notes: 'Slight hip dysplasia - be gentle when positioning.',
      last_grooming_date: format(addDays(today, -45), 'yyyy-MM-dd'),
      created_at: '2024-03-10T00:00:00Z',
    },
    {
      id: crypto.randomUUID(),
      key: 'pet-3',
      client_id: clientIdMap.get('client-2')!,
      organization_id: orgId,
      name: 'Luna',
      species: 'dog',
      breed: 'Shih Tzu',
      weight: 12,
      weight_range: 'small',
      coat_type: 'long',
      birth_date: '2021-11-05',
      behavior_level: 1,
      grooming_notes: 'Very sweet. Owner prefers teddy bear cut.',
      last_grooming_date: format(addDays(today, -21), 'yyyy-MM-dd'),
      created_at: '2024-03-10T00:00:00Z',
    },
    {
      id: crypto.randomUUID(),
      key: 'pet-4',
      client_id: clientIdMap.get('client-3')!,
      organization_id: orgId,
      name: 'Whiskers',
      species: 'cat',
      breed: 'Persian',
      weight: 10,
      weight_range: 'small',
      coat_type: 'long',
      birth_date: '2022-05-10',
      behavior_level: 4,
      grooming_notes: 'First time at our salon. Owner says can be skittish.',
      created_at: '2024-08-01T00:00:00Z',
    },
    {
      id: crypto.randomUUID(),
      key: 'pet-5',
      client_id: clientIdMap.get('client-4')!,
      organization_id: orgId,
      name: 'Charlie',
      species: 'dog',
      breed: 'Poodle',
      weight: 55,
      weight_range: 'large',
      coat_type: 'curly',
      birth_date: '2020-09-18',
      behavior_level: 1,
      grooming_notes: 'Standard poodle cut. Very well-behaved.',
      last_grooming_date: format(addDays(today, -14), 'yyyy-MM-dd'),
      preferred_groomer_id: userIdMap.get('lisa@pawsclaws.com') ?? 'user-3',
      created_at: '2024-04-05T00:00:00Z',
    },
  ]

  const petIdMap = new Map<string, string>()
  for (const p of pets) {
    petIdMap.set(p.key, p.id)
  }


  const rows = pets.map(({ key: _, ...rest }) => rest)
  const { error } = await supabase.from('pets').upsert(rows, { onConflict: 'id' })
  if (error) logError(`pets: ${error.message}`)
  else logSuccess(`pets (${rows.length})`)

  return petIdMap
}

// ---------------------------------------------------------------------------
// Step 7: Seed vaccination records
// ---------------------------------------------------------------------------

async function seedVaccinationRecords(petIdMap: Map<string, string>) {
  log('Seeding vaccination_records...')
  const rows = [
    {
      id: crypto.randomUUID(),
      key: 'vax-1',
      pet_id: petIdMap.get('pet-1')!,
      name: 'Rabies',
      date_administered: format(addDays(today, -340), 'yyyy-MM-dd'),
      expiration_date: format(addDays(today, 25), 'yyyy-MM-dd'),
    },
    {
      id: crypto.randomUUID(),
      key: 'vax-2',
      pet_id: petIdMap.get('pet-1')!,
      name: 'DHPP',
      date_administered: format(addDays(today, -360), 'yyyy-MM-dd'),
      expiration_date: format(addDays(today, 5), 'yyyy-MM-dd'),
    },
    {
      id: crypto.randomUUID(),
      key: 'vax-3',
      pet_id: petIdMap.get('pet-2')!,
      name: 'Rabies',
      date_administered: format(addDays(today, -400), 'yyyy-MM-dd'),
      expiration_date: format(addDays(today, -10), 'yyyy-MM-dd'),
    },
    {
      id: crypto.randomUUID(),
      key: 'vax-4',
      pet_id: petIdMap.get('pet-3')!,
      name: 'Rabies',
      date_administered: format(addDays(today, -300), 'yyyy-MM-dd'),
      expiration_date: format(addDays(today, 65), 'yyyy-MM-dd'),
    },
    {
      id: crypto.randomUUID(),
      key: 'vax-5',
      pet_id: petIdMap.get('pet-3')!,
      name: 'Bordetella',
      date_administered: format(addDays(today, -180), 'yyyy-MM-dd'),
      expiration_date: format(addDays(today, 185), 'yyyy-MM-dd'),
    },
    {
      id: crypto.randomUUID(),
      key: 'vax-6',
      pet_id: petIdMap.get('pet-5')!,
      name: 'Rabies',
      date_administered: format(addDays(today, -200), 'yyyy-MM-dd'),
      expiration_date: format(addDays(today, 165), 'yyyy-MM-dd'),
    },
  ]

  const vaxIdMap = new Map<string, string>()
  for (const v of rows) {
    vaxIdMap.set(v.key, v.id)
  }


  const insertRows = rows.map(({ key: _, ...rest }) => rest)
  const { error } = await supabase.from('vaccination_records').upsert(insertRows, { onConflict: 'id' })
  if (error) logError(`vaccination_records: ${error.message}`)
  else logSuccess(`vaccination_records (${insertRows.length})`)

  return vaxIdMap
}

// ---------------------------------------------------------------------------
// Step 8: Seed services
// ---------------------------------------------------------------------------

async function seedServices(orgId: string) {
  log('Seeding services...')

  const services = [
    { id: crypto.randomUUID(), key: 'service-1', organization_id: orgId, name: 'Basic Bath', description: 'Includes shampoo, conditioning, blow dry, and ear cleaning.', base_duration_minutes: 45, base_price: 35, category: 'bath', is_active: true, created_at: '2024-01-01T00:00:00Z' },
    { id: crypto.randomUUID(), key: 'service-2', organization_id: orgId, name: 'Full Groom', description: 'Bath plus full haircut, nail trim, and sanitary trim.', base_duration_minutes: 90, base_price: 65, category: 'haircut', is_active: true, created_at: '2024-01-01T00:00:00Z' },
    { id: crypto.randomUUID(), key: 'service-3', organization_id: orgId, name: 'Nail Trim', description: 'Nail trimming and filing.', base_duration_minutes: 15, base_price: 15, category: 'nail', is_active: true, created_at: '2024-01-01T00:00:00Z' },
    { id: crypto.randomUUID(), key: 'service-4', organization_id: orgId, name: 'Puppy Package', description: 'Gentle introduction to grooming for puppies under 6 months.', base_duration_minutes: 30, base_price: 25, category: 'package', is_active: true, created_at: '2024-01-01T00:00:00Z' },
    { id: crypto.randomUUID(), key: 'service-5', organization_id: orgId, name: 'Teeth Brushing', description: 'Dental cleaning with pet-safe toothpaste.', base_duration_minutes: 10, base_price: 12, category: 'specialty', is_active: true, created_at: '2024-01-01T00:00:00Z' },
    { id: crypto.randomUUID(), key: 'service-6', organization_id: orgId, name: 'De-shedding Treatment', description: 'Special treatment to reduce shedding by up to 80%.', base_duration_minutes: 60, base_price: 45, category: 'specialty', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  ]

  const serviceIdMap = new Map<string, string>()
  for (const s of services) {
    serviceIdMap.set(s.key, s.id)
  }


  const rows = services.map(({ key: _, ...rest }) => rest)
  const { error } = await supabase.from('services').upsert(rows, { onConflict: 'id' })
  if (error) logError(`services: ${error.message}`)
  else logSuccess(`services (${rows.length})`)

  return serviceIdMap
}

// ---------------------------------------------------------------------------
// Step 9: Seed service modifiers
// ---------------------------------------------------------------------------

async function seedServiceModifiers(serviceIdMap: Map<string, string>) {
  log('Seeding service_modifiers...')

  const modifiers = [
    // service-1 (Basic Bath) modifiers
    { id: crypto.randomUUID(), key: 'mod-1', service_id: serviceIdMap.get('service-1')!, name: 'Large Dog', type: 'weight', duration_minutes: 15, price_adjustment: 15, is_percentage: false, condition: { weightRange: ['large'] } },
    { id: crypto.randomUUID(), key: 'mod-2', service_id: serviceIdMap.get('service-1')!, name: 'X-Large Dog', type: 'weight', duration_minutes: 30, price_adjustment: 25, is_percentage: false, condition: { weightRange: ['xlarge'] } },
    { id: crypto.randomUUID(), key: 'mod-3', service_id: serviceIdMap.get('service-1')!, name: 'Long Coat', type: 'coat', duration_minutes: 15, price_adjustment: 10, is_percentage: false, condition: { coatType: ['long', 'double'] } },
    // service-2 (Full Groom) modifiers
    { id: crypto.randomUUID(), key: 'mod-4', service_id: serviceIdMap.get('service-2')!, name: 'Large Dog', type: 'weight', duration_minutes: 30, price_adjustment: 25, is_percentage: false, condition: { weightRange: ['large'] } },
    { id: crypto.randomUUID(), key: 'mod-5', service_id: serviceIdMap.get('service-2')!, name: 'X-Large Dog', type: 'weight', duration_minutes: 45, price_adjustment: 40, is_percentage: false, condition: { weightRange: ['xlarge'] } },
    { id: crypto.randomUUID(), key: 'mod-6', service_id: serviceIdMap.get('service-2')!, name: 'Curly Coat', type: 'coat', duration_minutes: 30, price_adjustment: 20, is_percentage: false, condition: { coatType: ['curly'] } },
    { id: crypto.randomUUID(), key: 'mod-7', service_id: serviceIdMap.get('service-2')!, name: 'Double Coat', type: 'coat', duration_minutes: 20, price_adjustment: 15, is_percentage: false, condition: { coatType: ['double'] } },
    { id: crypto.randomUUID(), key: 'mod-8', service_id: serviceIdMap.get('service-2')!, name: 'Dematting', type: 'addon', duration_minutes: 30, price_adjustment: 25, is_percentage: false, condition: null },
    // service-3 (Nail Trim) modifiers
    { id: crypto.randomUUID(), key: 'mod-9', service_id: serviceIdMap.get('service-3')!, name: 'Difficult Behavior', type: 'addon', duration_minutes: 10, price_adjustment: 10, is_percentage: false, condition: null },
    // service-6 (De-shedding) modifiers
    { id: crypto.randomUUID(), key: 'mod-10', service_id: serviceIdMap.get('service-6')!, name: 'Large Dog', type: 'weight', duration_minutes: 20, price_adjustment: 20, is_percentage: false, condition: { weightRange: ['large', 'xlarge'] } },
  ]

  const modIdMap = new Map<string, string>()
  for (const m of modifiers) {
    modIdMap.set(m.key, m.id)
  }


  const rows = modifiers.map(({ key: _, ...rest }) => rest)
  const { error } = await supabase.from('service_modifiers').upsert(rows, { onConflict: 'id' })
  if (error) logError(`service_modifiers: ${error.message}`)
  else logSuccess(`service_modifiers (${rows.length})`)

  return modIdMap
}

// ---------------------------------------------------------------------------
// Step 10: Seed groomers
// ---------------------------------------------------------------------------

async function seedGroomers(orgId: string, userIdMap: Map<string, string>) {
  log('Seeding groomers...')

  const rows = [
    {
      id: crypto.randomUUID(),
      organization_id: orgId,
      user_id: userIdMap.get('mike@pawsclaws.com') ?? 'user-2',
      first_name: 'Mike',
      last_name: 'Chen',
      email: 'mike@pawsclaws.com',
      phone: '(555) 222-3333',
      specialties: ['Large breeds', 'Hand stripping', 'Show cuts'],
      is_active: true,
      role: 'groomer',
      created_at: '2024-01-15T00:00:00Z',
    },
    {
      id: crypto.randomUUID(),
      organization_id: orgId,
      user_id: userIdMap.get('lisa@pawsclaws.com') ?? 'user-3',
      first_name: 'Lisa',
      last_name: 'Martinez',
      email: 'lisa@pawsclaws.com',
      phone: '(555) 333-4444',
      specialties: ['Small breeds', 'Cats', 'Puppy first grooms'],
      is_active: true,
      role: 'groomer',
      created_at: '2024-02-01T00:00:00Z',
    },
    {
      id: crypto.randomUUID(),
      organization_id: orgId,
      user_id: userIdMap.get('admin@pawsclaws.com') ?? 'user-1',
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'admin@pawsclaws.com',
      phone: '(555) 111-2222',
      specialties: ['Management', 'All breeds'],
      is_active: true,
      role: 'owner',
      created_at: '2024-01-01T00:00:00Z',
    },
  ]

  const { error } = await supabase.from('groomers').upsert(rows, { onConflict: 'id' })
  if (error) logError(`groomers: ${error.message}`)
  else logSuccess(`groomers (${rows.length})`)
}

// ---------------------------------------------------------------------------
// Step 11: Seed staff availability
// ---------------------------------------------------------------------------

function createDefaultWeeklySchedule(
  workDays: number[] = [1, 2, 3, 4, 5],
  startTime = '09:00',
  endTime = '17:00',
  breakStart?: string,
  breakEnd?: string,
) {
  return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    dayOfWeek: day,
    isWorkingDay: workDays.includes(day),
    startTime,
    endTime,
    breakStart: breakStart ?? null,
    breakEnd: breakEnd ?? null,
  }))
}

async function seedStaffAvailability(userIdMap: Map<string, string>) {
  log('Seeding staff_availability...')

  const rows = [
    {
      id: crypto.randomUUID(),
      staff_id: userIdMap.get('mike@pawsclaws.com') ?? 'user-2',
      weekly_schedule: createDefaultWeeklySchedule([1, 2, 3, 4, 5], '08:00', '16:00', '12:00', '12:30'),
      max_appointments_per_day: 8,
      buffer_minutes_between_appointments: 15,
    },
    {
      id: crypto.randomUUID(),
      staff_id: userIdMap.get('lisa@pawsclaws.com') ?? 'user-3',
      weekly_schedule: createDefaultWeeklySchedule([1, 2, 3, 4, 6], '10:00', '18:00', '13:00', '13:30'),
      max_appointments_per_day: 6,
      buffer_minutes_between_appointments: 20,
    },
  ]

  const { error } = await supabase.from('staff_availability').upsert(rows, { onConflict: 'id' })
  if (error) logError(`staff_availability: ${error.message}`)
  else logSuccess(`staff_availability (${rows.length})`)
}

// ---------------------------------------------------------------------------
// Step 12: Seed time off requests
// ---------------------------------------------------------------------------

async function seedTimeOffRequests(userIdMap: Map<string, string>) {
  log('Seeding time_off_requests...')

  const rows = [
    {
      id: crypto.randomUUID(),
      staff_id: userIdMap.get('mike@pawsclaws.com') ?? 'user-2',
      start_date: format(addDays(today, 14), 'yyyy-MM-dd'),
      end_date: format(addDays(today, 16), 'yyyy-MM-dd'),
      reason: 'Personal time',
      status: 'approved',
      created_at: '2024-08-01T00:00:00Z',
    },
  ]

  const { error } = await supabase.from('time_off_requests').upsert(rows, { onConflict: 'id' })
  if (error) logError(`time_off_requests: ${error.message}`)
  else logSuccess(`time_off_requests (${rows.length})`)
}

// ---------------------------------------------------------------------------
// Step 13: Seed appointments, appointment_pets, appointment_services
// ---------------------------------------------------------------------------

interface AppointmentDef {
  aptKey: string
  clientKey: string
  groomerEmail: string
  dayOffset: number
  startHour: number
  durationHours: number
  status: string
  internalNotes?: string
  clientNotes?: string
  depositAmount?: number
  depositPaid: boolean
  totalAmount: number
  createdAt: string
  updatedAt: string
  pets: {
    petKey: string
    services: {
      serviceKey: string
      modifierKeys: string[]
      finalDuration: number
      finalPrice: number
    }[]
  }[]
}

const APPOINTMENT_DEFS: AppointmentDef[] = [
  {
    aptKey: 'apt-1', clientKey: 'client-1', groomerEmail: 'mike@pawsclaws.com',
    dayOffset: 0, startHour: 9, durationHours: 2.25, status: 'confirmed',
    internalNotes: 'Regular client. Buddy loves his groomer Mike.',
    depositAmount: 25, depositPaid: true, totalAmount: 100,
    createdAt: '2024-08-10T00:00:00Z', updatedAt: '2024-08-10T00:00:00Z',
    pets: [{ petKey: 'pet-1', services: [{ serviceKey: 'service-2', modifierKeys: ['mod-4', 'mod-3'], finalDuration: 135, finalPrice: 100 }] }],
  },
  {
    aptKey: 'apt-2', clientKey: 'client-2', groomerEmail: 'lisa@pawsclaws.com',
    dayOffset: 0, startHour: 11, durationHours: 3, status: 'checked_in',
    clientNotes: 'Please groom Max and Luna together.',
    depositAmount: 35, depositPaid: true, totalAmount: 135,
    createdAt: '2024-08-12T00:00:00Z', updatedAt: '2024-08-12T00:00:00Z',
    pets: [
      { petKey: 'pet-2', services: [{ serviceKey: 'service-1', modifierKeys: ['mod-2', 'mod-3'], finalDuration: 90, finalPrice: 70 }] },
      { petKey: 'pet-3', services: [{ serviceKey: 'service-2', modifierKeys: [], finalDuration: 90, finalPrice: 65 }] },
    ],
  },
  {
    aptKey: 'apt-3', clientKey: 'client-4', groomerEmail: 'lisa@pawsclaws.com',
    dayOffset: 0, startHour: 15, durationHours: 2.5, status: 'confirmed',
    internalNotes: 'Charlie is a regular. Standard poodle cut.',
    depositAmount: 30, depositPaid: true, totalAmount: 122,
    createdAt: '2024-08-14T00:00:00Z', updatedAt: '2024-08-14T00:00:00Z',
    pets: [{ petKey: 'pet-5', services: [
      { serviceKey: 'service-2', modifierKeys: ['mod-4', 'mod-6'], finalDuration: 150, finalPrice: 110 },
      { serviceKey: 'service-5', modifierKeys: [], finalDuration: 10, finalPrice: 12 },
    ] }],
  },
  {
    aptKey: 'apt-4', clientKey: 'client-3', groomerEmail: 'mike@pawsclaws.com',
    dayOffset: 1, startHour: 10, durationHours: 1, status: 'requested',
    clientNotes: 'First visit. Cat may be nervous.',
    depositPaid: false, totalAmount: 45,
    createdAt: '2024-08-15T00:00:00Z', updatedAt: '2024-08-15T00:00:00Z',
    pets: [{ petKey: 'pet-4', services: [{ serviceKey: 'service-1', modifierKeys: ['mod-3'], finalDuration: 60, finalPrice: 45 }] }],
  },
  {
    aptKey: 'apt-5', clientKey: 'client-1', groomerEmail: 'mike@pawsclaws.com',
    dayOffset: 2, startHour: 9, durationHours: 0.25, status: 'confirmed',
    depositPaid: false, totalAmount: 15,
    createdAt: '2024-08-16T00:00:00Z', updatedAt: '2024-08-16T00:00:00Z',
    pets: [{ petKey: 'pet-1', services: [{ serviceKey: 'service-3', modifierKeys: [], finalDuration: 15, finalPrice: 15 }] }],
  },
  {
    aptKey: 'apt-6', clientKey: 'client-4', groomerEmail: 'lisa@pawsclaws.com',
    dayOffset: 3, startHour: 13, durationHours: 1.5, status: 'confirmed',
    internalNotes: 'De-shedding treatment before summer.',
    depositAmount: 15, depositPaid: true, totalAmount: 65,
    createdAt: '2024-08-17T00:00:00Z', updatedAt: '2024-08-17T00:00:00Z',
    pets: [{ petKey: 'pet-5', services: [{ serviceKey: 'service-6', modifierKeys: ['mod-10'], finalDuration: 80, finalPrice: 65 }] }],
  },
  // Past appointments
  {
    aptKey: 'apt-7', clientKey: 'client-1', groomerEmail: 'mike@pawsclaws.com',
    dayOffset: -7, startHour: 10, durationHours: 2.25, status: 'completed',
    depositAmount: 25, depositPaid: true, totalAmount: 100,
    createdAt: '2024-08-01T00:00:00Z', updatedAt: '2024-08-08T00:00:00Z',
    pets: [{ petKey: 'pet-1', services: [{ serviceKey: 'service-2', modifierKeys: ['mod-4', 'mod-3'], finalDuration: 135, finalPrice: 100 }] }],
  },
  {
    aptKey: 'apt-8', clientKey: 'client-2', groomerEmail: 'lisa@pawsclaws.com',
    dayOffset: -14, startHour: 14, durationHours: 1.5, status: 'completed',
    depositAmount: 15, depositPaid: true, totalAmount: 65,
    createdAt: '2024-07-25T00:00:00Z', updatedAt: '2024-08-01T00:00:00Z',
    pets: [{ petKey: 'pet-3', services: [{ serviceKey: 'service-2', modifierKeys: [], finalDuration: 90, finalPrice: 65 }] }],
  },
]

async function seedAppointments(
  orgId: string,
  clientIdMap: Map<string, string>,
  petIdMap: Map<string, string>,
  serviceIdMap: Map<string, string>,
  modIdMap: Map<string, string>,
  userIdMap: Map<string, string>,
) {
  log('Seeding appointments...')

  // Insert appointments
  const aptIdMap = new Map<string, string>()
  const aptRows = APPOINTMENT_DEFS.map((def) => {
    const id = crypto.randomUUID()
    aptIdMap.set(def.aptKey, id)
    const startTime = createAppointmentTime(def.dayOffset, def.startHour)
    return {
      id,
      organization_id: orgId,
      client_id: clientIdMap.get(def.clientKey)!,
      groomer_id: userIdMap.get(def.groomerEmail) ?? def.groomerEmail,
      start_time: startTime.toISOString(),
      end_time: addHours(startTime, def.durationHours).toISOString(),
      status: def.status,
      internal_notes: def.internalNotes ?? null,
      client_notes: def.clientNotes ?? null,
      deposit_amount: def.depositAmount ?? null,
      deposit_paid: def.depositPaid,
      total_amount: def.totalAmount,
      created_at: def.createdAt,
    }
  })

  const { error: aptError } = await supabase.from('appointments').upsert(aptRows, { onConflict: 'id' })
  if (aptError) logError(`appointments: ${aptError.message}`)
  else logSuccess(`appointments (${aptRows.length})`)

  // Insert appointment_pets
  log('Seeding appointment_pets...')
  const aptPetRows: { id: string; appointment_id: string; pet_id: string; aptKey: string; petKey: string }[] = []
  for (const def of APPOINTMENT_DEFS) {
    for (const petDef of def.pets) {
      aptPetRows.push({
        id: crypto.randomUUID(),
        appointment_id: aptIdMap.get(def.aptKey)!,
        pet_id: petIdMap.get(petDef.petKey)!,
        aptKey: def.aptKey,
        petKey: petDef.petKey,
      })
    }
  }


  const aptPetInsertRows = aptPetRows.map(({ aptKey: _, petKey: __, ...rest }) => rest)
  const { error: aptPetError } = await supabase.from('appointment_pets').upsert(aptPetInsertRows, { onConflict: 'id' })
  if (aptPetError) logError(`appointment_pets: ${aptPetError.message}`)
  else logSuccess(`appointment_pets (${aptPetInsertRows.length})`)

  // Insert appointment_services
  log('Seeding appointment_services...')
  const aptServiceRows: { id: string; appointment_pet_id: string; service_id: string; applied_modifier_ids: string[]; final_duration: number; final_price: number }[] = []
  for (const def of APPOINTMENT_DEFS) {
    for (const petDef of def.pets) {
      // Find the corresponding appointment_pet row
      const aptPetRow = aptPetRows.find((r) => r.aptKey === def.aptKey && r.petKey === petDef.petKey)
      if (!aptPetRow) continue
      for (const svc of petDef.services) {
        aptServiceRows.push({
          id: crypto.randomUUID(),
          appointment_pet_id: aptPetRow.id,
          service_id: serviceIdMap.get(svc.serviceKey)!,
          applied_modifier_ids: svc.modifierKeys.map((k) => modIdMap.get(k)!),
          final_duration: svc.finalDuration,
          final_price: svc.finalPrice,
        })
      }
    }
  }

  const { error: aptSvcError } = await supabase.from('appointment_services').upsert(aptServiceRows, { onConflict: 'id' })
  if (aptSvcError) logError(`appointment_services: ${aptSvcError.message}`)
  else logSuccess(`appointment_services (${aptServiceRows.length})`)
}

// ---------------------------------------------------------------------------
// Step 14: Seed booking policies
// ---------------------------------------------------------------------------

async function seedBookingPolicies(orgId: string) {
  log('Seeding booking_policies...')
  const { error } = await supabase.from('booking_policies').upsert(
    {
      id: crypto.randomUUID(),
      organization_id: orgId,
      new_client_mode: 'request_only',
      existing_client_mode: 'auto_confirm',
      deposit_required: true,
      deposit_percentage: 25,
      deposit_minimum: 15,
      no_show_fee_percentage: 50,
      cancellation_window_hours: 24,
      late_cancellation_fee_percentage: 50,
      max_pets_per_appointment: 3,
      min_advance_booking_hours: 24,
      max_advance_booking_days: 60,
      policy_text: 'A 25% deposit is required to confirm your appointment. Cancellations made less than 24 hours in advance are subject to a 50% cancellation fee. No-shows will be charged 50% of the appointment total.',
    },
    { onConflict: 'organization_id' },
  )
  if (error) logError(`booking_policies: ${error.message}`)
  else logSuccess('booking_policies')
}

// ---------------------------------------------------------------------------
// Step 15: Seed reminder schedules
// ---------------------------------------------------------------------------

async function seedReminderSchedules(orgId: string) {
  log('Seeding reminder_schedules...')
  const { error } = await supabase.from('reminder_schedules').upsert(
    {
      id: crypto.randomUUID(),
      organization_id: orgId,
      appointment_reminders: {
        enabled48h: true,
        enabled24h: true,
        enabled2h: false,
        template48h: "Hi {{clientName}}! This is a reminder that {{petName}}'s grooming appointment is in 2 days on {{date}} at {{time}}. Please reply to this email or call us if you need to reschedule.",
        template24h: "Reminder: {{petName}}'s grooming appointment is tomorrow at {{time}}. Please arrive 5 minutes early. See you soon!",
        template2h: "{{petName}}'s appointment starts in 2 hours at {{time}}. We're looking forward to seeing you!",
      },
      due_for_grooming: {
        enabled: true,
        intervalDays: 42,
        template: "Hi {{clientName}}! It's been a while since {{petName}}'s last groom. Ready to book their next appointment? Visit our booking page or give us a call!",
      },
    },
    { onConflict: 'organization_id' },
  )
  if (error) logError(`reminder_schedules: ${error.message}`)
  else logSuccess('reminder_schedules')
}

// ---------------------------------------------------------------------------
// Step 16: Seed vaccination reminder settings
// ---------------------------------------------------------------------------

async function seedVaccinationReminderSettings(orgId: string) {
  log('Seeding vaccination_reminder_settings...')
  const { error } = await supabase.from('vaccination_reminder_settings').upsert(
    {
      id: crypto.randomUUID(),
      organization_id: orgId,
      enabled: true,
      reminder_days: [30, 7],
      channels: { inApp: true, email: true },
      block_booking_on_expired: true,
    },
    { onConflict: 'organization_id' },
  )
  if (error) logError(`vaccination_reminder_settings: ${error.message}`)
  else logSuccess('vaccination_reminder_settings')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('')
  console.log('\x1b[1m=== Sit Pretty Club - Supabase Seed ===\x1b[0m')
  console.log(`Supabase URL: ${SUPABASE_URL}`)
  console.log(`Date anchor: ${format(today, 'yyyy-MM-dd')}`)
  console.log('')

  try {
    // 1. Auth users
    const emailToId = await createAuthUsers()

    // 2. Organization
    const orgId = await seedOrganizations()

    // 3. Users table
    await seedUsers(emailToId, orgId)

    // 4. Clients
    const clientIdMap = await seedClients(orgId)

    // 5. Payment methods
    await seedPaymentMethods(clientIdMap)

    // 6. Pets
    const petIdMap = await seedPets(orgId, clientIdMap, emailToId)

    // 7. Vaccination records
    await seedVaccinationRecords(petIdMap)

    // 8. Services
    const serviceIdMap = await seedServices(orgId)

    // 9. Service modifiers
    const modIdMap = await seedServiceModifiers(serviceIdMap)

    // 10. Groomers
    await seedGroomers(orgId, emailToId)

    // 11. Staff availability
    await seedStaffAvailability(emailToId)

    // 12. Time off requests
    await seedTimeOffRequests(emailToId)

    // 13. Appointments + appointment_pets + appointment_services
    await seedAppointments(orgId, clientIdMap, petIdMap, serviceIdMap, modIdMap, emailToId)

    // 14. Booking policies
    await seedBookingPolicies(orgId)

    // 15. Reminder schedules
    await seedReminderSchedules(orgId)

    // 16. Vaccination reminder settings
    await seedVaccinationReminderSettings(orgId)

    console.log('')
    console.log('\x1b[1m\x1b[32mSeed complete!\x1b[0m')
    console.log('')
    console.log('Demo logins:')
    for (const u of AUTH_USERS) {
      const id = emailToId.get(u.email) ?? '(failed)'
      console.log(`  ${u.name.padEnd(18)} ${u.email.padEnd(28)} role: ${u.role.padEnd(14)} id: ${id}`)
    }
    console.log('')
  } catch (err) {
    console.error('\x1b[31mFatal error during seed:\x1b[0m', err)
    process.exit(1)
  }
}

main()
