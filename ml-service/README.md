# ML Service for Transaction Category Prediction

## Model Files

Place your trained model files in `app/weights/`:

- `model.pkl` - CatBoost classifier trained model
- `label_encoder.pkl` - Label encoder for category names (optional)

## Running the Service

### With Docker Compose

```bash
docker compose up ml-service
```

### Locally

```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Single Prediction
```bash
POST /predict
{
  "transactionDate": "2023-01-15",
  "refNo": "3.00E+11",
  "withdrawal": 100.0,
  "deposit": 0.0,
  "balance": 1500.0
}
```

### Batch Prediction
```bash
POST /predict/batch
[
  {
    "transactionDate": "2023-01-15",
    "refNo": "3.00E+11",
    "withdrawal": 100.0,
    "deposit": 0.0,
    "balance": 1500.0
  }
]
```

## Response Format

```json
{
  "category": "Food",
  "confidence": 0.95
}
```

