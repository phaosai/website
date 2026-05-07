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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alert_schedules: {
        Row: {
          auto_replenish: boolean
          channels: Json
          created_at: string
          custom_slots: Json
          frequency: string
          id: string
          last_dispatched_at: string | null
          phone_e164: string | null
          quantum_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_replenish?: boolean
          channels?: Json
          created_at?: string
          custom_slots?: Json
          frequency?: string
          id?: string
          last_dispatched_at?: string | null
          phone_e164?: string | null
          quantum_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_replenish?: boolean
          channels?: Json
          created_at?: string
          custom_slots?: Json
          frequency?: string
          id?: string
          last_dispatched_at?: string | null
          phone_e164?: string | null
          quantum_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json
          organization_id: string | null
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cache_warmup_tickers: {
        Row: {
          asset_class: string
          created_at: string
          enabled: boolean
          ticker: string
        }
        Insert: {
          asset_class?: string
          created_at?: string
          enabled?: boolean
          ticker: string
        }
        Update: {
          asset_class?: string
          created_at?: string
          enabled?: boolean
          ticker?: string
        }
        Relationships: []
      }
      chat_leads: {
        Row: {
          captured_at: string
          company: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          title: string | null
          transcript: string | null
          website: string | null
        }
        Insert: {
          captured_at?: string
          company?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          title?: string | null
          transcript?: string | null
          website?: string | null
        }
        Update: {
          captured_at?: string
          company?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          title?: string | null
          transcript?: string | null
          website?: string | null
        }
        Relationships: []
      }
      client_entities: {
        Row: {
          created_at: string
          created_by: string | null
          entity_type: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_type?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_type?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_portals: {
        Row: {
          access_token_hash: string | null
          client_entity_id: string | null
          client_name: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          status: Database["public"]["Enums"]["portal_status"]
        }
        Insert: {
          access_token_hash?: string | null
          client_entity_id?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          status?: Database["public"]["Enums"]["portal_status"]
        }
        Update: {
          access_token_hash?: string | null
          client_entity_id?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["portal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "client_portals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          credit_type: string
          direction: string
          id: string
          note: string | null
          source_ref: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          credit_type: string
          direction: string
          id?: string
          note?: string | null
          source_ref?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          credit_type?: string
          direction?: string
          id?: string
          note?: string | null
          source_ref?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      foundry_year_corpus: {
        Row: {
          dimension: string
          fetched_at: string
          payload: Json
          source_id: string
          source_url: string | null
          year: number
        }
        Insert: {
          dimension: string
          fetched_at?: string
          payload?: Json
          source_id: string
          source_url?: string | null
          year: number
        }
        Update: {
          dimension?: string
          fetched_at?: string
          payload?: Json
          source_id?: string
          source_url?: string | null
          year?: number
        }
        Relationships: []
      }
      investment_themes: {
        Row: {
          contributing_tickers: Json | null
          counter_thesis: string | null
          created_at: string
          historical_disclaimer: string | null
          id: string
          is_historical_example: boolean
          narrative: string | null
          organization_id: string
          signal_strength: Database["public"]["Enums"]["signal_strength"] | null
          source_categories: Json | null
          status: Database["public"]["Enums"]["theme_status"]
          theme_name: string
          updated_at: string
        }
        Insert: {
          contributing_tickers?: Json | null
          counter_thesis?: string | null
          created_at?: string
          historical_disclaimer?: string | null
          id?: string
          is_historical_example?: boolean
          narrative?: string | null
          organization_id: string
          signal_strength?:
            | Database["public"]["Enums"]["signal_strength"]
            | null
          source_categories?: Json | null
          status?: Database["public"]["Enums"]["theme_status"]
          theme_name: string
          updated_at?: string
        }
        Update: {
          contributing_tickers?: Json | null
          counter_thesis?: string | null
          created_at?: string
          historical_disclaimer?: string | null
          id?: string
          is_historical_example?: boolean
          narrative?: string | null
          organization_id?: string
          signal_strength?:
            | Database["public"]["Enums"]["signal_strength"]
            | null
          source_categories?: Json | null
          status?: Database["public"]["Enums"]["theme_status"]
          theme_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_themes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      login_events: {
        Row: {
          id: string
          ip_hash: string | null
          occurred_at: string
          product_context: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_hash?: string | null
          occurred_at?: string
          product_context?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_hash?: string | null
          occurred_at?: string
          product_context?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      logos_settings: {
        Row: {
          accent_color: string | null
          apply_to_memos: boolean
          apply_to_portals: boolean
          created_at: string
          firm_name: string | null
          id: string
          logo_url: string | null
          organization_id: string
        }
        Insert: {
          accent_color?: string | null
          apply_to_memos?: boolean
          apply_to_portals?: boolean
          created_at?: string
          firm_name?: string | null
          id?: string
          logo_url?: string | null
          organization_id: string
        }
        Update: {
          accent_color?: string | null
          apply_to_memos?: boolean
          apply_to_portals?: boolean
          created_at?: string
          firm_name?: string | null
          id?: string
          logo_url?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logos_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      one_time_purchases: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          organization_id: string | null
          output_id: string | null
          product_type: Database["public"]["Enums"]["purchase_product_type"]
          status: Database["public"]["Enums"]["purchase_status"]
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          organization_id?: string | null
          output_id?: string | null
          product_type: Database["public"]["Enums"]["purchase_product_type"]
          status?: Database["public"]["Enums"]["purchase_status"]
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          organization_id?: string | null
          output_id?: string | null
          product_type?: Database["public"]["Enums"]["purchase_product_type"]
          status?: Database["public"]["Enums"]["purchase_status"]
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_time_purchases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_time_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "one_time_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          plan_id: string | null
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          plan_id?: string | null
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          plan_id?: string | null
          stripe_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "admin_user_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          features: Json
          id: string
          monthly_price_cents: number
          name: Database["public"]["Enums"]["plan_name"]
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          monthly_price_cents: number
          name: Database["public"]["Enums"]["plan_name"]
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          monthly_price_cents?: number
          name?: Database["public"]["Enums"]["plan_name"]
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      platform_preferences: {
        Row: {
          created_at: string
          id: string
          preferred_platform: Database["public"]["Enums"]["platform_pref"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferred_platform: Database["public"]["Enums"]["platform_pref"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferred_platform?: Database["public"]["Enums"]["platform_pref"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_user_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "platform_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_reports: {
        Row: {
          created_at: string
          entitlement_source: string | null
          id: string
          quantum_audit_id: string | null
          report_payload: Json | null
          report_type: string
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entitlement_source?: string | null
          id?: string
          quantum_audit_id?: string | null
          report_payload?: Json | null
          report_type: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entitlement_source?: string | null
          id?: string
          quantum_audit_id?: string | null
          report_payload?: Json | null
          report_type?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_reports_quantum_audit_id_fkey"
            columns: ["quantum_audit_id"]
            isOneToOne: false
            referencedRelation: "quantum_audits_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      promoted_brains: {
        Row: {
          combined_score: number | null
          enabled_dimensions: Json
          engine_name: string
          id: string
          is_active: boolean
          notes: string | null
          promoted_at: string
          promoted_by: string | null
          residual_bias: Json
          version: string
        }
        Insert: {
          combined_score?: number | null
          enabled_dimensions?: Json
          engine_name: string
          id?: string
          is_active?: boolean
          notes?: string | null
          promoted_at?: string
          promoted_by?: string | null
          residual_bias?: Json
          version: string
        }
        Update: {
          combined_score?: number | null
          enabled_dimensions?: Json
          engine_name?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          promoted_at?: string
          promoted_by?: string | null
          residual_bias?: Json
          version?: string
        }
        Relationships: []
      }
      published_artifacts: {
        Row: {
          id: string
          organization_id: string
          portal_id: string | null
          published_at: string
          truth_memo_id: string | null
          user_id: string
          version: number
        }
        Insert: {
          id?: string
          organization_id: string
          portal_id?: string | null
          published_at?: string
          truth_memo_id?: string | null
          user_id: string
          version?: number
        }
        Update: {
          id?: string
          organization_id?: string
          portal_id?: string | null
          published_at?: string
          truth_memo_id?: string | null
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "published_artifacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "published_artifacts_portal_id_fkey"
            columns: ["portal_id"]
            isOneToOne: false
            referencedRelation: "client_portals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "published_artifacts_truth_memo_id_fkey"
            columns: ["truth_memo_id"]
            isOneToOne: false
            referencedRelation: "truth_memos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "published_artifacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "published_artifacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      purge_audit_log: {
        Row: {
          actions: Json
          actor_user_id: string | null
          admin_token_hash: string
          counts: Json
          created_at: string
          dry_run: boolean
          email_hash: string
          id: string
          include_suppressions: boolean
          ip_hash: string | null
          status: string
        }
        Insert: {
          actions?: Json
          actor_user_id?: string | null
          admin_token_hash: string
          counts?: Json
          created_at?: string
          dry_run: boolean
          email_hash: string
          id?: string
          include_suppressions?: boolean
          ip_hash?: string | null
          status?: string
        }
        Update: {
          actions?: Json
          actor_user_id?: string | null
          admin_token_hash?: string
          counts?: Json
          created_at?: string
          dry_run?: boolean
          email_hash?: string
          id?: string
          include_suppressions?: boolean
          ip_hash?: string | null
          status?: string
        }
        Relationships: []
      }
      quantum_audit_credits: {
        Row: {
          created_at: string
          execution_credits: number
          id: string
          report_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          execution_credits?: number
          id?: string
          report_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          execution_credits?: number
          id?: string
          report_credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quantum_audits: {
        Row: {
          completed_at: string | null
          compliance_note: string
          created_at: string
          error_message: string | null
          ibm_backend: string | null
          ibm_workload_id: string | null
          id: string
          idempotency_key: string | null
          plan_name: string
          raw_result_metadata: Json | null
          result_summary: string | null
          selected_asset_type: string | null
          selected_platforms: Json
          selected_symbol: string | null
          simulation_input_snapshot: Json
          status: string
          updated_at: string
          usage_month: string
          used_addon: boolean
          user_id: string
          validation_mode: string
        }
        Insert: {
          completed_at?: string | null
          compliance_note?: string
          created_at?: string
          error_message?: string | null
          ibm_backend?: string | null
          ibm_workload_id?: string | null
          id?: string
          idempotency_key?: string | null
          plan_name: string
          raw_result_metadata?: Json | null
          result_summary?: string | null
          selected_asset_type?: string | null
          selected_platforms?: Json
          selected_symbol?: string | null
          simulation_input_snapshot?: Json
          status?: string
          updated_at?: string
          usage_month?: string
          used_addon?: boolean
          user_id: string
          validation_mode?: string
        }
        Update: {
          completed_at?: string | null
          compliance_note?: string
          created_at?: string
          error_message?: string | null
          ibm_backend?: string | null
          ibm_workload_id?: string | null
          id?: string
          idempotency_key?: string | null
          plan_name?: string
          raw_result_metadata?: Json | null
          result_summary?: string | null
          selected_asset_type?: string | null
          selected_platforms?: Json
          selected_symbol?: string | null
          simulation_input_snapshot?: Json
          status?: string
          updated_at?: string
          usage_month?: string
          used_addon?: boolean
          user_id?: string
          validation_mode?: string
        }
        Relationships: []
      }
      quantum_audits_v2: {
        Row: {
          completed_at: string | null
          compliance_note: string
          created_at: string
          entitlement_source: string | null
          ibm_backend: string | null
          ibm_workload_id: string | null
          id: string
          idempotency_key: string | null
          raw_result_metadata: Json | null
          result_summary: string | null
          selected_asset_type: string | null
          selected_platforms: Json
          selected_symbol: string | null
          simulation_input_snapshot: Json
          started_at: string | null
          status: string
          updated_at: string
          usage_period_id: string | null
          user_id: string
          validation_mode: string
        }
        Insert: {
          completed_at?: string | null
          compliance_note?: string
          created_at?: string
          entitlement_source?: string | null
          ibm_backend?: string | null
          ibm_workload_id?: string | null
          id?: string
          idempotency_key?: string | null
          raw_result_metadata?: Json | null
          result_summary?: string | null
          selected_asset_type?: string | null
          selected_platforms?: Json
          selected_symbol?: string | null
          simulation_input_snapshot?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
          usage_period_id?: string | null
          user_id: string
          validation_mode?: string
        }
        Update: {
          completed_at?: string | null
          compliance_note?: string
          created_at?: string
          entitlement_source?: string | null
          ibm_backend?: string | null
          ibm_workload_id?: string | null
          id?: string
          idempotency_key?: string | null
          raw_result_metadata?: Json | null
          result_summary?: string | null
          selected_asset_type?: string | null
          selected_platforms?: Json
          selected_symbol?: string | null
          simulation_input_snapshot?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
          usage_period_id?: string | null
          user_id?: string
          validation_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "quantum_audits_v2_usage_period_id_fkey"
            columns: ["usage_period_id"]
            isOneToOne: false
            referencedRelation: "user_usage_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      research_items: {
        Row: {
          client_entity_id: string | null
          company_name: string | null
          created_at: string
          id: string
          market_cap_tier: string | null
          organization_id: string
          pci_components: Json | null
          pci_score: number | null
          pci_threshold: Database["public"]["Enums"]["pci_threshold"] | null
          sector: string | null
          signal_categories_active: Json | null
          sources: Json | null
          ticker: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_entity_id?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          market_cap_tier?: string | null
          organization_id: string
          pci_components?: Json | null
          pci_score?: number | null
          pci_threshold?: Database["public"]["Enums"]["pci_threshold"] | null
          sector?: string | null
          signal_categories_active?: Json | null
          sources?: Json | null
          ticker: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_entity_id?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          market_cap_tier?: string | null
          organization_id?: string
          pci_components?: Json | null
          pci_score?: number | null
          pci_threshold?: Database["public"]["Enums"]["pci_threshold"] | null
          sector?: string | null
          signal_categories_active?: Json | null
          sources?: Json | null
          ticker?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "research_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_hash: string | null
          metadata: Json
          severity: string
          source: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
          severity?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
          severity?: string
          source?: string | null
        }
        Relationships: []
      }
      signal_cache: {
        Row: {
          expires_at: string | null
          fetched_at: string
          id: string
          processed_data: Json | null
          raw_data: Json | null
          source_type: string
          ticker: string
        }
        Insert: {
          expires_at?: string | null
          fetched_at?: string
          id?: string
          processed_data?: Json | null
          raw_data?: Json | null
          source_type: string
          ticker: string
        }
        Update: {
          expires_at?: string | null
          fetched_at?: string
          id?: string
          processed_data?: Json | null
          raw_data?: Json | null
          source_type?: string
          ticker?: string
        }
        Relationships: []
      }
      signal_findings: {
        Row: {
          category: string
          confidence: string
          created_at: string
          direction: string
          evidence: string | null
          headline: string
          id: string
          organization_id: string | null
          rank: number | null
          run_id: string | null
          source: Json | null
          ticker: string
          weight: number
        }
        Insert: {
          category: string
          confidence: string
          created_at?: string
          direction: string
          evidence?: string | null
          headline: string
          id?: string
          organization_id?: string | null
          rank?: number | null
          run_id?: string | null
          source?: Json | null
          ticker: string
          weight?: number
        }
        Update: {
          category?: string
          confidence?: string
          created_at?: string
          direction?: string
          evidence?: string | null
          headline?: string
          id?: string
          organization_id?: string | null
          rank?: number | null
          run_id?: string | null
          source?: Json | null
          ticker?: string
          weight?: number
        }
        Relationships: []
      }
      simulation_runs: {
        Row: {
          assumptions: Json | null
          created_at: string
          id: string
          is_public_sandbox: boolean
          organization_id: string | null
          outputs: Json | null
          pci_before: number | null
          pci_simulated: number | null
          platform_preference:
            | Database["public"]["Enums"]["platform_pref"]
            | null
          scenario_type: Database["public"]["Enums"]["scenario_type"]
          theme_id: string | null
          ticker: string | null
          user_id: string | null
        }
        Insert: {
          assumptions?: Json | null
          created_at?: string
          id?: string
          is_public_sandbox?: boolean
          organization_id?: string | null
          outputs?: Json | null
          pci_before?: number | null
          pci_simulated?: number | null
          platform_preference?:
            | Database["public"]["Enums"]["platform_pref"]
            | null
          scenario_type: Database["public"]["Enums"]["scenario_type"]
          theme_id?: string | null
          ticker?: string | null
          user_id?: string | null
        }
        Update: {
          assumptions?: Json | null
          created_at?: string
          id?: string
          is_public_sandbox?: boolean
          organization_id?: string | null
          outputs?: Json | null
          pci_before?: number | null
          pci_simulated?: number | null
          platform_preference?:
            | Database["public"]["Enums"]["platform_pref"]
            | null
          scenario_type?: Database["public"]["Enums"]["scenario_type"]
          theme_id?: string | null
          ticker?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulation_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_runs_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "investment_themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "simulation_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          monthly_quantum_audit_limit: number
          monthly_report_credit_limit: number
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          monthly_quantum_audit_limit?: number
          monthly_report_credit_limit?: number
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          monthly_quantum_audit_limit?: number
          monthly_report_credit_limit?: number
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          organization_id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id: string | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          organization_id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          organization_id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      sunesis_watchlist: {
        Row: {
          added_at: string
          asset_class: string
          created_at: string
          id: string
          last_pci: number | null
          last_price: number | null
          last_refreshed_at: string | null
          name: string
          pci_at_add: number
          price_at_add: number
          ticker: string
          updated_at: string
          user_id: string
        }
        Insert: {
          added_at?: string
          asset_class: string
          created_at?: string
          id?: string
          last_pci?: number | null
          last_price?: number | null
          last_refreshed_at?: string | null
          name: string
          pci_at_add: number
          price_at_add: number
          ticker: string
          updated_at?: string
          user_id: string
        }
        Update: {
          added_at?: string
          asset_class?: string
          created_at?: string
          id?: string
          last_pci?: number | null
          last_price?: number | null
          last_refreshed_at?: string | null
          name?: string
          pci_at_add?: number
          price_at_add?: number
          ticker?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_state: {
        Row: {
          chat_enabled: boolean
          id: number
          lead_capture_enabled: boolean
          purge_audit_retention_years: number
          research_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          chat_enabled?: boolean
          id?: number
          lead_capture_enabled?: boolean
          purge_audit_retention_years?: number
          research_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          chat_enabled?: boolean
          id?: number
          lead_capture_enabled?: boolean
          purge_audit_retention_years?: number
          research_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ticker_snapshots: {
        Row: {
          captured_at: string
          id: string
          organization_id: string
          pci_score: number | null
          signal_categories_active: Json | null
          sources_count: number | null
          ticker: string
        }
        Insert: {
          captured_at?: string
          id?: string
          organization_id: string
          pci_score?: number | null
          signal_categories_active?: Json | null
          sources_count?: number | null
          ticker: string
        }
        Update: {
          captured_at?: string
          id?: string
          organization_id?: string
          pci_score?: number | null
          signal_categories_active?: Json | null
          sources_count?: number | null
          ticker?: string
        }
        Relationships: []
      }
      trading_platforms: {
        Row: {
          asset_classes: Json
          created_at: string
          name: string
          region: string | null
          retail_access: boolean
          slug: string
        }
        Insert: {
          asset_classes?: Json
          created_at?: string
          name: string
          region?: string | null
          retail_access?: boolean
          slug: string
        }
        Update: {
          asset_classes?: Json
          created_at?: string
          name?: string
          region?: string | null
          retail_access?: boolean
          slug?: string
        }
        Relationships: []
      }
      truth_ledger_lines: {
        Row: {
          created_at: string
          id: string
          line: string
          organization_id: string | null
          run_id: string
          source_family: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          line: string
          organization_id?: string | null
          run_id: string
          source_family?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          line?: string
          organization_id?: string | null
          run_id?: string
          source_family?: string | null
          status?: string
        }
        Relationships: []
      }
      truth_memos: {
        Row: {
          bear_case: string | null
          bull_case: string | null
          content: string | null
          created_at: string
          id: string
          is_one_time_purchase: boolean
          methodology_notes: string | null
          organization_id: string
          purchase_type:
            | Database["public"]["Enums"]["purchase_product_type"]
            | null
          research_item_id: string | null
          sources: Json | null
          status: Database["public"]["Enums"]["memo_status"]
          user_id: string
        }
        Insert: {
          bear_case?: string | null
          bull_case?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_one_time_purchase?: boolean
          methodology_notes?: string | null
          organization_id: string
          purchase_type?:
            | Database["public"]["Enums"]["purchase_product_type"]
            | null
          research_item_id?: string | null
          sources?: Json | null
          status?: Database["public"]["Enums"]["memo_status"]
          user_id: string
        }
        Update: {
          bear_case?: string | null
          bull_case?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_one_time_purchase?: boolean
          methodology_notes?: string | null
          organization_id?: string
          purchase_type?:
            | Database["public"]["Enums"]["purchase_product_type"]
            | null
          research_item_id?: string | null
          sources?: Json | null
          status?: Database["public"]["Enums"]["memo_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "truth_memos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "truth_memos_research_item_id_fkey"
            columns: ["research_item_id"]
            isOneToOne: false
            referencedRelation: "research_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "truth_memos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "truth_memos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_counters: {
        Row: {
          action: string
          count: number
          day: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          count?: number
          day?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          count?: number
          day?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json
          usage_period_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json
          usage_period_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          usage_period_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_usage_period_id_fkey"
            columns: ["usage_period_id"]
            isOneToOne: false
            referencedRelation: "user_usage_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credit_balances: {
        Row: {
          audit_execution_credits_balance: number
          created_at: string
          id: string
          report_generation_credits_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          audit_execution_credits_balance?: number
          created_at?: string
          id?: string
          report_generation_credits_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          audit_execution_credits_balance?: number
          created_at?: string
          id?: string
          report_generation_credits_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string | null
          stripe_session_id: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          last_payment_status: string | null
          past_due_since: string | null
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          last_payment_status?: string | null
          past_due_since?: string | null
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          last_payment_status?: string | null
          past_due_since?: string | null
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions_v2: {
        Row: {
          billing_cycle_anchor: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle_anchor?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle_anchor?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_v2_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_usage_periods: {
        Row: {
          add_on_audit_credits_used: number
          add_on_report_credits_used: number
          created_at: string
          id: string
          included_audit_limit: number
          included_audits_used: number
          included_report_limit: number
          included_reports_used: number
          period_end: string
          period_key: string
          period_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          add_on_audit_credits_used?: number
          add_on_report_credits_used?: number
          created_at?: string
          id?: string
          included_audit_limit?: number
          included_audits_used?: number
          included_report_limit?: number
          included_reports_used?: number
          period_end: string
          period_key: string
          period_start: string
          updated_at?: string
          user_id: string
        }
        Update: {
          add_on_audit_credits_used?: number
          add_on_report_credits_used?: number
          created_at?: string
          id?: string
          included_audit_limit?: number
          included_audits_used?: number
          included_report_limit?: number
          included_reports_used?: number
          period_end?: string
          period_key?: string
          period_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_sandbox: boolean
          tier: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_sandbox?: boolean
          tier?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_sandbox?: boolean
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      watchlist_items: {
        Row: {
          added_at: string
          company_name: string | null
          id: string
          ticker: string
          watchlist_id: string
        }
        Insert: {
          added_at?: string
          company_name?: string | null
          id?: string
          ticker: string
          watchlist_id: string
        }
        Update: {
          added_at?: string
          company_name?: string | null
          id?: string
          ticker?: string
          watchlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_items_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlists: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "watchlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          environment: string
          id: string
          payload: Json | null
          processed_at: string
          type: string
        }
        Insert: {
          environment: string
          id: string
          payload?: Json | null
          processed_at?: string
          type: string
        }
        Update: {
          environment?: string
          id?: string
          payload?: Json | null
          processed_at?: string
          type?: string
        }
        Relationships: []
      }
      workflow_events: {
        Row: {
          action: string
          created_at: string
          from_status: string | null
          id: string
          metadata: Json
          organization_id: string
          to_status: string | null
          user_id: string | null
          workflow_item_id: string
        }
        Insert: {
          action: string
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          to_status?: string | null
          user_id?: string | null
          workflow_item_id: string
        }
        Update: {
          action?: string
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          to_status?: string | null
          user_id?: string | null
          workflow_item_id?: string
        }
        Relationships: []
      }
      workflow_items: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          compliance_checklist: Json
          created_at: string
          id: string
          organization_id: string
          research_item_id: string | null
          status: Database["public"]["Enums"]["workflow_status"]
          title: string
          truth_memo_id: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          compliance_checklist?: Json
          created_at?: string
          id?: string
          organization_id: string
          research_item_id?: string | null
          status?: Database["public"]["Enums"]["workflow_status"]
          title: string
          truth_memo_id?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          compliance_checklist?: Json
          created_at?: string
          id?: string
          organization_id?: string
          research_item_id?: string | null
          status?: Database["public"]["Enums"]["workflow_status"]
          title?: string
          truth_memo_id?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_user_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "workflow_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_items_research_item_id_fkey"
            columns: ["research_item_id"]
            isOneToOne: false
            referencedRelation: "research_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_items_truth_memo_id_fkey"
            columns: ["truth_memo_id"]
            isOneToOne: false
            referencedRelation: "truth_memos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "workflow_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_notes: {
        Row: {
          body: string
          created_at: string
          id: string
          organization_id: string
          user_id: string
          workflow_item_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          organization_id: string
          user_id: string
          workflow_item_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          organization_id?: string
          user_id?: string
          workflow_item_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_user_metrics: {
        Row: {
          audit_event_count: number | null
          created_at: string | null
          email: string | null
          full_name: string | null
          is_admin: boolean | null
          last_login_at: string | null
          login_count: number | null
          memo_count: number | null
          research_count: number | null
          simulation_count: number | null
          tier: string | null
          user_id: string | null
          watchlist_count: number | null
          workflow_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _ensure_credit_balance: {
        Args: { _user_id: string }
        Returns: {
          audit_execution_credits_balance: number
          created_at: string
          id: string
          report_generation_credits_balance: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_credit_balances"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      consume_quantum_audit_credit: {
        Args: { _audit_id: string; _user_id: string }
        Returns: Json
      }
      consume_report_credit: {
        Args: { _report_id: string; _user_id: string }
        Returns: Json
      }
      create_quantum_audit_record: {
        Args: {
          _selected_asset_type: string
          _selected_platforms: Json
          _selected_symbol: string
          _simulation_input_snapshot: Json
          _user_id: string
          _validation_mode?: string
        }
        Returns: {
          completed_at: string | null
          compliance_note: string
          created_at: string
          entitlement_source: string | null
          ibm_backend: string | null
          ibm_workload_id: string | null
          id: string
          idempotency_key: string | null
          raw_result_metadata: Json | null
          result_summary: string | null
          selected_asset_type: string | null
          selected_platforms: Json
          selected_symbol: string | null
          simulation_input_snapshot: Json
          started_at: string | null
          status: string
          updated_at: string
          usage_period_id: string | null
          user_id: string
          validation_mode: string
        }
        SetofOptions: {
          from: "*"
          to: "quantum_audits_v2"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_account_summary: { Args: { _user_id?: string }; Returns: Json }
      get_or_create_usage_period: {
        Args: { _ref_date?: string; _user_id: string }
        Returns: {
          add_on_audit_credits_used: number
          add_on_report_credits_used: number
          created_at: string
          id: string
          included_audit_limit: number
          included_audits_used: number
          included_report_limit: number
          included_reports_used: number
          period_end: string
          period_key: string
          period_start: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_usage_periods"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_active_plan: {
        Args: { _user_id: string }
        Returns: {
          code: string
          monthly_quantum_audit_limit: number
          monthly_report_credit_limit: number
          name: string
          plan_id: string
          status: string
        }[]
      }
      get_user_quantum_audit_entitlement: {
        Args: { _user_id: string }
        Returns: Json
      }
      get_user_report_entitlement: { Args: { _user_id: string }; Returns: Json }
      grant_add_on_credits: {
        Args: {
          _amount: number
          _credit_type: string
          _note?: string
          _source_ref?: string
          _source_type?: string
          _user_id: string
        }
        Returns: Json
      }
      has_active_user_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_org_role: {
        Args: {
          _org_id: string
          _roles: Database["public"]["Enums"]["org_role"][]
        }
        Returns: boolean
      }
      has_pantheon_plan: { Args: { _org_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_usage: {
        Args: { _action: string; _limit: number; _user_id: string }
        Returns: {
          allowed: boolean
          current_count: number
          day: string
        }[]
      }
      is_org_member: { Args: { _org_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      refund_quantum_audit_credit: {
        Args: { _audit_id: string; _user_id: string }
        Returns: Json
      }
      update_quantum_audit_status: {
        Args: { _audit_id: string; _metadata?: Json; _new_status: string }
        Returns: {
          completed_at: string | null
          compliance_note: string
          created_at: string
          entitlement_source: string | null
          ibm_backend: string | null
          ibm_workload_id: string | null
          id: string
          idempotency_key: string | null
          raw_result_metadata: Json | null
          result_summary: string | null
          selected_asset_type: string | null
          selected_platforms: Json
          selected_symbol: string | null
          simulation_input_snapshot: Json
          started_at: string | null
          status: string
          updated_at: string
          usage_period_id: string | null
          user_id: string
          validation_mode: string
        }
        SetofOptions: {
          from: "*"
          to: "quantum_audits_v2"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin"
      memo_status: "draft" | "review" | "approved" | "published"
      org_role: "owner" | "admin" | "reviewer" | "client_viewer" | "analyst"
      pci_threshold: "no_signal" | "conservative" | "high_conviction"
      plan_name:
        | "free"
        | "sunesis"
        | "aion"
        | "kyrios"
        | "phaos_one"
        | "pantheon"
      platform_pref:
        | "robinhood"
        | "fidelity"
        | "schwab"
        | "etrade"
        | "thinkorswim"
        | "interactive_brokers"
        | "other"
      portal_status: "active" | "inactive"
      purchase_product_type:
        | "truth_memo"
        | "conviction_pack"
        | "second_opinion"
        | "earnings_simulation"
      purchase_status: "pending" | "completed" | "refunded"
      scenario_type:
        | "pre_earnings"
        | "regime_change"
        | "revenue_miss"
        | "supply_chain"
        | "macro_stress"
        | "insider_reversal"
        | "custom"
      signal_strength: "low" | "medium" | "high"
      subscription_status: "active" | "past_due" | "cancelled" | "trialing"
      theme_status: "live" | "monitoring" | "archived"
      workflow_status:
        | "draft"
        | "under_review"
        | "approved"
        | "rejected"
        | "completed"
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
      app_role: ["admin"],
      memo_status: ["draft", "review", "approved", "published"],
      org_role: ["owner", "admin", "reviewer", "client_viewer", "analyst"],
      pci_threshold: ["no_signal", "conservative", "high_conviction"],
      plan_name: ["free", "sunesis", "aion", "kyrios", "phaos_one", "pantheon"],
      platform_pref: [
        "robinhood",
        "fidelity",
        "schwab",
        "etrade",
        "thinkorswim",
        "interactive_brokers",
        "other",
      ],
      portal_status: ["active", "inactive"],
      purchase_product_type: [
        "truth_memo",
        "conviction_pack",
        "second_opinion",
        "earnings_simulation",
      ],
      purchase_status: ["pending", "completed", "refunded"],
      scenario_type: [
        "pre_earnings",
        "regime_change",
        "revenue_miss",
        "supply_chain",
        "macro_stress",
        "insider_reversal",
        "custom",
      ],
      signal_strength: ["low", "medium", "high"],
      subscription_status: ["active", "past_due", "cancelled", "trialing"],
      theme_status: ["live", "monitoring", "archived"],
      workflow_status: [
        "draft",
        "under_review",
        "approved",
        "rejected",
        "completed",
      ],
    },
  },
} as const
