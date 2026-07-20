# Trading Journal

A web-based trading journal to track and analyze stock/option trades. Built with FastAPI backend (PostgreSQL or SQLite) and vanilla HTML/CSS/JS frontend.

## Features

- **Entry Form** — Log trades with scrip name, option type (CE/PE), buy/sell direction, entry/exit price, quantity, and notes. P/L is auto-calculated based on direction and option type.
- **Trade History** — View all trades in a table with click-to-sort column headers (ascending/descending toggle). Date range, customer, and text filtering. Export to CSV.
- **Reports** — Weekly and monthly aggregated reports showing total trades, wins, losses, win rate, P/L, return %, and quantity.
- **PDF Export** — Export reports and trade history to PDF (client-side using jsPDF).
- **Database Backup & Restore** — Download a full backup (`.sql` for PostgreSQL, `.db` for SQLite), or restore from a previous backup.
- **Dark/Light Theme** — Toggleable with persistent preference.
- **Collapsible Sidebar** — Auto-expands on hover, collapses on click, with floating design.
- **Database Indicator** — Sidebar displays active database type (SQLite or PostgreSQL).
- **HTTPS** — Served over HTTPS with self-signed SSL certificates. Supports querying newly modified trades via `updated_at` timestamps.

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL or SQLite
- **Frontend:** Vanilla HTML, CSS, JavaScript (no frameworks)
- **Fonts:** Inter (Google Fonts)
- **PDF:** jsPDF + jspdf-autotable (CDN)

## Getting Started

### Prerequisites

- Python 3.12+
- PostgreSQL (optional — SQLite supported as alternative)
- `pg_dump` and `psql` CLI tools (for PostgreSQL backup/restore only)

### Setup

1. **Clone the repo**

   ```sh
   git clone <repo-url>
   cd reporting-app
   ```

2. **Create a virtual environment**

   ```sh
   python -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies**

   ```sh
   pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-multipart
   ```

4. **Set up the database**

   **Option A: SQLite (simpler, no external DB needed)**

   No setup required — the database is created automatically on first run.

   ```sh
   export DB_TYPE=sqlite
   ```

   Optionally set a custom path:

   ```sh
   export DB_PATH=/path/to/trading_journal.db
   ```

   **Option B: PostgreSQL**

   ```sh
   createdb trading_journal
   psql -d trading_journal -f backend/init_db.sql
   ```

   If you already have the database but need the `option_type` column:

   ```sh
   psql -d trading_journal -f backend/migrate.sql
   ```

5. **Generate SSL certificates (for HTTPS)**

   ```sh
   mkdir -p backend/certs
   openssl req -x509 -newkey rsa:2048 -keyout backend/certs/server.key -out backend/certs/server.crt -days 365 -nodes -subj "/C=IN/ST=State/L=City/O=TradingJournal/CN=YOUR_IP"
   ```

   Replace `YOUR_IP` with your server's IP address (e.g., `192.168.2.177`).

6. **Start the server**

   ```sh
   cd backend && uvicorn main:app --reload --ssl-keyfile certs/server.key --ssl-certfile certs/server.crt
   ```

   Or use the helper script:

   ```sh
   ./start.sh          # start in background
   ./start.sh stop     # stop
   ./start.sh restart  # restart
   ```

7. **Open the app**

   Navigate to `https://<your-ip>:8223`

   > The browser will warn about the self-signed certificate. Click **Advanced** → **Proceed** to continue.

## Project Structure

```
reporting-app/
├── backend/
│   ├── main.py          # FastAPI app with all endpoints
│   ├── models.py        # SQLAlchemy Trade model
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── database.py      # DB connection config (PostgreSQL/SQLite)
│   ├── config.py        # DB_TYPE, DB_PATH, DATABASE_URL settings
│   ├── certs/           # SSL certificates (server.key, server.crt)
│   ├── init_db.sql      # Database & table creation SQL
│   ├── migrate.sql      # ALTER TABLE for option_type
│   └── requirements.txt
├── static/
│   ├── index.html       # Main page (sidebar, forms, tables)
│   ├── style.css        # All styles with theme variables
│   └── script.js        # All frontend logic
├── start.sh             # Helper to run/manage the server
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Serve the frontend |
| GET | `/api/config` | Get app config (database type) |
| POST | `/api/trades` | Create a new trade |
| GET | `/api/trades` | List trades (query params: `from_date`, `to_date`, `customer`, `search`, `modified_since`) |
| GET | `/api/trades/{id}` | Get a single trade |
| PUT | `/api/trades/{id}` | Update a trade |
| DELETE | `/api/trades/{id}` | Delete a trade |
| GET | `/api/customers` | List distinct customer names |
| GET | `/api/reports/weekly` | Weekly aggregated report |
| GET | `/api/reports/monthly` | Monthly aggregated report |
| GET | `/api/reports/summary` | Scrip-level summary report |
| GET | `/api/backup` | Download database backup (`.sql` or `.db`) |
| POST | `/api/restore` | Restore from a backup file (`.sql` or `.db`) |

## P/L Calculation

Profit/Loss is calculated based on buy/sell direction:

| Buy/Sell | Direction |
|----------|-----------|
| BUY | +1 |
| SELL | -1 |

```
P/L per unit = direction × (exit_price − entry_price)
P/L total    = P/L per unit × quantity
% Returns    = (P/L per unit / entry_price) × 100
```
