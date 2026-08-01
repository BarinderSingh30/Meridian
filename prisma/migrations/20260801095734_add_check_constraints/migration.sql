ALTER TABLE "Review" ADD CONSTRAINT review_rating_range CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE "Product" ADD CONSTRAINT product_price_nonneg CHECK ("priceCents" >= 0);
ALTER TABLE "Product" ADD CONSTRAINT product_stock_nonneg CHECK ("stockQuantity" >= 0);
ALTER TABLE "CartItem" ADD CONSTRAINT cartitem_qty_positive CHECK (quantity > 0);
