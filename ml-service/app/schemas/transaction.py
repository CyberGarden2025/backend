from datetime import date
from pydantic import BaseModel, Field


class TransactionInput(BaseModel):
    transaction_date: date = Field(alias="transactionDate")
    ref_no: str | None = Field(default=None, alias="refNo")
    withdrawal: float
    deposit: float
    balance: float
    
    class Config:
        populate_by_name = True


class TransactionOutput(BaseModel):
    category: str
    confidence: float

