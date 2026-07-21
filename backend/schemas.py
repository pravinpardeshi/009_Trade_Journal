from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class TradeCreate(BaseModel):
    entry_date: date
    exit_date: Optional[date] = None
    scrip_name: str
    option_type: Optional[str] = None
    buy_sell: str
    entry_price: float
    exit_price: Optional[float] = None
    quantity: int
    customer_name: Optional[str] = None
    notes: Optional[str] = None


class TradeResponse(BaseModel):
    id: int
    entry_date: date
    exit_date: Optional[date] = None
    scrip_name: str
    option_type: Optional[str] = None
    buy_sell: str
    entry_price: float
    exit_price: Optional[float] = None
    profit_loss_per_unit: Optional[float] = None
    quantity: int
    profit_loss_total: Optional[float] = None
    returns_percent: Optional[float] = None
    customer_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReportRow(BaseModel):
    period: str
    total_trades: int
    winning_trades: int
    losing_trades: int
    total_pl: float
    period_return_pct: Optional[float] = None
    total_quantity: int
    period_start_date: Optional[str] = None
    period_end_date: Optional[str] = None
