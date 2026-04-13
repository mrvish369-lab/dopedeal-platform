-- Add card_segment column to offer_cards for organizing cards into themed segments
ALTER TABLE public.offer_cards 
ADD COLUMN card_segment text DEFAULT 'viral_deals';

-- Add check constraint for valid segment values
ALTER TABLE public.offer_cards 
ADD CONSTRAINT offer_cards_segment_check 
CHECK (card_segment IN ('money_making', 'viral_deals'));

-- Create index for faster segment-based queries
CREATE INDEX idx_offer_cards_segment ON public.offer_cards(card_segment);

-- Add comment describing the segments
COMMENT ON COLUMN public.offer_cards.card_segment IS 'Segment type: money_making (online earning opportunities) or viral_deals (Amazon affiliate, health courses, subscriptions)';