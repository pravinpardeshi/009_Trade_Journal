from sqlalchemy import Column, Integer, String, Float, Date, Text
from database import Base


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    entry_date = Column(Date, nullable=False)
    exit_date = Column(Date, nullable=True)
    scrip_name = Column(String(255), nullable=False)
    option_type = Column(String(10), nullable=True)
    buy_sell = Column(String(10), nullable=False)
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float, nullable=True)
    profit_loss_per_unit = Column(Float, nullable=True)
    quantity = Column(Integer, nullable=False)
    profit_loss_total = Column(Float, nullable=True)
    returns_percent = Column(Float, nullable=True)
    customer_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
