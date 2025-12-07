from typing import Any

import numpy as np
import pandas as pd
from catboost import CatBoostClassifier

from app.config import settings
from app.schemas.transaction import TransactionInput


class TransactionPredictor:
    def __init__(self) -> None:
        self.model: CatBoostClassifier | None = None
        self.feature_names: list[str] = []
        self.last_confidence: float = 0.0
        self._load_model()

    def _load_model(self) -> None:
        if not settings.model_exists:
            return
        try:
            model = CatBoostClassifier()
            model.load_model(str(settings.MODEL_PATH))
            self.model = model
            # CatBoost хранит имена фич, использованных при обучении
            self.feature_names = list(model.feature_names_) or []
            print(f"Loaded CatBoost model from {settings.MODEL_PATH}")
        except Exception as exc:  # noqa: BLE001
            print(f"Failed to load CatBoost model: {exc}")
            self.model = None
            self.feature_names = []

    def is_loaded(self) -> bool:
        return self.model is not None

    def _prepare_features(self, transaction: TransactionInput) -> pd.DataFrame:
        """Собираем фичи в том же пространстве, что и при обучении.

        Для всех фич, которые не можем восстановить онлайн (rolling/групповые),
        подставляем 0. Это лучше, чем ломать форму входа для CatBoost.
        """
        if not self.feature_names:
            # fallback к простому набору фич
            base = {
                "Withdrawal": float(transaction.withdrawal),
                "Deposit": float(transaction.deposit),
                "Balance": float(transaction.balance),
            }
            return pd.DataFrame([base])

        date = transaction.transaction_date
        withdrawal = float(transaction.withdrawal)
        deposit = float(transaction.deposit)
        balance = float(transaction.balance)
        amount = abs(withdrawal) + abs(deposit)
        signed_amount = deposit - withdrawal

        ref_no = transaction.ref_no or ""
        ref_group = ref_no[:6]
        ref_prefix = ref_no[:3]

        # Amount_Bin как в скрипте (биннинг по абсолютной сумме)
        if amount <= 50:
            amount_bin = 0
        elif amount <= 150:
            amount_bin = 1
        elif amount <= 500:
            amount_bin = 2
        elif amount <= 2000:
            amount_bin = 3
        else:
            amount_bin = 4

        row: dict[str, Any] = {}

        for name in self.feature_names:
            if name == "Withdrawal":
                row[name] = withdrawal
            elif name == "Deposit":
                row[name] = deposit
            elif name == "Balance":
                row[name] = balance
            elif name == "Amount":
                row[name] = amount
            elif name == "SignedAmount":
                row[name] = signed_amount
            elif name == "AbsAmount":
                row[name] = amount
            elif name == "day":
                row[name] = date.day
            elif name == "day_of_week":
                row[name] = date.weekday()
            elif name == "month":
                row[name] = date.month
            elif name == "quarter":
                row[name] = (date.month - 1) // 3 + 1
            elif name == "Is_Deposit":
                row[name] = 1 if deposit > 0 else 0
            elif name == "Is_Withdrawal":
                row[name] = 1 if withdrawal > 0 else 0
            elif name == "Log_Amount":
                row[name] = float(np.log1p(amount))
            elif name == "Sqrt_Amount":
                row[name] = float(np.sqrt(amount))
            elif name == "Cbrt_Amount":
                row[name] = float(np.cbrt(amount))
            elif name == "Amount_Squared":
                row[name] = float(amount**2)
            elif name == "Log_Balance":
                row[name] = float(np.log1p(balance if balance >= 0 else 0.0))
            elif name == "Amount_to_Balance":
                row[name] = float(amount / (balance + 1.0))
            elif name == "Log_Amount_to_Balance":
                ratio = amount / (balance + 1.0)
                row[name] = float(np.log1p(ratio))
            elif name == "Amount_Bin":
                row[name] = int(amount_bin)
            elif name == "Ref_Group":
                row[name] = ref_group
            elif name == "Ref_Prefix":
                row[name] = ref_prefix
            elif name in ("Signed_bin", "Abs_bin"):
                # Бины из qcut по датасету — онлайн не восстановить, даём заглушку
                row[name] = "0"
            else:
                # Все прочие (в т.ч. rolling/исторические) — безопасный дефолт
                row[name] = 0

        return pd.DataFrame([row])[self.feature_names]

    def predict(self, transaction: TransactionInput) -> str:
        if not self.is_loaded():
            return self._predict_mock(transaction)

        features = self._prepare_features(transaction)

        try:
            if hasattr(self.model, "predict_proba"):
                probas = self.model.predict_proba(features)
                self.last_confidence = float(np.max(probas))
            else:
                self.last_confidence = 1.0

            prediction = self.model.predict(features)
            # CatBoost возвращает np.ndarray; приводим к скаляру и строке,
            # чтобы не получить строку вида "['Food']"
            value = prediction[0]
            if isinstance(value, (np.ndarray, list, tuple)):
                value = value[0]
            return str(value)
        except Exception as exc:  # noqa: BLE001
            print(f"Prediction failed, falling back to mock: {exc}")
            return self._predict_mock(transaction)

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

