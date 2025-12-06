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
            return "Unknown"
        
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
    
    def get_confidence(self) -> float:
        return self.last_confidence

