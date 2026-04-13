-- Add batch_id and qr_type to qr_codes table
ALTER TABLE public.qr_codes 
ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.shop_stock(id),
ADD COLUMN IF NOT EXISTS qr_type text NOT NULL DEFAULT 'quiz';

-- Add batch_id and qr_type to sessions table for dual QR tracking
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.shop_stock(id),
ADD COLUMN IF NOT EXISTS qr_type text DEFAULT 'quiz';

-- Add batch_name to shop_stock for better tracking
ALTER TABLE public.shop_stock 
ADD COLUMN IF NOT EXISTS batch_name text,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Create index for faster QR type filtering
CREATE INDEX IF NOT EXISTS idx_sessions_qr_type ON public.sessions(qr_type);
CREATE INDEX IF NOT EXISTS idx_qr_codes_qr_type ON public.qr_codes(qr_type);
CREATE INDEX IF NOT EXISTS idx_qr_codes_batch_id ON public.qr_codes(batch_id);

-- Add comment for documentation
COMMENT ON COLUMN public.qr_codes.qr_type IS 'quiz or lighter';
COMMENT ON COLUMN public.sessions.qr_type IS 'quiz or lighter';