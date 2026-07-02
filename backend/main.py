import subprocess
from datetime import date, datetime
from pathlib import Path
from typing import List, Optional
from urllib.parse import urlparse

from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, case
from sqlalchemy.orm import Session

from database import DATABASE_URL, engine, Base, get_db
from models import Trade
from schemas import TradeCreate, TradeResponse, ReportRow

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Trading Journal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
def serve_index():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/reports/weekly", response_model=List[ReportRow])
def weekly_report(db: Session = Depends(get_db)):
    rows = (
        db.query(
            func.date_trunc("week", Trade.entry_date).label("period"),
            func.count(Trade.id).label("total_trades"),
            func.sum(case((Trade.profit_loss_total > 0, 1), else_=0)).label("winning_trades"),
            func.sum(case((Trade.profit_loss_total < 0, 1), else_=0)).label("losing_trades"),
            func.coalesce(func.sum(Trade.profit_loss_total), 0).label("total_pl"),
            func.coalesce(func.sum(Trade.entry_price * Trade.quantity), 0).label("total_investment"),
            func.coalesce(func.sum(Trade.quantity), 0).label("total_quantity"),
        )
        .group_by("period")
        .order_by(func.date_trunc("week", Trade.entry_date).desc())
        .all()
    )
    return [
        ReportRow(
            period=r.period.strftime("%Y-W%V") if r.period else "",
            total_trades=r.total_trades,
            winning_trades=r.winning_trades,
            losing_trades=r.losing_trades,
            total_pl=round(r.total_pl, 2),
            period_return_pct=round((r.total_pl / r.total_investment) * 100, 2) if r.total_investment else None,
            total_quantity=r.total_quantity,
        )
        for r in rows
    ]


@app.get("/api/reports/monthly", response_model=List[ReportRow])
def monthly_report(db: Session = Depends(get_db)):
    rows = (
        db.query(
            func.date_trunc("month", Trade.entry_date).label("period"),
            func.count(Trade.id).label("total_trades"),
            func.sum(case((Trade.profit_loss_total > 0, 1), else_=0)).label("winning_trades"),
            func.sum(case((Trade.profit_loss_total < 0, 1), else_=0)).label("losing_trades"),
            func.coalesce(func.sum(Trade.profit_loss_total), 0).label("total_pl"),
            func.coalesce(func.sum(Trade.entry_price * Trade.quantity), 0).label("total_investment"),
            func.coalesce(func.sum(Trade.quantity), 0).label("total_quantity"),
        )
        .group_by("period")
        .order_by(func.date_trunc("month", Trade.entry_date).desc())
        .all()
    )
    return [
        ReportRow(
            period=r.period.strftime("%Y-%m") if r.period else "",
            total_trades=r.total_trades,
            winning_trades=r.winning_trades,
            losing_trades=r.losing_trades,
            total_pl=round(r.total_pl, 2),
            period_return_pct=round((r.total_pl / r.total_investment) * 100, 2) if r.total_investment else None,
            total_quantity=r.total_quantity,
        )
        for r in rows
    ]


@app.get("/api/backup")
def backup_database():
    parsed = urlparse(DATABASE_URL)
    dbname = parsed.path.lstrip("/")
    user = parsed.username
    password = parsed.password
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432

    cmd = [
        "pg_dump",
        "--dbname", DATABASE_URL,
        "--format", "p",
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-acl",
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {e.stderr}")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="pg_dump not found. Install PostgreSQL client tools.")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"trading_journal_backup_{timestamp}.sql"

    return StreamingResponse(
        iter([result.stdout]),
        media_type="application/sql",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/api/restore")
def restore_database(file: UploadFile = File(...)):
    if not file.filename.endswith(".sql"):
        raise HTTPException(status_code=400, detail="Only .sql files are accepted")

    content = file.file.read().decode("utf-8")
    content = "DROP TABLE IF EXISTS public.trades CASCADE;\n" + content

    try:
        result = subprocess.run(
            ["psql", DATABASE_URL],
            input=content,
            capture_output=True,
            text=True,
            check=True,
        )
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Restore failed: {e.stderr}")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="psql not found. Install PostgreSQL client tools.")

    return {"message": "Database restored successfully"}


@app.post("/api/trades", response_model=TradeResponse)
def create_trade(trade: TradeCreate, db: Session = Depends(get_db)):
    direction = 1 if (trade.buy_sell == "BUY" and trade.option_type in ("CE", None, "")) or (trade.buy_sell == "SELL" and trade.option_type == "PE") else -1
    pl_per_unit = round(direction * (trade.exit_price - trade.entry_price), 2)
    pl_total = round(pl_per_unit * trade.quantity, 2)
    returns_pct = round((pl_per_unit / trade.entry_price) * 100, 2)

    db_trade = Trade(
        entry_date=trade.entry_date,
        exit_date=trade.exit_date,
        scrip_name=trade.scrip_name,
        option_type=trade.option_type,
        buy_sell=trade.buy_sell,
        entry_price=trade.entry_price,
        exit_price=trade.exit_price,
        profit_loss_per_unit=pl_per_unit,
        quantity=trade.quantity,
        profit_loss_total=pl_total,
        returns_percent=returns_pct,
        customer_name=trade.customer_name,
        notes=trade.notes,
    )
    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)
    return db_trade


@app.put("/api/trades/{trade_id}", response_model=TradeResponse)
def update_trade(trade_id: int, trade: TradeCreate, db: Session = Depends(get_db)):
    db_trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not db_trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    direction = 1 if (trade.buy_sell == "BUY" and trade.option_type in ("CE", None, "")) or (trade.buy_sell == "SELL" and trade.option_type == "PE") else -1
    pl_per_unit = round(direction * (trade.exit_price - trade.entry_price), 2)
    pl_total = round(pl_per_unit * trade.quantity, 2)
    returns_pct = round((pl_per_unit / trade.entry_price) * 100, 2)

    db_trade.entry_date = trade.entry_date
    db_trade.exit_date = trade.exit_date
    db_trade.scrip_name = trade.scrip_name
    db_trade.option_type = trade.option_type
    db_trade.buy_sell = trade.buy_sell
    db_trade.entry_price = trade.entry_price
    db_trade.exit_price = trade.exit_price
    db_trade.profit_loss_per_unit = pl_per_unit
    db_trade.quantity = trade.quantity
    db_trade.profit_loss_total = pl_total
    db_trade.returns_percent = returns_pct
    db_trade.customer_name = trade.customer_name
    db_trade.notes = trade.notes

    db.commit()
    db.refresh(db_trade)
    return db_trade


@app.get("/api/trades", response_model=List[TradeResponse])
def list_trades(
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    customer: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Trade)
    if from_date:
        query = query.filter(Trade.entry_date >= from_date)
    if to_date:
        query = query.filter(Trade.entry_date <= to_date)
    if customer:
        query = query.filter(Trade.customer_name.ilike(f"%{customer}%"))
    if search:
        query = query.filter(
            Trade.scrip_name.ilike(f"%{search}%")
            | Trade.notes.ilike(f"%{search}%")
            | Trade.customer_name.ilike(f"%{search}%")
        )
    return query.order_by(Trade.entry_date.desc()).all()


@app.get("/api/trades/{trade_id}", response_model=TradeResponse)
def get_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    return trade


@app.delete("/api/trades/{trade_id}", status_code=204)
def delete_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    db.delete(trade)
    db.commit()
