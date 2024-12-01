-- Ensure the uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS carts CASCADE;

-- Drop type if it exists
DROP TYPE IF EXISTS cart_status;

-- Create type for cart status
CREATE TYPE cart_status AS ENUM ('OPEN', 'ORDERED');

-- Create the carts table
CREATE TABLE carts (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at DATE NOT NULL,
    updated_at DATE NOT NULL,
    status cart_status NOT NULL
);

-- Create the cart_items table
CREATE TABLE cart_items (
    cart_id UUID NOT NULL,
    product_id UUID NOT NULL,
    count INTEGER,
    PRIMARY KEY (cart_id, product_id),
    FOREIGN KEY (cart_id) REFERENCES carts(id)
);

-- Create the orders table
CREATE TABLE orders (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    cart_id UUID NOT NULL,
    payment JSON NOT NULL,
    delivery JSON NOT NULL,
    comments TEXT,
    status TEXT NOT NULL,
    total NUMERIC NOT NULL,
    created_at DATE NOT NULL,
    updated_at DATE NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES carts(id)
);
