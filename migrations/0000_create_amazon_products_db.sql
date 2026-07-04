CREATE TABLE IF NOT EXISTS amazon_products (
    asin TEXT PRIMARY KEY, 
    title TEXT,
    image_url TEXT,
    product_url TEXT,
    price TEXT,
    rating TEXT,
    reviews_count TEXT,
    attributes TEXT,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
