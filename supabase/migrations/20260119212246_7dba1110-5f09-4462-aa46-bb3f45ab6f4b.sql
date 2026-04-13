-- Add image_fit column to offer_cards for controlling how images display
ALTER TABLE public.offer_cards 
ADD COLUMN IF NOT EXISTS image_fit text DEFAULT 'cover';

-- Add comment for documentation
COMMENT ON COLUMN public.offer_cards.image_fit IS 'Controls how product images display: cover, contain, fill, scale-down';