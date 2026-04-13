-- Create offer_cards table for admin-editable offer templates (Part 3)
CREATE TABLE public.offer_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_type TEXT NOT NULL DEFAULT 'custom',
  template_key TEXT UNIQUE, -- e.g., 'honeygain', 'cashkaro', 'sports_trading', 'telegram_loot', 'amazon_deal'
  title TEXT NOT NULL,
  subtitle TEXT,
  logo_url TEXT,
  cta_text TEXT NOT NULL DEFAULT 'Get Started',
  redirect_url TEXT NOT NULL,
  open_new_tab BOOLEAN DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  -- Targeting
  target_cities TEXT[] DEFAULT '{}',
  target_shop_ids UUID[] DEFAULT '{}',
  target_batch_ids UUID[] DEFAULT '{}',
  -- Scheduling
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  -- Styling
  background_color TEXT,
  glow_enabled BOOLEAN DEFAULT false,
  animation TEXT, -- 'none', 'breathing', 'shake'
  -- Metadata
  click_count INT DEFAULT 0,
  impression_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offer_cards ENABLE ROW LEVEL SECURITY;

-- Public read for active cards
CREATE POLICY "Anyone can view active offer cards" 
ON public.offer_cards 
FOR SELECT 
USING (status = 'active');

-- Admin full access
CREATE POLICY "Admins can manage offer cards" 
ON public.offer_cards 
FOR ALL 
USING (public.is_admin());

-- Create updated_at trigger
CREATE TRIGGER update_offer_cards_updated_at
BEFORE UPDATE ON public.offer_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert pre-built system template cards (disabled by default for admin to configure)
INSERT INTO public.offer_cards (template_key, card_type, title, subtitle, logo_url, cta_text, redirect_url, display_order, status) VALUES
('honeygain', 'template', 'Earn Passive Income', 'Earn Daily Without Investment', 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/honeygain.svg', 'Start Now', 'https://r.honeygain.me/DOPEDEAL', 1, 'draft'),
('cashkaro', 'template', 'Extra Cashback on Shopping', 'India''s Trusted Cashback Platform', 'https://www.cashkaro.com/images/cashkaro_logo.png', 'Claim Cashback', 'https://cashkaro.com', 2, 'draft'),
('sports_trading', 'template', 'Free Sports Trading Course', 'Learn & Earn with Expert Guidance', NULL, 'Download Now', '#', 3, 'draft'),
('telegram_loot', 'template', 'Daily Super Loot & Deals', 'Join Our Telegram Channel', NULL, 'Join Channel', 'https://t.me/dopedeal', 4, 'draft'),
('amazon_deal', 'template', 'Today''s Top Amazon Deal', 'Limited Time Offer', 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', 'View Deal', 'https://amzn.to/dopedeal', 5, 'draft');

-- Add card_id column to offer_events if not exists (for tracking)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offer_events' AND column_name = 'card_id') THEN
    ALTER TABLE public.offer_events ADD COLUMN card_id UUID REFERENCES public.offer_cards(id);
  END IF;
END $$;