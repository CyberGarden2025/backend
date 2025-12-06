from datetime import date
from pydantic import BaseModel, Field


class FinancialData(BaseModel):
    user_id: int = Field(alias="userId")
    transactions: list[dict]
    current_balance: float = Field(alias="currentBalance")
    forecast_months: int = Field(default=3, alias="forecastMonths")
    
    class Config:
        populate_by_name = True


class BudgetAnalysis(BaseModel):
    total_income: float
    total_expenses: float
    average_monthly_income: float
    average_monthly_expenses: float
    mandatory_expenses: float
    discretionary_expenses: float


class FinancialCushion(BaseModel):
    current_cushion: float
    recommended_cushion: float
    months_covered: float
    status: str


class Recommendation(BaseModel):
    category: str
    current_spending: float
    recommended_spending: float
    savings_potential: float
    priority: str
    description: str


class ForecastPrediction(BaseModel):
    month: str
    predicted_balance: float
    predicted_income: float
    predicted_expenses: float
    confidence: float


class FinancialForecastOutput(BaseModel):
    budget_analysis: BudgetAnalysis
    financial_cushion: FinancialCushion
    forecast: list[ForecastPrediction]
    recommendations: list[Recommendation]
    budget_stability_score: float
    is_mock: bool

