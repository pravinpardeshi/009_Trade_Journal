-- Create the database (run this as superuser)
CREATE DATABASE trading_journal;

-- Connect to it: \c trading_journal

-- The table is created automatically by SQLAlchemy on app startup.
-- If you want to create it manually ahead of time:
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    entry_date DATE NOT NULL,
    exit_date DATE NOT NULL,
    scrip_name VARCHAR(255) NOT NULL,
    buy_sell VARCHAR(10) NOT NULL,
    entry_price DOUBLE PRECISION NOT NULL,
    exit_price DOUBLE PRECISION NOT NULL,
    profit_loss_per_unit DOUBLE PRECISION,
    quantity INTEGER NOT NULL,
    profit_loss_total DOUBLE PRECISION,
    returns_percent DOUBLE PRECISION,
    notes TEXT
);
