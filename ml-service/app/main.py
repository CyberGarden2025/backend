from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models.predictor import TransactionPredictor
from app.schemas.transaction import TransactionInput, TransactionOutput
from app.config import settings


app = FastAPI(title="Transaction Category Predictor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = TransactionPredictor()


@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": predictor.is_loaded()}


@app.post("/predict", response_model=TransactionOutput)
async def predict_category(transaction: TransactionInput):
    if not predictor.is_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        category = predictor.predict(transaction)
        confidence = predictor.get_confidence()
        return TransactionOutput(category=category, confidence=confidence)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch", response_model=list[TransactionOutput])
async def predict_categories_batch(transactions: list[TransactionInput]):
    if not predictor.is_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        results = []
        for transaction in transactions:
            category = predictor.predict(transaction)
            confidence = predictor.get_confidence()
            results.append(TransactionOutput(category=category, confidence=confidence))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

