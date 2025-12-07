from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models.predictor import TransactionPredictor
from app.models.forecast_predictor import FinancialForecastPredictor
from app.schemas.transaction import TransactionInput, TransactionOutput
from app.schemas.forecast import (
    FinancialData,
    FinancialForecastOutput,
    UserForecastRequest,
)
from app.config import settings
from app.db import get_user_transactions_and_balance


app = FastAPI(title="Financial ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = TransactionPredictor()
forecast_predictor = FinancialForecastPredictor()


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "category_model_loaded": predictor.is_loaded(),
        "forecast_model_loaded": forecast_predictor.is_loaded(),
    }


@app.post("/predict", response_model=TransactionOutput)
async def predict_category(transaction: TransactionInput):
    try:
        category = predictor.predict(transaction)
        confidence = predictor.get_confidence()
        return TransactionOutput(category=category, confidence=confidence)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch", response_model=list[TransactionOutput])
async def predict_categories_batch(transactions: list[TransactionInput]):
    try:
        results = []
        for transaction in transactions:
            category = predictor.predict(transaction)
            confidence = predictor.get_confidence()
            results.append(TransactionOutput(category=category, confidence=confidence))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/forecast", response_model=FinancialForecastOutput)
async def financial_forecast(request: UserForecastRequest):
    try:
        transactions, current_balance = get_user_transactions_and_balance(request.user_id)

        data = FinancialData(
            userId=request.user_id,
            transactions=transactions,
            currentBalance=current_balance,
            forecastMonths=request.forecast_months,
        )

        forecast = forecast_predictor.predict(data)
        return forecast
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

