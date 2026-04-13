-- Create products table to unify product types across the system
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  offer_price NUMERIC(10, 2) NOT NULL DEFAULT 2.00,
  original_price NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
  emoji TEXT DEFAULT '🎁',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leads table for WhatsApp lead management
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_number TEXT NOT NULL,
  session_id UUID REFERENCES public.sessions(id),
  shop_id UUID REFERENCES public.shops(id),
  product_id UUID REFERENCES public.products(id),
  campaign_id UUID REFERENCES public.quiz_campaigns(id),
  result_type TEXT CHECK (result_type IN ('success', 'failure')),
  redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  device_type TEXT,
  city TEXT,
  state TEXT,
  notes TEXT,
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'rejected', 'unresponsive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add product_id to shop_stock (link stock to products)
ALTER TABLE public.shop_stock 
ADD COLUMN product_id UUID REFERENCES public.products(id);

-- Add product_id to quiz_campaigns (link campaigns to products)
ALTER TABLE public.quiz_campaigns 
ADD COLUMN product_id UUID REFERENCES public.products(id);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products (admin only write, public read for active)
CREATE POLICY "Anyone can view active products" 
ON public.products FOR SELECT 
USING (status = 'active');

CREATE POLICY "Admins can manage products" 
ON public.products FOR ALL 
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- RLS Policies for leads (admin only)
CREATE POLICY "Admins can view all leads" 
ON public.leads FOR SELECT 
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage leads" 
ON public.leads FOR ALL 
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Allow anonymous lead creation (for capturing during quiz flow)
CREATE POLICY "Anyone can create leads" 
ON public.leads FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_leads_whatsapp ON public.leads(whatsapp_number);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_shop_id ON public.leads(shop_id);
CREATE INDEX idx_leads_product_id ON public.leads(product_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_shop_stock_product_id ON public.shop_stock(product_id);
CREATE INDEX idx_quiz_campaigns_product_id ON public.quiz_campaigns(product_id);

-- Insert existing product types as products
INSERT INTO public.products (name, slug, description, offer_price, original_price, emoji) VALUES
('DopeDeal Lighter', 'lighter', 'Premium quality refillable lighter with DopeDeal branding', 2.00, 50.00, '🔥'),
('DopeDeal Keychain', 'keychain', 'Stylish metal keychain with bottle opener', 5.00, 75.00, '🔑');

-- Create updated_at trigger for products
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for leads
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();