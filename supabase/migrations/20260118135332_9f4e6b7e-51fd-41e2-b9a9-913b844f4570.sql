-- =============================================
-- DOPEDEAL PLATFORM - PART 2 DATABASE SCHEMA
-- Admin Panel, Shop Management, QR & Stock System
-- =============================================

-- 1. Extend shops table with additional fields
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS owner_contact TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS shop_type TEXT DEFAULT 'general_store' CHECK (shop_type IN ('tea_stall', 'pan_stall', 'general_store', 'other'));

-- 2. Create shop_stock table for inventory tracking
CREATE TABLE public.shop_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL CHECK (product_type IN ('lighter', 'keychain', 'lip_balm', 'other')),
  quantity_assigned INTEGER NOT NULL DEFAULT 0,
  quantity_redeemed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id, product_type)
);

-- 3. Create qr_codes table
CREATE TABLE public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  qr_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'regenerated')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id, version)
);

-- 4. Create admin_logs table for activity monitoring
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create time-based success settings
CREATE TABLE public.success_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('global', 'shop', 'time_based')),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  success_probability INTEGER NOT NULL DEFAULT 80 CHECK (success_probability >= 0 AND success_probability <= 100),
  start_hour INTEGER CHECK (start_hour >= 0 AND start_hour <= 23),
  end_hour INTEGER CHECK (end_hour >= 0 AND end_hour <= 23),
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_shop_stock_updated_at
  BEFORE UPDATE ON public.shop_stock
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_qr_codes_updated_at
  BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_success_rules_updated_at
  BEFORE UPDATE ON public.success_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.shop_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_rules ENABLE ROW LEVEL SECURITY;

-- Shop stock policies
CREATE POLICY "Admins can manage shop_stock" ON public.shop_stock
  FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view shop_stock for redemption check" ON public.shop_stock
  FOR SELECT USING (true);

-- QR codes policies
CREATE POLICY "Admins can manage qr_codes" ON public.qr_codes
  FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view active qr_codes" ON public.qr_codes
  FOR SELECT USING (status = 'active');

-- Admin logs policies (admin only)
CREATE POLICY "Admins can view admin_logs" ON public.admin_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can create admin_logs" ON public.admin_logs
  FOR INSERT WITH CHECK (is_admin());

-- Success rules policies
CREATE POLICY "Admins can manage success_rules" ON public.success_rules
  FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view active success_rules" ON public.success_rules
  FOR SELECT USING (is_active = true);

-- =============================================
-- HELPER FUNCTIONS FOR ADMIN STATS
-- =============================================

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_shops', (SELECT COUNT(*) FROM public.shops WHERE status = 'active'),
    'total_scans', (SELECT COUNT(*) FROM public.sessions WHERE created_at BETWEEN start_date AND end_date),
    'verified_users', (SELECT COUNT(*) FROM public.sessions WHERE whatsapp_verified = true AND created_at BETWEEN start_date AND end_date),
    'success_count', (SELECT COUNT(*) FROM public.sessions WHERE result_type = 'success' AND created_at BETWEEN start_date AND end_date),
    'failure_count', (SELECT COUNT(*) FROM public.sessions WHERE result_type = 'failure' AND created_at BETWEEN start_date AND end_date),
    'quiz_completed', (SELECT COUNT(*) FROM public.sessions WHERE quiz_completed = true AND created_at BETWEEN start_date AND end_date)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get top performing shops
CREATE OR REPLACE FUNCTION public.get_top_shops(
  limit_count INTEGER DEFAULT 5,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now() - INTERVAL '7 days'
)
RETURNS TABLE (
  shop_id UUID,
  shop_name TEXT,
  total_scans BIGINT,
  verified_users BIGINT,
  conversions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as shop_id,
    s.name as shop_name,
    COUNT(sess.id) as total_scans,
    COUNT(CASE WHEN sess.whatsapp_verified THEN 1 END) as verified_users,
    COUNT(CASE WHEN sess.result_type = 'success' THEN 1 END) as conversions
  FROM public.shops s
  LEFT JOIN public.sessions sess ON sess.shop_id = s.id AND sess.created_at >= start_date
  WHERE s.status = 'active'
  GROUP BY s.id, s.name
  ORDER BY conversions DESC, total_scans DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Insert default global success rule
INSERT INTO public.success_rules (rule_type, success_probability, priority) 
VALUES ('global', 80, 0);