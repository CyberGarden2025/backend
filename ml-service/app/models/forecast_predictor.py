import joblib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from app.config import settings
from app.schemas.forecast import (
    FinancialData,
    BudgetAnalysis,
    FinancialCushion,
    Recommendation,
    ForecastPrediction,
    FinancialForecastOutput,
)


class FinancialForecastPredictor:
    def __init__(self):
        self.model: Any = None
        self._load_model()
    
    def _load_model(self) -> None:
        if settings.forecast_model_exists:
            try:
                self.model = joblib.load(settings.FORECAST_MODEL_PATH)
            except Exception as e:
                print(f"Failed to load forecast model: {e}")
                self.model = None
    
    def is_loaded(self) -> bool:
        return self.model is not None
    
    def predict(self, data: FinancialData) -> FinancialForecastOutput:
        if self.is_loaded():
            return self._predict_with_model(data)
        return self._predict_mock(data)
    
    def _predict_with_model(self, data: FinancialData) -> FinancialForecastOutput:
        df = pd.DataFrame(data.transactions)
        
        budget_analysis = self._analyze_budget(df)
        financial_cushion = self._calculate_cushion(
            data.current_balance,
            budget_analysis.average_monthly_expenses
        )
        forecast = self._generate_forecast_with_model(df, data.forecast_months)
        recommendations = self._generate_recommendations(df, budget_analysis)
        stability_score = self._calculate_stability_score(budget_analysis, financial_cushion)
        
        return FinancialForecastOutput(
            budget_analysis=budget_analysis,
            financial_cushion=financial_cushion,
            forecast=forecast,
            recommendations=recommendations,
            budget_stability_score=stability_score,
            is_mock=False,
        )
    
    def _predict_mock(self, data: FinancialData) -> FinancialForecastOutput:
        df = pd.DataFrame(data.transactions)
        
        budget_analysis = self._analyze_budget(df)
        financial_cushion = self._calculate_cushion(
            data.current_balance,
            budget_analysis.average_monthly_expenses
        )
        forecast = self._generate_mock_forecast(
            budget_analysis,
            data.current_balance,
            data.forecast_months
        )
        recommendations = self._generate_recommendations(df, budget_analysis)
        stability_score = self._calculate_stability_score(budget_analysis, financial_cushion)
        
        return FinancialForecastOutput(
            budget_analysis=budget_analysis,
            financial_cushion=financial_cushion,
            forecast=forecast,
            recommendations=recommendations,
            budget_stability_score=stability_score,
            is_mock=True,
        )
    
    def _analyze_budget(self, df: pd.DataFrame) -> BudgetAnalysis:
        total_income = df[df["deposit"] > 0]["deposit"].sum()
        total_expenses = df[df["withdrawal"] > 0]["withdrawal"].sum()
        
        months_count = max(len(df) / 30, 1)
        avg_monthly_income = total_income / months_count
        avg_monthly_expenses = total_expenses / months_count
        
        mandatory_categories = ["Rent", "Utilities", "Insurance"]
        mandatory = df[
            (df["category"].isin(mandatory_categories)) & (df["withdrawal"] > 0)
        ]["withdrawal"].sum() / months_count
        
        discretionary = avg_monthly_expenses - mandatory
        
        return BudgetAnalysis(
            total_income=round(total_income, 2),
            total_expenses=round(total_expenses, 2),
            average_monthly_income=round(avg_monthly_income, 2),
            average_monthly_expenses=round(avg_monthly_expenses, 2),
            mandatory_expenses=round(mandatory, 2),
            discretionary_expenses=round(discretionary, 2),
        )
    
    def _calculate_cushion(
        self,
        current_balance: float,
        avg_monthly_expenses: float
    ) -> FinancialCushion:
        months_covered = current_balance / avg_monthly_expenses if avg_monthly_expenses > 0 else 0
        recommended = avg_monthly_expenses * 6
        
        if months_covered >= 6:
            status = "Excellent"
        elif months_covered >= 3:
            status = "Good"
        elif months_covered >= 1:
            status = "Fair"
        else:
            status = "Critical"
        
        return FinancialCushion(
            current_cushion=round(current_balance, 2),
            recommended_cushion=round(recommended, 2),
            months_covered=round(months_covered, 2),
            status=status,
        )
    
    def _generate_mock_forecast(
        self,
        analysis: BudgetAnalysis,
        current_balance: float,
        months: int
    ) -> list[ForecastPrediction]:
        forecasts = []
        balance = current_balance
        
        income_trend = 1.02
        expense_trend = 1.01
        
        for i in range(1, months + 1):
            predicted_income = analysis.average_monthly_income * (income_trend ** i)
            predicted_expenses = analysis.average_monthly_expenses * (expense_trend ** i)
            balance = balance + predicted_income - predicted_expenses
            
            month_date = datetime.now() + timedelta(days=30 * i)
            
            forecasts.append(ForecastPrediction(
                month=month_date.strftime("%Y-%m"),
                predicted_balance=round(balance, 2),
                predicted_income=round(predicted_income, 2),
                predicted_expenses=round(predicted_expenses, 2),
                confidence=0.75,
            ))
        
        return forecasts
    
    def _generate_forecast_with_model(
        self,
        df: pd.DataFrame,
        months: int
    ) -> list[ForecastPrediction]:
        return []
    
    def _generate_recommendations(
        self,
        df: pd.DataFrame,
        analysis: BudgetAnalysis
    ) -> list[Recommendation]:
        recommendations = []
        
        category_spending = df[df["withdrawal"] > 0].groupby("category")["withdrawal"].sum()
        
        for category, amount in category_spending.items():
            if category in ["Rent", "Utilities", "Insurance"]:
                continue
            
            if amount > analysis.average_monthly_income * 0.15:
                reduction = amount * 0.2
                recommendations.append(Recommendation(
                    category=category,
                    current_spending=round(amount, 2),
                    recommended_spending=round(amount - reduction, 2),
                    savings_potential=round(reduction, 2),
                    priority="High" if amount > analysis.average_monthly_income * 0.25 else "Medium",
                    description=f"Reduce {category} spending by 20% to improve financial stability",
                ))
        
        if analysis.average_monthly_income > analysis.average_monthly_expenses:
            surplus = analysis.average_monthly_income - analysis.average_monthly_expenses
            recommendations.append(Recommendation(
                category="Savings",
                current_spending=0,
                recommended_spending=round(surplus * 0.5, 2),
                savings_potential=round(surplus * 0.5, 2),
                priority="High",
                description="Allocate surplus income to emergency fund and savings",
            ))
        
        return recommendations
    
    def _calculate_stability_score(
        self,
        analysis: BudgetAnalysis,
        cushion: FinancialCushion
    ) -> float:
        income_expense_ratio = (
            analysis.average_monthly_income / analysis.average_monthly_expenses
            if analysis.average_monthly_expenses > 0 else 1
        )
        
        ratio_score = min(income_expense_ratio / 1.5, 1.0) * 40
        cushion_score = min(cushion.months_covered / 6, 1.0) * 40
        discretionary_ratio = (
            analysis.discretionary_expenses / analysis.average_monthly_expenses
            if analysis.average_monthly_expenses > 0 else 0
        )
        flexibility_score = discretionary_ratio * 20
        
        total_score = ratio_score + cushion_score + flexibility_score
        
        return round(min(total_score, 100), 2)

