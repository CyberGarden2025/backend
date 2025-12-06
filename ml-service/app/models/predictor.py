import joblib
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from app.config import settings
from app.schemas.transaction import TransactionInput


class TransactionPredictor:
    def __init__(self):
        self.model: Any = None
        self.label_encoder: Any = None
        self.last_confidence: float = 0.0
        self._load_model()
    
    def _load_model(self) -> None:
        if settings.model_exists:
            try:
                self.model = joblib.load(settings.MODEL_PATH)
            except Exception as e:
                print(f"Failed to load model: {e}")
                self.model = None
        
        if settings.label_encoder_exists:
            try:
                self.label_encoder = joblib.load(settings.LABEL_ENCODER_PATH)
            except Exception as e:
                print(f"Failed to load label encoder: {e}")
                self.label_encoder = None
    
    def is_loaded(self) -> bool:
        return self.model is not None
    
    def _prepare_features(self, transaction: TransactionInput) -> pd.DataFrame:
        features = {
            "Withdrawal": transaction.withdrawal,
            "Deposit": transaction.deposit,
            "Balance": transaction.balance,
            "Month": transaction.transaction_date.month,
            "Day": transaction.transaction_date.day,
            "DayOfWeek": transaction.transaction_date.weekday(),
        }
        return pd.DataFrame([features])
    
    def predict(self, transaction: TransactionInput) -> str:
        if not self.is_loaded():
            return self._predict_mock(transaction)
        
        features = self._prepare_features(transaction)
        
        if hasattr(self.model, "predict_proba"):
            probas = self.model.predict_proba(features)
            self.last_confidence = float(np.max(probas))
        else:
            self.last_confidence = 1.0
        
        prediction = self.model.predict(features)
        
        if self.label_encoder is not None:
            category = self.label_encoder.inverse_transform([prediction[0]])[0]
            return str(category)
        
        return str(prediction[0])
    
    def _predict_mock(self, transaction: TransactionInput) -> str:
        self.last_confidence = 0.60
        
        if transaction.withdrawal > 0:
            if transaction.withdrawal > 1000:
                return "Rent"
            elif transaction.withdrawal > 500:
                return "Shopping"
            elif transaction.withdrawal > 100:
                return "Food"
            else:
                return "Misc"
        elif transaction.deposit > 0:
            if transaction.deposit > 5000:
                return "Salary"
            else:
                return "Income"
        
        return "Unknown"
    
    def get_confidence(self) -> float:
        return self.last_confidence

