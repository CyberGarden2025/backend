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


class SuggestedQuery(BaseModel):
    label: str
    question: str


class BIChatRequest(BaseModel):
    question: str | None = None
    max_rows: int | None = Field(default=None, ge=1, le=1000)


class BIChatResponse(BaseModel):
    answer: str
    sql: str | None = None
    rows: list[dict[str, Any]] = Field(default_factory=list)
    chart: BIChartSpec | None = None
    suggested_queries: list[SuggestedQuery] = Field(default_factory=list)


