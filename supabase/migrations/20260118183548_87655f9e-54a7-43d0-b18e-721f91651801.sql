-- Drop the unique constraint that prevents multiple batches of the same product type per shop
ALTER TABLE public.shop_stock DROP CONSTRAINT IF EXISTS shop_stock_shop_id_product_type_key;