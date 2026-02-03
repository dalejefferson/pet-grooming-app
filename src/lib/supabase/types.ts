/**
 * Supabase Database TypeScript Definitions
 *
 * These types mirror the SQL schema in supabase/migrations/.
 * In production, regenerate with: npx supabase gen types typescript --local > src/lib/supabase/types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ============================================================
// Enum types matching PostgreSQL custom types
// ============================================================

export type StaffRole = 'owner' | 'admin' | 'groomer' | 'receptionist'
export type PetSpecies = 'dog' | 'cat' | 'other'
export type CoatType = 'short' | 'medium' | 'long' | 'curly' | 'double' | 'wire'
export type WeightRange = 'small' | 'medium' | 'large' | 'xlarge'
export type ServiceCategory = 'bath' | 'haircut' | 'nail' | 'specialty' | 'package'
export type ModifierType = 'weight' | 'coat' | 'breed' | 'addon'
export type AppointmentStatus = 'requested' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type ContactMethod = 'email' | 'phone' | 'text'
export type NotificationChannel = 'in_app' | 'email' | 'sms'
export type NotificationType = 'vaccination_expiring' | 'vaccination_expired' | 'appointment_reminder' | 'general'
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown'
export type BookingMode = 'auto_confirm' | 'request_only' | 'blocked'
export type ExistingClientMode = 'auto_confirm' | 'request_only'
export type TimeOffStatus = 'pending' | 'approved' | 'rejected'
export type VaccinationReminderType = '30_day' | '7_day' | 'expired'
export type ReminderStatus = 'pending' | 'sent' | 'dismissed'
export type DeletedEntityType = 'client' | 'pet' | 'groomer' | 'service'

// ============================================================
// Database type (used by createClient<Database>)
// ============================================================

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          address: string
          phone: string
          email: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          address?: string
          phone?: string
          email?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          address?: string
          phone?: string
          email?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }

      staff: {
        Row: {
          id: string
          auth_user_id: string | null
          organization_id: string
          email: string
          name: string
          role: StaffRole
          avatar_url: string | null
          permission_overrides: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          organization_id: string
          email: string
          name: string
          role?: StaffRole
          avatar_url?: string | null
          permission_overrides?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          organization_id?: string
          email?: string
          name?: string
          role?: StaffRole
          avatar_url?: string | null
          permission_overrides?: Json
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'staff_auth_user_id_fkey'
            columns: ['auth_user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'staff_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }

      clients: {
        Row: {
          id: string
          organization_id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          address: string | null
          notes: string | null
          image_url: string | null
          preferred_contact_method: ContactMethod
          is_new_client: boolean
          notification_preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          first_name: string
          last_name: string
          email: string
          phone?: string
          address?: string | null
          notes?: string | null
          image_url?: string | null
          preferred_contact_method?: ContactMethod
          is_new_client?: boolean
          notification_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          address?: string | null
          notes?: string | null
          image_url?: string | null
          preferred_contact_method?: ContactMethod
          is_new_client?: boolean
          notification_preferences?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'clients_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }

      pets: {
        Row: {
          id: string
          client_id: string
          organization_id: string
          name: string
          species: PetSpecies
          breed: string
          weight: number
          weight_range: WeightRange
          coat_type: CoatType
          birth_date: string | null
          behavior_level: number
          grooming_notes: string | null
          medical_notes: string | null
          image_url: string | null
          last_grooming_date: string | null
          preferred_groomer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          organization_id: string
          name: string
          species?: PetSpecies
          breed?: string
          weight?: number
          weight_range?: WeightRange
          coat_type?: CoatType
          birth_date?: string | null
          behavior_level?: number
          grooming_notes?: string | null
          medical_notes?: string | null
          image_url?: string | null
          last_grooming_date?: string | null
          preferred_groomer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          organization_id?: string
          name?: string
          species?: PetSpecies
          breed?: string
          weight?: number
          weight_range?: WeightRange
          coat_type?: CoatType
          birth_date?: string | null
          behavior_level?: number
          grooming_notes?: string | null
          medical_notes?: string | null
          image_url?: string | null
          last_grooming_date?: string | null
          preferred_groomer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pets_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pets_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pets_preferred_groomer_id_fkey'
            columns: ['preferred_groomer_id']
            isOneToOne: false
            referencedRelation: 'staff'
            referencedColumns: ['id']
          },
        ]
      }

      vaccinations: {
        Row: {
          id: string
          pet_id: string
          name: string
          date_administered: string
          expiration_date: string
          document_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          name: string
          date_administered: string
          expiration_date: string
          document_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          name?: string
          date_administered?: string
          expiration_date?: string
          document_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'vaccinations_pet_id_fkey'
            columns: ['pet_id']
            isOneToOne: false
            referencedRelation: 'pets'
            referencedColumns: ['id']
          },
        ]
      }

      services: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string
          base_duration_minutes: number
          base_price: number
          category: ServiceCategory
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string
          base_duration_minutes?: number
          base_price?: number
          category?: ServiceCategory
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string
          base_duration_minutes?: number
          base_price?: number
          category?: ServiceCategory
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'services_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }

      service_modifiers: {
        Row: {
          id: string
          service_id: string
          name: string
          type: ModifierType
          condition: Json
          duration_minutes: number
          price_adjustment: number
          is_percentage: boolean
        }
        Insert: {
          id?: string
          service_id: string
          name: string
          type: ModifierType
          condition?: Json
          duration_minutes?: number
          price_adjustment?: number
          is_percentage?: boolean
        }
        Update: {
          id?: string
          service_id?: string
          name?: string
          type?: ModifierType
          condition?: Json
          duration_minutes?: number
          price_adjustment?: number
          is_percentage?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'service_modifiers_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
        ]
      }

      appointments: {
        Row: {
          id: string
          organization_id: string
          client_id: string
          groomer_id: string | null
          start_time: string
          end_time: string
          status: AppointmentStatus
          status_notes: string | null
          internal_notes: string | null
          client_notes: string | null
          deposit_amount: number | null
          deposit_paid: boolean
          total_amount: number
          tip_amount: number | null
          payment_status: PaymentStatus | null
          paid_at: string | null
          transaction_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          client_id: string
          groomer_id?: string | null
          start_time: string
          end_time: string
          status?: AppointmentStatus
          status_notes?: string | null
          internal_notes?: string | null
          client_notes?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean
          total_amount?: number
          tip_amount?: number | null
          payment_status?: PaymentStatus | null
          paid_at?: string | null
          transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          client_id?: string
          groomer_id?: string | null
          start_time?: string
          end_time?: string
          status?: AppointmentStatus
          status_notes?: string | null
          internal_notes?: string | null
          client_notes?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean
          total_amount?: number
          tip_amount?: number | null
          payment_status?: PaymentStatus | null
          paid_at?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'appointments_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_groomer_id_fkey'
            columns: ['groomer_id']
            isOneToOne: false
            referencedRelation: 'staff'
            referencedColumns: ['id']
          },
        ]
      }

      appointment_pets: {
        Row: {
          id: string
          appointment_id: string
          pet_id: string
        }
        Insert: {
          id?: string
          appointment_id: string
          pet_id: string
        }
        Update: {
          id?: string
          appointment_id?: string
          pet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'appointment_pets_appointment_id_fkey'
            columns: ['appointment_id']
            isOneToOne: false
            referencedRelation: 'appointments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointment_pets_pet_id_fkey'
            columns: ['pet_id']
            isOneToOne: false
            referencedRelation: 'pets'
            referencedColumns: ['id']
          },
        ]
      }

      appointment_pet_services: {
        Row: {
          id: string
          appointment_pet_id: string
          service_id: string
          applied_modifier_ids: string[]
          final_duration: number
          final_price: number
        }
        Insert: {
          id?: string
          appointment_pet_id: string
          service_id: string
          applied_modifier_ids?: string[]
          final_duration?: number
          final_price?: number
        }
        Update: {
          id?: string
          appointment_pet_id?: string
          service_id?: string
          applied_modifier_ids?: string[]
          final_duration?: number
          final_price?: number
        }
        Relationships: [
          {
            foreignKeyName: 'appointment_pet_services_appointment_pet_id_fkey'
            columns: ['appointment_pet_id']
            isOneToOne: false
            referencedRelation: 'appointment_pets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointment_pet_services_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
        ]
      }

      booking_policies: {
        Row: {
          id: string
          organization_id: string
          new_client_mode: BookingMode
          existing_client_mode: ExistingClientMode
          deposit_required: boolean
          deposit_percentage: number
          deposit_minimum: number
          no_show_fee_percentage: number
          cancellation_window_hours: number
          late_cancellation_fee_percentage: number
          max_pets_per_appointment: number
          min_advance_booking_hours: number
          max_advance_booking_days: number
          policy_text: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          new_client_mode?: BookingMode
          existing_client_mode?: ExistingClientMode
          deposit_required?: boolean
          deposit_percentage?: number
          deposit_minimum?: number
          no_show_fee_percentage?: number
          cancellation_window_hours?: number
          late_cancellation_fee_percentage?: number
          max_pets_per_appointment?: number
          min_advance_booking_hours?: number
          max_advance_booking_days?: number
          policy_text?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          new_client_mode?: BookingMode
          existing_client_mode?: ExistingClientMode
          deposit_required?: boolean
          deposit_percentage?: number
          deposit_minimum?: number
          no_show_fee_percentage?: number
          cancellation_window_hours?: number
          late_cancellation_fee_percentage?: number
          max_pets_per_appointment?: number
          min_advance_booking_hours?: number
          max_advance_booking_days?: number
          policy_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'booking_policies_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: true
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }

      reminder_schedules: {
        Row: {
          id: string
          organization_id: string
          appointment_reminders: Json
          due_for_grooming: Json
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          appointment_reminders?: Json
          due_for_grooming?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          appointment_reminders?: Json
          due_for_grooming?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reminder_schedules_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: true
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }

      vaccination_reminder_settings: {
        Row: {
          id: string
          organization_id: string
          enabled: boolean
          reminder_days: number[]
          channels: Json
          block_booking_on_expired: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          enabled?: boolean
          reminder_days?: number[]
          channels?: Json
          block_booking_on_expired?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          enabled?: boolean
          reminder_days?: number[]
          channels?: Json
          block_booking_on_expired?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'vaccination_reminder_settings_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: true
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }

      vaccination_reminders: {
        Row: {
          id: string
          pet_id: string
          client_id: string
          vaccination_id: string
          vaccination_name: string
          expiration_date: string
          reminder_type: VaccinationReminderType
          status: ReminderStatus
          channels: NotificationChannel[]
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          client_id: string
          vaccination_id: string
          vaccination_name: string
          expiration_date: string
          reminder_type: VaccinationReminderType
          status?: ReminderStatus
          channels?: NotificationChannel[]
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          client_id?: string
          vaccination_id?: string
          vaccination_name?: string
          expiration_date?: string
          reminder_type?: VaccinationReminderType
          status?: ReminderStatus
          channels?: NotificationChannel[]
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'vaccination_reminders_pet_id_fkey'
            columns: ['pet_id']
            isOneToOne: false
            referencedRelation: 'pets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vaccination_reminders_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vaccination_reminders_vaccination_id_fkey'
            columns: ['vaccination_id']
            isOneToOne: false
            referencedRelation: 'vaccinations'
            referencedColumns: ['id']
          },
        ]
      }

      notifications: {
        Row: {
          id: string
          organization_id: string
          type: NotificationType
          title: string
          message: string
          pet_id: string | null
          client_id: string | null
          target_staff_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          type?: NotificationType
          title: string
          message: string
          pet_id?: string | null
          client_id?: string | null
          target_staff_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          type?: NotificationType
          title?: string
          message?: string
          pet_id?: string | null
          client_id?: string | null
          target_staff_id?: string | null
          read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_pet_id_fkey'
            columns: ['pet_id']
            isOneToOne: false
            referencedRelation: 'pets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_target_staff_id_fkey'
            columns: ['target_staff_id']
            isOneToOne: false
            referencedRelation: 'staff'
            referencedColumns: ['id']
          },
        ]
      }

      payment_methods: {
        Row: {
          id: string
          client_id: string
          type: string
          card_brand: CardBrand
          card_last4: string
          card_exp_month: number
          card_exp_year: number
          is_default: boolean
          stripe_payment_method_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          type?: string
          card_brand?: CardBrand
          card_last4: string
          card_exp_month: number
          card_exp_year: number
          is_default?: boolean
          stripe_payment_method_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          type?: string
          card_brand?: CardBrand
          card_last4?: string
          card_exp_month?: number
          card_exp_year?: number
          is_default?: boolean
          stripe_payment_method_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'payment_methods_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
        ]
      }

      staff_availability: {
        Row: {
          id: string
          staff_id: string
          weekly_schedule: Json
          max_appointments_per_day: number
          buffer_minutes_between_appointments: number
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          weekly_schedule?: Json
          max_appointments_per_day?: number
          buffer_minutes_between_appointments?: number
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          weekly_schedule?: Json
          max_appointments_per_day?: number
          buffer_minutes_between_appointments?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'staff_availability_staff_id_fkey'
            columns: ['staff_id']
            isOneToOne: true
            referencedRelation: 'staff'
            referencedColumns: ['id']
          },
        ]
      }

      time_off_requests: {
        Row: {
          id: string
          staff_id: string
          start_date: string
          end_date: string
          reason: string | null
          status: TimeOffStatus
          created_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          start_date: string
          end_date: string
          reason?: string | null
          status?: TimeOffStatus
          created_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          start_date?: string
          end_date?: string
          reason?: string | null
          status?: TimeOffStatus
        }
        Relationships: [
          {
            foreignKeyName: 'time_off_requests_staff_id_fkey'
            columns: ['staff_id']
            isOneToOne: false
            referencedRelation: 'staff'
            referencedColumns: ['id']
          },
        ]
      }

      deleted_items: {
        Row: {
          id: string
          entity_type: DeletedEntityType
          entity_id: string
          entity_name: string
          data: Json
          deleted_by: string | null
          deleted_at: string
        }
        Insert: {
          id?: string
          entity_type: DeletedEntityType
          entity_id: string
          entity_name: string
          data?: Json
          deleted_by?: string | null
          deleted_at?: string
        }
        Update: {
          id?: string
          entity_type?: DeletedEntityType
          entity_id?: string
          entity_name?: string
          data?: Json
          deleted_by?: string | null
          deleted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'deleted_items_deleted_by_fkey'
            columns: ['deleted_by']
            isOneToOne: false
            referencedRelation: 'staff'
            referencedColumns: ['id']
          },
        ]
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      get_user_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: StaffRole
      }
      get_user_staff_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }

    Enums: {
      staff_role: StaffRole
      pet_species: PetSpecies
      coat_type: CoatType
      weight_range: WeightRange
      service_category: ServiceCategory
      modifier_type: ModifierType
      appointment_status: AppointmentStatus
      payment_status: PaymentStatus
      contact_method: ContactMethod
      notification_channel: NotificationChannel
      notification_type: NotificationType
      card_brand: CardBrand
      booking_mode: BookingMode
      existing_client_mode: ExistingClientMode
      time_off_status: TimeOffStatus
      vaccination_reminder_type: VaccinationReminderType
      reminder_status: ReminderStatus
      deleted_entity_type: DeletedEntityType
    }

    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================================
// Helper types for convenience
// ============================================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
