-- Create reports table for generated reports
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL,
  title TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}',
  generated_by UUID,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brands table for advertiser accounts
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brand_campaigns table for campaign management
CREATE TABLE public.brand_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  target_cities TEXT[] DEFAULT '{}',
  target_categories TEXT[] DEFAULT '{}',
  impression_cap INTEGER,
  click_cap INTEGER,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Link offer blocks to campaigns
CREATE TABLE public.campaign_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.brand_campaigns(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.offer_blocks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, block_id)
);

-- Create regions table for multi-city management
CREATE TABLE public.regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zone TEXT,
  manager_email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create consents table for GDPR/legal compliance
CREATE TABLE public.consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id),
  consent_type TEXT NOT NULL,
  consent_text TEXT,
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  ip_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_logs table for monitoring
CREATE TABLE public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create legal_pages table for editable legal content
CREATE TABLE public.legal_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT TRUE,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create data_retention_settings table
CREATE TABLE public.data_retention_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_type TEXT NOT NULL UNIQUE,
  retention_months INTEGER NOT NULL DEFAULT 12,
  auto_delete BOOLEAN DEFAULT FALSE,
  last_cleanup_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_settings ENABLE ROW LEVEL SECURITY;

-- Admin policies for reports
CREATE POLICY "Admins can manage reports" ON public.reports FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Admin policies for brands
CREATE POLICY "Admins can manage brands" ON public.brands FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Admin policies for brand_campaigns
CREATE POLICY "Admins can manage campaigns" ON public.brand_campaigns FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Admin policies for campaign_blocks
CREATE POLICY "Admins can manage campaign blocks" ON public.campaign_blocks FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Admin policies for regions
CREATE POLICY "Admins can manage regions" ON public.regions FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Public insert for consents (users can grant consent)
CREATE POLICY "Anyone can create consent" ON public.consents FOR INSERT WITH CHECK (true);
-- Admin read for consents
CREATE POLICY "Admins can view consents" ON public.consents FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Admin policies for system_logs
CREATE POLICY "Admins can manage system logs" ON public.system_logs FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Public read for published legal pages
CREATE POLICY "Anyone can view published legal pages" ON public.legal_pages FOR SELECT 
USING (is_published = true);
-- Admin full access for legal pages
CREATE POLICY "Admins can manage legal pages" ON public.legal_pages FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Admin policies for data_retention_settings
CREATE POLICY "Admins can manage retention settings" ON public.data_retention_settings FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Create indexes
CREATE INDEX idx_reports_type ON public.reports(report_type);
CREATE INDEX idx_reports_created ON public.reports(created_at);
CREATE INDEX idx_brands_status ON public.brands(status);
CREATE INDEX idx_campaigns_brand ON public.brand_campaigns(brand_id);
CREATE INDEX idx_campaigns_status ON public.brand_campaigns(status);
CREATE INDEX idx_regions_city ON public.regions(city);
CREATE INDEX idx_consents_session ON public.consents(session_id);
CREATE INDEX idx_system_logs_type ON public.system_logs(log_type);
CREATE INDEX idx_system_logs_severity ON public.system_logs(severity);
CREATE INDEX idx_legal_pages_slug ON public.legal_pages(slug);

-- Triggers for updated_at
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_campaigns_updated_at BEFORE UPDATE ON public.brand_campaigns 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON public.regions 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_pages_updated_at BEFORE UPDATE ON public.legal_pages 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default legal pages
INSERT INTO public.legal_pages (slug, title, content) VALUES
('terms', 'Terms & Conditions', '# Terms & Conditions\n\nWelcome to DopeDeal. By using our service, you agree to these terms.\n\n## Usage\n\nThis platform is for promotional purposes only.\n\n## Contact\n\nFor questions, contact support.'),
('privacy', 'Privacy Policy', '# Privacy Policy\n\nYour privacy is important to us.\n\n## Data Collection\n\nWe collect WhatsApp numbers for verification and promotional messages.\n\n## Data Security\n\nAll data is encrypted and stored securely.'),
('disclaimer', 'Disclaimer', '# Disclaimer\n\nDopeDeal is a promotional platform. Offers are subject to availability and terms.')
ON CONFLICT (slug) DO NOTHING;

-- Insert default data retention settings
INSERT INTO public.data_retention_settings (data_type, retention_months, auto_delete) VALUES
('sessions', 12, false),
('offer_events', 24, false),
('quiz_logs', 12, false),
('consents', 36, false)
ON CONFLICT (data_type) DO NOTHING;