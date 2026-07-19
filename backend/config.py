import os
from pathlib import Path

# Database configuration
# DB_TYPE = os.getenv("DB_TYPE", "sqlite")
DB_TYPE = os.getenv("DB_TYPE", "postgres")

# DB Connection URL for PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/trading_journal")

# DB file for SQLite (absolute path to backend directory)
DB_PATH = os.getenv("DB_PATH", str(Path(__file__).parent / "trading_journal.db"))
