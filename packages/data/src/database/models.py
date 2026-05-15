from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import BigInteger, Column, Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True)
    corpCode = Column("corpCode", String(8), unique=True, nullable=False)
    corpName = Column("corpName", String, nullable=False)
    stockCode = Column("stockCode", String(6), unique=True, nullable=True)
    indutyCode = Column("indutyCode", String, nullable=True)
    indutyName = Column("indutyName", String, nullable=True)
    sector = Column("sector", String, nullable=True)
    market = Column("market", String, nullable=True)
    ceoName = Column("ceoName", String, nullable=True)
    createdAt = Column("createdAt", DateTime, default=datetime.utcnow)
    updatedAt = Column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    financials = relationship("FinancialStatement", back_populates="company", lazy="dynamic")
    stock_prices = relationship("StockPrice", back_populates="company", lazy="dynamic")
    stock_metrics = relationship("StockMetrics", back_populates="company", lazy="dynamic")


class FinancialStatement(Base):
    __tablename__ = "financial_statements"
    __table_args__ = (
        UniqueConstraint("companyId", "year", "quarter", "reportType", name="financial_statements_companyId_year_quarter_reportType_key"),
    )

    id = Column(String, primary_key=True)
    companyId = Column("companyId", String, ForeignKey("companies.id"), nullable=False)
    year = Column("year", Integer, nullable=False)
    quarter = Column("quarter", Integer, nullable=True)
    reportType = Column("reportType", String, nullable=False)

    revenue = Column("revenue", BigInteger, nullable=True)
    operatingProfit = Column("operatingProfit", BigInteger, nullable=True)
    netIncome = Column("netIncome", BigInteger, nullable=True)
    totalAssets = Column("totalAssets", BigInteger, nullable=True)
    totalLiability = Column("totalLiability", BigInteger, nullable=True)
    totalEquity = Column("totalEquity", BigInteger, nullable=True)

    revenueGrowthRate = Column("revenueGrowthRate", Float, nullable=True)
    operatingMargin = Column("operatingMargin", Float, nullable=True)
    debtRatio = Column("debtRatio", Float, nullable=True)
    roe = Column("roe", Float, nullable=True)
    roa = Column("roa", Float, nullable=True)

    fetchedAt = Column("fetchedAt", DateTime, default=datetime.utcnow)
    updatedAt = Column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company", back_populates="financials")


class StockPrice(Base):
    __tablename__ = "stock_prices"
    __table_args__ = (
        UniqueConstraint("companyId", "date", name="stock_prices_companyId_date_key"),
    )

    id = Column(String, primary_key=True)
    companyId = Column("companyId", String, ForeignKey("companies.id"), nullable=False)
    date = Column("date", Date, nullable=False)
    open = Column("open", Integer, nullable=False)
    high = Column("high", Integer, nullable=False)
    low = Column("low", Integer, nullable=False)
    close = Column("close", Integer, nullable=False)
    volume = Column("volume", BigInteger, nullable=False)
    changeRate = Column("changeRate", Float, nullable=True)

    company = relationship("Company", back_populates="stock_prices")


class StockMetrics(Base):
    __tablename__ = "stock_metrics"
    __table_args__ = (
        UniqueConstraint("companyId", "calcDate", name="stock_metrics_companyId_calcDate_key"),
    )

    id = Column(String, primary_key=True)
    companyId = Column("companyId", String, ForeignKey("companies.id"), nullable=False)
    calcDate = Column("calcDate", Date, nullable=False)

    currentPrice = Column("currentPrice", Integer, nullable=True)
    priceChange = Column("priceChange", Float, nullable=True)

    volatility20d = Column("volatility20d", Float, nullable=True)
    volatility60d = Column("volatility60d", Float, nullable=True)

    momentum1m = Column("momentum1m", Float, nullable=True)
    momentum3m = Column("momentum3m", Float, nullable=True)
    momentum6m = Column("momentum6m", Float, nullable=True)

    ma20 = Column("ma20", Float, nullable=True)
    ma60 = Column("ma60", Float, nullable=True)
    ma120 = Column("ma120", Float, nullable=True)

    avgVolume20d = Column("avgVolume20d", BigInteger, nullable=True)
    updatedAt = Column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company", back_populates="stock_metrics")
