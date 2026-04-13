-- Create offer_blocks table for admin-controlled content blocks
CREATE TABLE public.offer_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_type TEXT NOT NULL CHECK (block_type IN ('banner', 'button', 'course', 'video')),
  title TEXT,
  subtitle TEXT,
  content_json JSONB NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  target_categories TEXT[] DEFAULT '{}',
  target_cities TEXT[] DEFAULT '{}',
  target_shop_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offer_events table for tracking all user interactions
CREATE TABLE public.offer_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id),
  shop_id UUID REFERENCES public.shops(id),
  block_id UUID REFERENCES public.offer_blocks(id),
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  device_type TEXT,
  approx_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliate_links table for revenue tracking
CREATE TABLE public.affiliate_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_name TEXT NOT NULL,
  tracking_url TEXT NOT NULL,
  commission_value DECIMAL(10,2) DEFAULT 0,
  block_id UUID REFERENCES public.offer_blocks(id),
  total_clicks INTEGER DEFAULT 0,
  total_installs INTEGER DEFAULT 0,
  estimated_earnings DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_activity table for behavior analytics
CREATE TABLE public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) UNIQUE,
  total_time_spent INTEGER DEFAULT 0,
  scroll_depth_percent INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fraud_alerts table for suspicious activity detection
CREATE TABLE public.fraud_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  session_id UUID REFERENCES public.sessions(id),
  shop_id UUID REFERENCES public.shops(id),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  details JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.offer_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Public read access for offer_blocks (users need to see offers)
CREATE POLICY "Anyone can view active offer blocks" 
ON public.offer_blocks FOR SELECT 
USING (status = 'active');

-- Admin full access for offer_blocks
CREATE POLICY "Admins can manage offer blocks" 
ON public.offer_blocks FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Public insert for offer_events (track user interactions)
CREATE POLICY "Anyone can log offer events" 
ON public.offer_events FOR INSERT 
WITH CHECK (true);

-- Admin read access for offer_events
CREATE POLICY "Admins can view offer events" 
ON public.offer_events FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Admin full access for affiliate_links
CREATE POLICY "Admins can manage affiliate links" 
ON public.affiliate_links FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Public insert/update for user_activity
CREATE POLICY "Anyone can log user activity" 
ON public.user_activity FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update their activity" 
ON public.user_activity FOR UPDATE 
USING (true);

-- Admin read access for user_activity
CREATE POLICY "Admins can view user activity" 
ON public.user_activity FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Admin full access for fraud_alerts
CREATE POLICY "Admins can manage fraud alerts" 
ON public.fraud_alerts FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_offer_blocks_position ON public.offer_blocks(position);
CREATE INDEX idx_offer_blocks_status ON public.offer_blocks(status);
CREATE INDEX idx_offer_events_session ON public.offer_events(session_id);
CREATE INDEX idx_offer_events_block ON public.offer_events(block_id);
CREATE INDEX idx_offer_events_type ON public.offer_events(event_type);
CREATE INDEX idx_offer_events_created ON public.offer_events(created_at);
CREATE INDEX idx_user_activity_session ON public.user_activity(session_id);
CREATE INDEX idx_fraud_alerts_shop ON public.fraud_alerts(shop_id);

-- Create trigger for updated_at
CREATE TRIGGER update_offer_blocks_updated_at
BEFORE UPDATE ON public.offer_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_links_updated_at
BEFORE UPDATE ON public.affiliate_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_activity_updated_at
BEFORE UPDATE ON public.user_activity
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();