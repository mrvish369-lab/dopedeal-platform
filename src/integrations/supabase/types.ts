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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      affiliate_links: {
        Row: {
          block_id: string | null
          commission_value: number | null
          created_at: string
          estimated_earnings: number | null
          id: string
          platform_name: string
          status: string
          total_clicks: number | null
          total_installs: number | null
          tracking_url: string
          updated_at: string
        }
        Insert: {
          block_id?: string | null
          commission_value?: number | null
          created_at?: string
          estimated_earnings?: number | null
          id?: string
          platform_name: string
          status?: string
          total_clicks?: number | null
          total_installs?: number | null
          tracking_url: string
          updated_at?: string
        }
        Update: {
          block_id?: string | null
          commission_value?: number | null
          created_at?: string
          estimated_earnings?: number | null
          id?: string
          platform_name?: string
          status?: string
          total_clicks?: number | null
          total_installs?: number | null
          tracking_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "offer_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      brand_campaigns: {
        Row: {
          brand_id: string | null
          click_cap: number | null
          created_at: string
          end_date: string | null
          id: string
          impression_cap: number | null
          name: string
          start_date: string
          status: string
          target_categories: string[] | null
          target_cities: string[] | null
          total_clicks: number | null
          total_impressions: number | null
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          click_cap?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          impression_cap?: number | null
          name: string
          start_date: string
          status?: string
          target_categories?: string[] | null
          target_cities?: string[] | null
          total_clicks?: number | null
          total_impressions?: number | null
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          click_cap?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          impression_cap?: number | null
          name?: string
          start_date?: string
          status?: string
          target_categories?: string[] | null
          target_cities?: string[] | null
          total_clicks?: number | null
          total_impressions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_blocks: {
        Row: {
          block_id: string | null
          campaign_id: string | null
          created_at: string
          id: string
        }
        Insert: {
          block_id?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: string
        }
        Update: {
          block_id?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_blocks_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "offer_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_blocks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "brand_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: number
          updated_at: string
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: number
          updated_at?: string
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      consents: {
        Row: {
          consent_text: string | null
          consent_type: string
          created_at: string
          granted: boolean
          id: string
          ip_hash: string | null
          session_id: string | null
        }
        Insert: {
          consent_text?: string | null
          consent_type: string
          created_at?: string
          granted?: boolean
          id?: string
          ip_hash?: string | null
          session_id?: string | null
        }
        Update: {
          consent_text?: string | null
          consent_type?: string
          created_at?: string
          granted?: boolean
          id?: string
          ip_hash?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_codes: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_claimed: boolean
          super_deal_id: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_claimed?: boolean
          super_deal_id: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_claimed?: boolean
          super_deal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_codes_super_deal_id_fkey"
            columns: ["super_deal_id"]
            isOneToOne: false
            referencedRelation: "super_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checkins: {
        Row: {
          checkin_date: string
          coins_earned: number
          created_at: string
          id: string
          streak_day: number
          user_id: string
        }
        Insert: {
          checkin_date?: string
          coins_earned: number
          created_at?: string
          id?: string
          streak_day?: number
          user_id: string
        }
        Update: {
          checkin_date?: string
          coins_earned?: number
          created_at?: string
          id?: string
          streak_day?: number
          user_id?: string
        }
        Relationships: []
      }
      data_retention_settings: {
        Row: {
          auto_delete: boolean | null
          data_type: string
          id: string
          last_cleanup_at: string | null
          retention_months: number
          updated_at: string
        }
        Insert: {
          auto_delete?: boolean | null
          data_type: string
          id?: string
          last_cleanup_at?: string | null
          retention_months?: number
          updated_at?: string
        }
        Update: {
          auto_delete?: boolean | null
          data_type?: string
          id?: string
          last_cleanup_at?: string | null
          retention_months?: number
          updated_at?: string
        }
        Relationships: []
      }
      deal_banners: {
        Row: {
          badge_text: string | null
          created_at: string
          display_order: number | null
          gradient_from: string | null
          gradient_to: string | null
          gradient_via: string | null
          icon_name: string | null
          id: string
          image_url: string | null
          landing_coupon_code: string | null
          landing_cta_text: string | null
          landing_cta_url: string | null
          landing_description: string | null
          landing_discount_text: string | null
          landing_enabled: boolean | null
          landing_features: string[] | null
          landing_image_url: string | null
          landing_long_description: string | null
          redirect_url: string | null
          status: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          badge_text?: string | null
          created_at?: string
          display_order?: number | null
          gradient_from?: string | null
          gradient_to?: string | null
          gradient_via?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          landing_coupon_code?: string | null
          landing_cta_text?: string | null
          landing_cta_url?: string | null
          landing_description?: string | null
          landing_discount_text?: string | null
          landing_enabled?: boolean | null
          landing_features?: string[] | null
          landing_image_url?: string | null
          landing_long_description?: string | null
          redirect_url?: string | null
          status?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          badge_text?: string | null
          created_at?: string
          display_order?: number | null
          gradient_from?: string | null
          gradient_to?: string | null
          gradient_via?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          landing_coupon_code?: string | null
          landing_cta_text?: string | null
          landing_cta_url?: string | null
          landing_description?: string | null
          landing_discount_text?: string | null
          landing_enabled?: boolean | null
          landing_features?: string[] | null
          landing_image_url?: string | null
          landing_long_description?: string | null
          redirect_url?: string | null
          status?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          session_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_alerts: {
        Row: {
          alert_type: string
          created_at: string
          details: Json | null
          id: string
          resolved: boolean | null
          session_id: string | null
          severity: string
          shop_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          details?: Json | null
          id?: string
          resolved?: boolean | null
          session_id?: string | null
          severity?: string
          shop_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          resolved?: boolean | null
          session_id?: string | null
          severity?: string
          shop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_alerts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_alerts_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          campaign_id: string | null
          city: string | null
          created_at: string
          device_type: string | null
          id: string
          notes: string | null
          product_id: string | null
          redeemed: boolean | null
          redeemed_at: string | null
          result_type: string | null
          session_id: string | null
          shop_id: string | null
          state: string | null
          status: string
          tags: string[] | null
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          campaign_id?: string | null
          city?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          redeemed?: boolean | null
          redeemed_at?: string | null
          result_type?: string | null
          session_id?: string | null
          shop_id?: string | null
          state?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          whatsapp_number: string
        }
        Update: {
          campaign_id?: string | null
          city?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          redeemed?: boolean | null
          redeemed_at?: string | null
          result_type?: string | null
          session_id?: string | null
          shop_id?: string | null
          state?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "quiz_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_published: boolean | null
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      offer_blocks: {
        Row: {
          block_type: string
          content_json: Json
          created_at: string
          id: string
          position: number
          status: string
          subtitle: string | null
          target_categories: string[] | null
          target_cities: string[] | null
          target_shop_ids: string[] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          block_type: string
          content_json?: Json
          created_at?: string
          id?: string
          position?: number
          status?: string
          subtitle?: string | null
          target_categories?: string[] | null
          target_cities?: string[] | null
          target_shop_ids?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          block_type?: string
          content_json?: Json
          created_at?: string
          id?: string
          position?: number
          status?: string
          subtitle?: string | null
          target_categories?: string[] | null
          target_cities?: string[] | null
          target_shop_ids?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      offer_cards: {
        Row: {
          animation: string | null
          background_color: string | null
          card_segment: string | null
          card_type: string
          category: string | null
          click_count: number | null
          created_at: string
          cta_text: string
          description: string | null
          discount_percent: string | null
          discounted_price: string | null
          display_order: number
          end_date: string | null
          features: string[] | null
          glow_enabled: boolean | null
          id: string
          image_fit: string | null
          image_url: string | null
          impression_count: number | null
          logo_url: string | null
          open_new_tab: boolean | null
          original_price: string | null
          rating: string | null
          redirect_url: string
          reviews_count: string | null
          start_date: string | null
          status: string
          subtitle: string | null
          target_batch_ids: string[] | null
          target_cities: string[] | null
          target_shop_ids: string[] | null
          template_key: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          animation?: string | null
          background_color?: string | null
          card_segment?: string | null
          card_type?: string
          category?: string | null
          click_count?: number | null
          created_at?: string
          cta_text?: string
          description?: string | null
          discount_percent?: string | null
          discounted_price?: string | null
          display_order?: number
          end_date?: string | null
          features?: string[] | null
          glow_enabled?: boolean | null
          id?: string
          image_fit?: string | null
          image_url?: string | null
          impression_count?: number | null
          logo_url?: string | null
          open_new_tab?: boolean | null
          original_price?: string | null
          rating?: string | null
          redirect_url: string
          reviews_count?: string | null
          start_date?: string | null
          status?: string
          subtitle?: string | null
          target_batch_ids?: string[] | null
          target_cities?: string[] | null
          target_shop_ids?: string[] | null
          template_key?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          animation?: string | null
          background_color?: string | null
          card_segment?: string | null
          card_type?: string
          category?: string | null
          click_count?: number | null
          created_at?: string
          cta_text?: string
          description?: string | null
          discount_percent?: string | null
          discounted_price?: string | null
          display_order?: number
          end_date?: string | null
          features?: string[] | null
          glow_enabled?: boolean | null
          id?: string
          image_fit?: string | null
          image_url?: string | null
          impression_count?: number | null
          logo_url?: string | null
          open_new_tab?: boolean | null
          original_price?: string | null
          rating?: string | null
          redirect_url?: string
          reviews_count?: string | null
          start_date?: string | null
          status?: string
          subtitle?: string | null
          target_batch_ids?: string[] | null
          target_cities?: string[] | null
          target_shop_ids?: string[] | null
          template_key?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      offer_events: {
        Row: {
          approx_location: string | null
          block_id: string | null
          card_id: string | null
          created_at: string
          device_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          session_id: string | null
          shop_id: string | null
        }
        Insert: {
          approx_location?: string | null
          block_id?: string | null
          card_id?: string | null
          created_at?: string
          device_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          shop_id?: string | null
        }
        Update: {
          approx_location?: string | null
          block_id?: string | null
          card_id?: string | null
          created_at?: string
          device_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          shop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_events_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "offer_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_events_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "offer_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_events_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          image_url: string | null
          name: string
          offer_price: number
          original_price: number
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          name: string
          offer_price?: number
          original_price?: number
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          image_url?: string | null
          name?: string
          offer_price?: number
          original_price?: number
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          batch_id: string | null
          created_at: string
          id: string
          qr_type: string
          qr_url: string
          shop_id: string
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          id?: string
          qr_type?: string
          qr_url: string
          shop_id: string
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          id?: string
          qr_type?: string
          qr_url?: string
          shop_id?: string
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "shop_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_campaigns: {
        Row: {
          bottom_banner_cta_text: string | null
          bottom_banner_enabled: boolean | null
          bottom_banner_image_url: string | null
          bottom_banner_redirect_url: string | null
          bottom_banner_subtitle: string | null
          bottom_banner_title: string | null
          created_at: string
          failure_message: string | null
          failure_title: string | null
          goodie_emoji: string | null
          goodie_image_url: string | null
          goodie_original_price: string | null
          goodie_price: string | null
          goodie_subtitle: string | null
          goodie_title: string
          hero_banner_enabled: boolean | null
          hero_banner_gradient_from: string | null
          hero_banner_gradient_to: string | null
          hero_banner_image_url: string | null
          hero_banner_subtitle: string | null
          hero_banner_title: string | null
          id: string
          name: string
          product_id: string | null
          questions_count: number | null
          quiz_categories: string[] | null
          redemption_steps: Json | null
          slug: string
          status: string
          success_message: string | null
          success_probability: number | null
          success_title: string | null
          target_cities: string[] | null
          target_shop_ids: string[] | null
          template_type: string
          updated_at: string
          validity_hours: number | null
        }
        Insert: {
          bottom_banner_cta_text?: string | null
          bottom_banner_enabled?: boolean | null
          bottom_banner_image_url?: string | null
          bottom_banner_redirect_url?: string | null
          bottom_banner_subtitle?: string | null
          bottom_banner_title?: string | null
          created_at?: string
          failure_message?: string | null
          failure_title?: string | null
          goodie_emoji?: string | null
          goodie_image_url?: string | null
          goodie_original_price?: string | null
          goodie_price?: string | null
          goodie_subtitle?: string | null
          goodie_title: string
          hero_banner_enabled?: boolean | null
          hero_banner_gradient_from?: string | null
          hero_banner_gradient_to?: string | null
          hero_banner_image_url?: string | null
          hero_banner_subtitle?: string | null
          hero_banner_title?: string | null
          id?: string
          name: string
          product_id?: string | null
          questions_count?: number | null
          quiz_categories?: string[] | null
          redemption_steps?: Json | null
          slug: string
          status?: string
          success_message?: string | null
          success_probability?: number | null
          success_title?: string | null
          target_cities?: string[] | null
          target_shop_ids?: string[] | null
          template_type?: string
          updated_at?: string
          validity_hours?: number | null
        }
        Update: {
          bottom_banner_cta_text?: string | null
          bottom_banner_enabled?: boolean | null
          bottom_banner_image_url?: string | null
          bottom_banner_redirect_url?: string | null
          bottom_banner_subtitle?: string | null
          bottom_banner_title?: string | null
          created_at?: string
          failure_message?: string | null
          failure_title?: string | null
          goodie_emoji?: string | null
          goodie_image_url?: string | null
          goodie_original_price?: string | null
          goodie_price?: string | null
          goodie_subtitle?: string | null
          goodie_title?: string
          hero_banner_enabled?: boolean | null
          hero_banner_gradient_from?: string | null
          hero_banner_gradient_to?: string | null
          hero_banner_image_url?: string | null
          hero_banner_subtitle?: string | null
          hero_banner_title?: string | null
          id?: string
          name?: string
          product_id?: string | null
          questions_count?: number | null
          quiz_categories?: string[] | null
          redemption_steps?: Json | null
          slug?: string
          status?: string
          success_message?: string | null
          success_probability?: number | null
          success_title?: string | null
          target_cities?: string[] | null
          target_shop_ids?: string[] | null
          template_type?: string
          updated_at?: string
          validity_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_campaigns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_logs: {
        Row: {
          answered_at: string
          id: string
          quiz_id: string
          selected_option: number
          session_id: string
        }
        Insert: {
          answered_at?: string
          id?: string
          quiz_id: string
          selected_option: number
          session_id: string
        }
        Update: {
          answered_at?: string
          id?: string
          quiz_id?: string
          selected_option?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_logs_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_settings: {
        Row: {
          category: string
          created_at: string
          fail_probability: number
          id: string
          is_active: boolean
          success_probability: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          fail_probability?: number
          id?: string
          is_active?: boolean
          success_probability?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          fail_probability?: number
          id?: string
          is_active?: boolean
          success_probability?: number
          updated_at?: string
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          category: string
          correct_option: number | null
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          options: Json
          question: string
          updated_at: string
        }
        Insert: {
          category: string
          correct_option?: number | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          options?: Json
          question: string
          updated_at?: string
        }
        Update: {
          category?: string
          correct_option?: number | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          options?: Json
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      recommendation_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          city: string
          created_at: string
          id: string
          manager_email: string | null
          name: string
          state: string
          status: string
          updated_at: string
          zone: string | null
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          manager_email?: string | null
          name: string
          state: string
          status?: string
          updated_at?: string
          zone?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          manager_email?: string | null
          name?: string
          state?: string
          status?: string
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          file_url: string | null
          generated_by: string | null
          id: string
          parameters: Json
          report_type: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          generated_by?: string | null
          id?: string
          parameters?: Json
          report_type: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          generated_by?: string | null
          id?: string
          parameters?: Json
          report_type?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          anonymous_id: string
          batch_id: string | null
          created_at: string
          device_type: string | null
          ended_at: string | null
          id: string
          ip_hash: string | null
          qr_type: string | null
          quiz_category: string | null
          quiz_completed: boolean
          redemption_allowed: boolean
          referrer: string | null
          result_type: string | null
          shop_id: string | null
          user_agent: string | null
          whatsapp_number: string | null
          whatsapp_verified: boolean
        }
        Insert: {
          anonymous_id: string
          batch_id?: string | null
          created_at?: string
          device_type?: string | null
          ended_at?: string | null
          id?: string
          ip_hash?: string | null
          qr_type?: string | null
          quiz_category?: string | null
          quiz_completed?: boolean
          redemption_allowed?: boolean
          referrer?: string | null
          result_type?: string | null
          shop_id?: string | null
          user_agent?: string | null
          whatsapp_number?: string | null
          whatsapp_verified?: boolean
        }
        Update: {
          anonymous_id?: string
          batch_id?: string | null
          created_at?: string
          device_type?: string | null
          ended_at?: string | null
          id?: string
          ip_hash?: string | null
          qr_type?: string | null
          quiz_category?: string | null
          quiz_completed?: boolean
          redemption_allowed?: boolean
          referrer?: string | null
          result_type?: string | null
          shop_id?: string | null
          user_agent?: string | null
          whatsapp_number?: string | null
          whatsapp_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sessions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "shop_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_stock: {
        Row: {
          batch_name: string | null
          created_at: string
          id: string
          product_id: string | null
          product_type: string
          quantity_assigned: number
          quantity_redeemed: number
          shop_id: string
          status: string
          updated_at: string
        }
        Insert: {
          batch_name?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          product_type: string
          quantity_assigned?: number
          quantity_redeemed?: number
          shop_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          batch_name?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          product_type?: string
          quantity_assigned?: number
          quantity_redeemed?: number
          shop_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_stock_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          geo_lat: number | null
          geo_lng: number | null
          id: string
          location: string | null
          name: string
          owner_contact: string | null
          owner_name: string | null
          pincode: string | null
          shop_code: string
          shop_type: string | null
          state: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          location?: string | null
          name: string
          owner_contact?: string | null
          owner_name?: string | null
          pincode?: string | null
          shop_code: string
          shop_type?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          location?: string | null
          name?: string
          owner_contact?: string | null
          owner_name?: string | null
          pincode?: string | null
          shop_code?: string
          shop_type?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      success_rules: {
        Row: {
          created_at: string
          end_hour: number | null
          id: string
          is_active: boolean
          priority: number
          rule_type: string
          shop_id: string | null
          start_hour: number | null
          success_probability: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_hour?: number | null
          id?: string
          is_active?: boolean
          priority?: number
          rule_type: string
          shop_id?: string | null
          start_hour?: number | null
          success_probability?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_hour?: number | null
          id?: string
          is_active?: boolean
          priority?: number
          rule_type?: string
          shop_id?: string | null
          start_hour?: number | null
          success_probability?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "success_rules_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      super_deals: {
        Row: {
          button_text: string | null
          category: string
          coins_required: number
          coupons_claimed: number
          created_at: string
          description: string | null
          discount_percent: number | null
          discounted_price: number | null
          display_order: number
          end_date: string | null
          features: string[] | null
          id: string
          image_url: string | null
          long_description: string | null
          original_price: number | null
          platform_name: string | null
          platform_url: string | null
          rating: number | null
          reviews_count: number | null
          start_date: string | null
          status: string
          subtitle: string | null
          title: string
          total_coupons: number
          updated_at: string
        }
        Insert: {
          button_text?: string | null
          category?: string
          coins_required?: number
          coupons_claimed?: number
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          discounted_price?: number | null
          display_order?: number
          end_date?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          long_description?: string | null
          original_price?: number | null
          platform_name?: string | null
          platform_url?: string | null
          rating?: number | null
          reviews_count?: number | null
          start_date?: string | null
          status?: string
          subtitle?: string | null
          title: string
          total_coupons?: number
          updated_at?: string
        }
        Update: {
          button_text?: string | null
          category?: string
          coins_required?: number
          coupons_claimed?: number
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          discounted_price?: number | null
          display_order?: number
          end_date?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          long_description?: string | null
          original_price?: number | null
          platform_name?: string | null
          platform_url?: string | null
          rating?: number | null
          reviews_count?: number | null
          start_date?: string | null
          status?: string
          subtitle?: string | null
          title?: string
          total_coupons?: number
          updated_at?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string
          id: string
          log_type: string
          message: string
          metadata: Json | null
          severity: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_type: string
          message: string
          metadata?: Json | null
          severity?: string
        }
        Update: {
          created_at?: string
          id?: string
          log_type?: string
          message?: string
          metadata?: Json | null
          severity?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          clicks_count: number | null
          created_at: string
          downloads_count: number | null
          id: string
          last_activity_at: string | null
          page_views: number | null
          scroll_depth_percent: number | null
          session_data: Json | null
          session_id: string | null
          total_time_spent: number | null
          updated_at: string
        }
        Insert: {
          clicks_count?: number | null
          created_at?: string
          downloads_count?: number | null
          id?: string
          last_activity_at?: string | null
          page_views?: number | null
          scroll_depth_percent?: number | null
          session_data?: Json | null
          session_id?: string | null
          total_time_spent?: number | null
          updated_at?: string
        }
        Update: {
          clicks_count?: number | null
          created_at?: string
          downloads_count?: number | null
          id?: string
          last_activity_at?: string | null
          page_views?: number | null
          scroll_depth_percent?: number | null
          session_data?: Json | null
          session_id?: string | null
          total_time_spent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_offer_click_rewards: {
        Row: {
          click_date: string
          clicks_count: number
          coins_earned: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          click_date?: string
          clicks_count?: number
          coins_earned?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          click_date?: string
          clicks_count?: number
          coins_earned?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_quiz_rewards: {
        Row: {
          coins_earned: number
          completed_at: string
          id: string
          quiz_id: string
          user_id: string
        }
        Insert: {
          coins_earned: number
          completed_at?: string
          id?: string
          quiz_id: string
          user_id: string
        }
        Update: {
          coins_earned?: number
          completed_at?: string
          id?: string
          quiz_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_rewards_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_unlocked_deals: {
        Row: {
          coins_spent: number
          coupon_code_id: string | null
          id: string
          super_deal_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          coins_spent: number
          coupon_code_id?: string | null
          id?: string
          super_deal_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          coins_spent?: number
          coupon_code_id?: string | null
          id?: string
          super_deal_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_unlocked_deals_coupon_code_id_fkey"
            columns: ["coupon_code_id"]
            isOneToOne: false
            referencedRelation: "coupon_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_unlocked_deals_super_deal_id_fkey"
            columns: ["super_deal_id"]
            isOneToOne: false
            referencedRelation: "super_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallets: {
        Row: {
          coins_balance: number
          created_at: string
          id: string
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coins_balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coins_balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_coins: {
        Args: {
          p_amount: number
          p_description?: string
          p_reference_id?: string
          p_type: string
          p_user_id: string
        }
        Returns: Json
      }
      admin_adjust_coins: {
        Args: { p_amount: number; p_description: string; p_user_id: string }
        Returns: Json
      }
      award_offer_click_coins: { Args: { p_user_id: string }; Returns: Json }
      award_quiz_completion_coins: {
        Args: { p_quiz_id: string; p_user_id: string }
        Returns: Json
      }
      check_event_rate_limit: {
        Args: { p_session_id: string }
        Returns: boolean
      }
      check_offer_event_rate_limit: {
        Args: { p_session_id: string }
        Returns: boolean
      }
      check_session_rate_limit: {
        Args: { p_anonymous_id: string }
        Returns: boolean
      }
      get_admin_dashboard_stats: {
        Args: { end_date?: string; start_date?: string }
        Returns: Json
      }
      get_top_shops: {
        Args: { limit_count?: number; start_date?: string }
        Returns: {
          conversions: number
          shop_id: string
          shop_name: string
          total_scans: number
          verified_users: number
        }[]
      }
      get_user_coupon: {
        Args: { p_deal_id: string; p_user_id: string }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      process_daily_checkin: { Args: { p_user_id: string }; Returns: Json }
      unlock_super_deal: {
        Args: { p_deal_id: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
