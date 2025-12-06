from __future__ import annotations

from typing import Any

import pandas as pd
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine

from app.config import settings


class Database:
    def __init__(self) -> None:
        self.engine: Engine = create_engine(settings.database_url, pool_pre_ping=True)
        self._schema_cache: dict[str, list[dict[str, Any]]] = {}
        self._init_schema_cache()

    def _init_schema_cache(self) -> None:
        inspector = inspect(self.engine)
        for table in inspector.get_table_names():
            cols: list[dict[str, Any]] = []
            for col in inspector.get_columns(table):
                cols.append(
                    {
                        "name": col["name"],
                        "type": str(col["type"]),
                        "nullable": bool(col.get("nullable", True)),
                        "primary_key": bool(col.get("primary_key", False)),
                    }
                )
            self._schema_cache[table] = cols

    def schema_summary_text(self) -> str:
        parts: list[str] = []
        for table, cols in self._schema_cache.items():
            col_lines = [f"  - {c['name']} ({c['type']})" for c in cols]
            parts.append(f"Table {table}:\n" + "\n".join(col_lines))
        return "\n\n".join(parts)

    def execute_safe_select(self, sql: str, max_rows: int | None = None) -> pd.DataFrame:
        if not sql.strip().lower().startswith("select"):
            raise ValueError("Only SELECT queries are allowed")
        lower = sql.lower()
        forbidden = ("delete", "update", "insert", "drop", "truncate", "alter")
        if any(k in lower for k in forbidden):
            raise ValueError("Dangerous SQL detected")
        if " limit " not in lower and " offset " not in lower:
            limit = max_rows or settings.max_rows
            sql = f"{sql.rstrip(';')} LIMIT {limit}"
        with self.engine.connect() as conn:
            return pd.read_sql_query(text(sql), conn)

    def tables(self) -> list[str]:
        return list(self._schema_cache.keys())


db = Database()


