-- Create the database (run this as superuser)
CREATE DATABASE trading_journal;

-- Connect to it: \c trading_journal

-- The table is created automatically by SQLAlchemy on app startup.
-- If you want to create it manually ahead of time:
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    entry_date DATE NOT NULL,
    exit_date DATE,
    scrip_name VARCHAR(255) NOT NULL,
    option_type VARCHAR(10),
    buy_sell VARCHAR(10) NOT NULL,
    entry_price DOUBLE PRECISION NOT NULL,
    exit_price DOUBLE PRECISION,
    profit_loss_per_unit DOUBLE PRECISION,
    quantity INTEGER NOT NULL,
    profit_loss_total DOUBLE PRECISION,
    returns_percent DOUBLE PRECISION,
    customer_name VARCHAR(255),
    notes TEXT
);

-- If upgrading an existing database, run:
-- ALTER TABLE trades ADD COLUMN IF NOT EXISTS option_type VARCHAR(10);
-- ALTER TABLE trades ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
-- ALTER TABLE trades ALTER COLUMN option_type DROP NOT NULL;
-- ALTER TABLE trades ALTER COLUMN exit_date DROP NOT NULL;
-- ALTER TABLE trades ALTER COLUMN exit_price DROP NOT NULL;
