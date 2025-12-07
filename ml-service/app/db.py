from typing import List, Tuple, Dict

import psycopg2
from psycopg2.extras import RealDictCursor

from app.config import settings


def _get_connection():
    return psycopg2.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
    )


def get_user_transactions_and_balance(
    user_id: str,
    limit: int = 200,
) -> Tuple[List[Dict], float]:
    """Fetch recent transactions and current balance for a user from Postgres."""
    transactions: List[Dict] = []
    current_balance: float = 0.0

    with _get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    "transactionDate" AS "transactionDate",
                    category,
                    "refNo" AS "refNo",
                    withdrawal,
                    deposit,
                    balance
                FROM transactions
                WHERE "userId" = %s
                ORDER BY "transactionDate" DESC, id DESC
                LIMIT %s
                """,
                (user_id, limit),
            )
            rows = cur.fetchall()

    if not rows:
        return [], 0.0

    # Use the most recent balance as current balance
    last_row = rows[0]
    balance_value = last_row.get("balance")
    current_balance = float(balance_value) if balance_value is not None else 0.0

    # Return transactions in chronological order for better time-series analysis
    for row in reversed(rows):
        date_value = row.get("transactionDate")
        if hasattr(date_value, "isoformat"):
            transaction_date = date_value.isoformat()
        else:
            transaction_date = str(date_value) if date_value is not None else ""

        transactions.append(
            {
                "transactionDate": transaction_date,
                "category": row.get("category") or "",
                "refNo": row.get("refNo"),
                "withdrawal": float(row.get("withdrawal") or 0),
                "deposit": float(row.get("deposit") or 0),
                "balance": float(row.get("balance") or 0),
            }
        )

    return transactions, current_balance


