# Trading Journal

A web-based trading journal to track and analyze stock/option trades. Built with FastAPI + PostgreSQL backend and vanilla HTML/CSS/JS frontend.

## Features

- **Entry Form** — Log trades with scrip name, option type (CE/PE), buy/sell direction, entry/exit price, quantity, and notes. P/L is auto-calculated based on direction and option type.
- **Trade History** — View all trades in a sortable table with date range filtering. Export to CSV.
- **Reports** — Weekly and monthly aggregated reports showing total trades, wins, losses, win rate, P/L, return %, and quantity.
- **PDF Export** — Export reports and trade history to PDF (client-side using jsPDF).
- **Database Backup & Restore** — Download a full SQL dump via pg_dump, or restore from a previous backup.
- **Dark/Light Theme** — Toggleable with persistent preference.
- **Collapsible Sidebar** — Auto-expands on hover, collapses on click, with floating design.

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend:** Vanilla HTML, CSS, JavaScript (no frameworks)
- **Fonts:** Inter (Google Fonts)
- **PDF:** jsPDF + jspdf-autotable (CDN)

## Getting Started

### Prerequisites

- Python 3.12+
- PostgreSQL
- `pg_dump` and `psql` CLI tools (for backup/restore)

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

   ```sh
   createdb trading_journal
   psql -d trading_journal -f backend/init_db.sql
   ```

   If you already have the database but need the `option_type` column:

   ```sh
   psql -d trading_journal -f backend/migrate.sql
   ```

5. **Start the server**

   ```sh
   cd backend && uvicorn main:app --reload
   ```

   Or use the helper script:

   ```sh
   ./start.sh          # start in background
   ./start.sh stop     # stop
   ./start.sh restart  # restart
   ```

6. **Open the app**

   Navigate to [http://localhost:8000](http://localhost:8000)

## Project Structure

```
reporting-app/
├── backend/
│   ├── main.py          # FastAPI app with all endpoints
│   ├── models.py        # SQLAlchemy Trade model
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── database.py      # DB connection config
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
| POST | `/api/trades` | Create a new trade |
| GET | `/api/trades` | List trades (optional `from_date`, `to_date`) |
| GET | `/api/trades/{id}` | Get a single trade |
| PUT | `/api/trades/{id}` | Update a trade |
| DELETE | `/api/trades/{id}` | Delete a trade |
| GET | `/api/reports/weekly` | Weekly aggregated report |
| GET | `/api/reports/monthly` | Monthly aggregated report |
| GET | `/api/backup` | Download a SQL dump |
| POST | `/api/restore` | Restore from a SQL backup |

## P/L Calculation

Profit/Loss is calculated based on the combination of option type and buy/sell direction:

| Option Type | Buy/Sell | Direction |
|-------------|----------|-----------|
| CE (Call) | BUY | +1 |
| CE (Call) | SELL | -1 |
| PE (Put) | BUY | -1 |
| PE (Put) | SELL | +1 |

```
P/L per unit = direction × (exit_price − entry_price)
P/L total    = P/L per unit × quantity
% Returns    = (P/L per unit / entry_price) × 100
```
