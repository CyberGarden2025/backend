from __future__ import annotations

from typing import Any

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.db import db
from app.llm import llm
from app.schemas import BIChartSpec, BIQueryRequest, BIQueryResponse


app = FastAPI(title="BI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _build_chart_spec(rows: list[dict[str, Any]]) -> BIChartSpec | None:
    if not rows:
        return None
    import pandas as pd

    df = pd.DataFrame(rows)
    if df.empty:
        return None
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
    if "transactionDate" in df.columns and numeric_cols:
        x = "transactionDate"
        y = numeric_cols[0]
        return BIChartSpec(
            chart_type="line",
            x=x,
            y=y,
            description=f"{y} over {x}",
        )
    if cat_cols and numeric_cols:
        x = cat_cols[0]
        y = numeric_cols[0]
        return BIChartSpec(
            chart_type="bar",
            x=x,
            y=y,
            description=f"{y} by {x}",
        )
    if numeric_cols:
        x = numeric_cols[0]
        return BIChartSpec(
            chart_type="histogram",
            x=x,
            description=f"Distribution of {x}",
        )
    return BIChartSpec(chart_type="table")


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "healthy",
        "tables": db.tables(),
        "llm_ready": llm.enabled,
    }


@app.post("/bi/query", response_model=BIQueryResponse)
async def bi_query(req: BIQueryRequest) -> BIQueryResponse:
    if not llm.enabled:
        raise HTTPException(
            status_code=503,
            detail="LLM is disabled: set GEMINI_API_KEY to enable BI queries",
        )
    try:
        schema_text = db.schema_summary_text()
        sql = llm.generate_sql(req.question, schema_text)
        df = db.execute_safe_select(sql, max_rows=req.max_rows)
        rows = df.to_dict(orient="records")
        chart = _build_chart_spec(rows)
        return BIQueryResponse(sql=sql, rows=rows, chart=chart)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc

