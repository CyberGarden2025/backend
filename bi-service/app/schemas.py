from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class BIQueryRequest(BaseModel):
    question: str
    max_rows: int | None = Field(default=None, ge=1, le=1000)


class BIChartSpec(BaseModel):
    chart_type: str
    x: str | None = None
    y: str | None = None
    series: str | None = None
    description: str | None = None


class BIQueryResponse(BaseModel):
    sql: str
    rows: list[dict[str, Any]]
    chart: BIChartSpec | None


