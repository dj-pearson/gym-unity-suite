export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      check_ins: {
        Row: {
          checked_in_at: string
          checked_out_at: string | null
          id: string
          location_id: string
          member_id: string
        }
        Insert: {
          checked_in_at?: string
          checked_out_at?: string | null
          id?: string
          location_id: string
          member_id: string
        }
        Update: {
          checked_in_at?: string
          checked_out_at?: string | null
          id?: string
          location_id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_bookings: {
        Row: {
          attended_at: string | null
          booked_at: string
          class_id: string
          id: string
          member_id: string
          status: string
        }
        Insert: {
          attended_at?: string | null
          booked_at?: string
          class_id: string
          id?: string
          member_id: string
          status?: string
        }
        Update: {
          attended_at?: string | null
          booked_at?: string
          class_id?: string
          id?: string
          member_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_bookings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          instructor_id: string | null
          location_id: string
          max_capacity: number
          name: string
          organization_id: string
          scheduled_at: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instructor_id?: string | null
          location_id: string
          max_capacity?: number
          name: string
          organization_id: string
          scheduled_at: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instructor_id?: string | null
          location_id?: string
          max_capacity?: number
          name?: string
          organization_id?: string
          scheduled_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "class_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_calculations: {
        Row: {
          commission_amount: number
          commission_type: string
          created_at: string
          id: string
          lead_id: string
          membership_id: string | null
          payment_period_end: string | null
          payment_period_start: string | null
          revenue_basis: string
          salesperson_id: string
          status: string
          updated_at: string
        }
        Insert: {
          commission_amount: number
          commission_type: string
          created_at?: string
          id?: string
          lead_id: string
          membership_id?: string | null
          payment_period_end?: string | null
          payment_period_start?: string | null
          revenue_basis: string
          salesperson_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          commission_type?: string
          created_at?: string
          id?: string
          lead_id?: string
          membership_id?: string | null
          payment_period_end?: string | null
          payment_period_start?: string | null
          revenue_basis?: string
          salesperson_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_calculations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_calculations_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_calculations_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          lead_id: string
          next_action: string | null
          outcome: string | null
          scheduled_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          activity_type: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          lead_id: string
          next_action?: string | null
          outcome?: string | null
          scheduled_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          lead_id?: string
          next_action?: string | null
          outcome?: string | null
          scheduled_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_attribution_disputes: {
        Row: {
          created_at: string
          current_salesperson_id: string | null
          dispute_reason: string
          disputing_salesperson_id: string
          evidence: string | null
          id: string
          lead_id: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_salesperson_id?: string | null
          dispute_reason: string
          disputing_salesperson_id: string
          evidence?: string | null
          id?: string
          lead_id: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_salesperson_id?: string | null
          dispute_reason?: string
          disputing_salesperson_id?: string
          evidence?: string | null
          id?: string
          lead_id?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_attribution_disputes_current_salesperson_id_fkey"
            columns: ["current_salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_attribution_disputes_disputing_salesperson_id_fkey"
            columns: ["disputing_salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_attribution_disputes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_attribution_disputes_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_split_commissions: {
        Row: {
          commission_percentage: number
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          salesperson_id: string
        }
        Insert: {
          commission_percentage: number
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          salesperson_id: string
        }
        Update: {
          commission_percentage?: number
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          salesperson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_split_commissions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_split_commissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_split_commissions_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_stages: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_closed: boolean | null
          name: string
          order_index: number
          organization_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_closed?: boolean | null
          name: string
          order_index: number
          organization_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_closed?: boolean | null
          name?: string
          order_index?: number
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_salesperson: string | null
          assigned_to: string | null
          attribution_status: string | null
          created_at: string
          email: string
          entered_by: string | null
          estimated_value: number | null
          first_name: string | null
          id: string
          interest_level: string | null
          last_contact_date: string | null
          last_name: string | null
          next_follow_up_date: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          referral_code: string | null
          source: string | null
          stage_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_salesperson?: string | null
          assigned_to?: string | null
          attribution_status?: string | null
          created_at?: string
          email: string
          entered_by?: string | null
          estimated_value?: number | null
          first_name?: string | null
          id?: string
          interest_level?: string | null
          last_contact_date?: string | null
          last_name?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          referral_code?: string | null
          source?: string | null
          stage_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_salesperson?: string | null
          assigned_to?: string | null
          attribution_status?: string | null
          created_at?: string
          email?: string
          entered_by?: string | null
          estimated_value?: number | null
          first_name?: string | null
          id?: string
          interest_level?: string | null
          last_contact_date?: string | null
          last_name?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          referral_code?: string | null
          source?: string | null
          stage_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_salesperson_fkey"
            columns: ["assigned_salesperson"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "lead_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          organization_id: string
          phone: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_cards: {
        Row: {
          barcode: string | null
          card_number: string
          created_at: string
          expires_at: string | null
          id: string
          issued_at: string
          member_id: string
          nfc_enabled: boolean | null
          nfc_uid: string | null
          qr_code: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          card_number: string
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          member_id: string
          nfc_enabled?: boolean | null
          nfc_uid?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          card_number?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          member_id?: string
          nfc_enabled?: boolean | null
          nfc_uid?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_cards_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_agreement_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      membership_agreements: {
        Row: {
          agreement_content: string
          created_at: string
          id: string
          member_id: string
          signature_data: string | null
          signed_at: string
          template_id: string | null
          witness_id: string | null
        }
        Insert: {
          agreement_content: string
          created_at?: string
          id?: string
          member_id: string
          signature_data?: string | null
          signed_at?: string
          template_id?: string | null
          witness_id?: string | null
        }
        Update: {
          agreement_content?: string
          created_at?: string
          id?: string
          member_id?: string
          signature_data?: string | null
          signed_at?: string
          template_id?: string | null
          witness_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_agreements_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_agreements_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "membership_agreement_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_agreements_witness_id_fkey"
            columns: ["witness_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          access_level: string | null
          annual_maintenance_fee: number | null
          billing_interval: string
          commitment_months: number | null
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          is_prepaid: boolean | null
          max_classes_per_month: number | null
          name: string
          organization_id: string
          plan_type: string | null
          prepaid_months: number | null
          price: number
          requires_commitment: boolean | null
          signup_fee: number | null
          updated_at: string
        }
        Insert: {
          access_level?: string | null
          annual_maintenance_fee?: number | null
          billing_interval: string
          commitment_months?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          is_prepaid?: boolean | null
          max_classes_per_month?: number | null
          name: string
          organization_id: string
          plan_type?: string | null
          prepaid_months?: number | null
          price: number
          requires_commitment?: boolean | null
          signup_fee?: number | null
          updated_at?: string
        }
        Update: {
          access_level?: string | null
          annual_maintenance_fee?: number | null
          billing_interval?: string
          commitment_months?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          is_prepaid?: boolean | null
          max_classes_per_month?: number | null
          name?: string
          organization_id?: string
          plan_type?: string | null
          prepaid_months?: number | null
          price?: number
          requires_commitment?: boolean | null
          signup_fee?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          member_id: string
          next_billing_date: string | null
          plan_id: string
          start_date: string
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          member_id: string
          next_billing_date?: string | null
          plan_id: string
          start_date?: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          member_id?: string
          next_billing_date?: string | null
          plan_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_commission_settings: {
        Row: {
          allow_split_commissions: boolean | null
          created_at: string
          default_commission_type: string
          default_commission_value: number
          default_duration_months: number | null
          default_revenue_basis: string
          id: string
          max_split_salespeople: number | null
          organization_id: string
          require_manager_approval_for_attribution: boolean | null
          updated_at: string
        }
        Insert: {
          allow_split_commissions?: boolean | null
          created_at?: string
          default_commission_type: string
          default_commission_value: number
          default_duration_months?: number | null
          default_revenue_basis: string
          id?: string
          max_split_salespeople?: number | null
          organization_id: string
          require_manager_approval_for_attribution?: boolean | null
          updated_at?: string
        }
        Update: {
          allow_split_commissions?: boolean | null
          created_at?: string
          default_commission_type?: string
          default_commission_value?: number
          default_duration_months?: number | null
          default_revenue_basis?: string
          id?: string
          max_split_salespeople?: number | null
          organization_id?: string
          require_manager_approval_for_attribution?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          member_id: string
          membership_id: string | null
          notes: string | null
          payment_method: string
          payment_status: string | null
          processed_by: string | null
          stripe_payment_intent_id: string | null
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          member_id: string
          membership_id?: string | null
          notes?: string | null
          payment_method: string
          payment_status?: string | null
          processed_by?: string | null
          stripe_payment_intent_id?: string | null
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          member_id?: string
          membership_id?: string | null
          notes?: string | null
          payment_method?: string
          payment_status?: string | null
          processed_by?: string | null
          stripe_payment_intent_id?: string | null
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          avatar_url: string | null
          barcode: string | null
          barcode_generated_at: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          gender: string | null
          id: string
          interests: string[] | null
          join_date: string | null
          last_name: string | null
          location_id: string | null
          member_notes: string | null
          organization_id: string
          phone: string | null
          postal_code: string | null
          role: Database["public"]["Enums"]["user_role"]
          state: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          barcode?: string | null
          barcode_generated_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          gender?: string | null
          id: string
          interests?: string[] | null
          join_date?: string | null
          last_name?: string | null
          location_id?: string | null
          member_notes?: string | null
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          barcode?: string | null
          barcode_generated_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          join_date?: string | null
          last_name?: string | null
          location_id?: string | null
          member_notes?: string | null
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          applicable_plans: string[] | null
          created_at: string
          current_uses: number | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          name: string
          organization_id: string
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          applicable_plans?: string[] | null
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          name: string
          organization_id: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          applicable_plans?: string[] | null
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          name?: string
          organization_id?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      salesperson_commissions: {
        Row: {
          commission_type: string
          commission_value: number
          created_at: string
          created_by: string | null
          duration_months: number | null
          id: string
          is_active: boolean | null
          organization_id: string
          revenue_basis: string
          salesperson_id: string
          updated_at: string
        }
        Insert: {
          commission_type: string
          commission_value: number
          created_at?: string
          created_by?: string | null
          duration_months?: number | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          revenue_basis: string
          salesperson_id: string
          updated_at?: string
        }
        Update: {
          commission_type?: string
          commission_value?: number
          created_at?: string
          created_by?: string | null
          duration_months?: number | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          revenue_basis?: string
          salesperson_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salesperson_commissions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesperson_commissions_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      salesperson_referral_links: {
        Row: {
          click_count: number | null
          conversion_count: number | null
          created_at: string
          id: string
          is_active: boolean | null
          link_url: string
          organization_id: string
          referral_code: string
          salesperson_id: string
          updated_at: string
        }
        Insert: {
          click_count?: number | null
          conversion_count?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          link_url: string
          organization_id: string
          referral_code: string
          salesperson_id: string
          updated_at?: string
        }
        Update: {
          click_count?: number | null
          conversion_count?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          link_url?: string
          organization_id?: string
          referral_code?: string
          salesperson_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salesperson_referral_links_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          membership_plan_id: string | null
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          membership_plan_id?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          membership_plan_id?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscribers_membership_plan_id_fkey"
            columns: ["membership_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_member_barcode: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_member_card_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_organization_id: {
        Args: { user_id: string }
        Returns: string
      }
      setup_default_lead_stages: {
        Args: { org_id: string }
        Returns: undefined
      }
    }
    Enums: {
      membership_status:
        | "active"
        | "inactive"
        | "frozen"
        | "cancelled"
        | "past_due"
      user_role: "owner" | "manager" | "staff" | "trainer" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      membership_status: [
        "active",
        "inactive",
        "frozen",
        "cancelled",
        "past_due",
      ],
      user_role: ["owner", "manager", "staff", "trainer", "member"],
    },
  },
} as const
