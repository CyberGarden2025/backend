import os
from pydantic import BaseModel


class Settings(BaseModel):
    db_user: str = os.getenv("DB_USER", "postgres")
    db_password: str = os.getenv("DB_PASSWORD", "postgres")
    db_name: str = os.getenv("DB_NAME", "cybergarden")
    db_host: str = os.getenv("BI_DB_HOST", "pg")
    db_port: str = os.getenv("BI_DB_PORT", "5432")
    gemini_api_key: str | None = os.getenv("GEMINI_API_KEY")
    llm_model: str = os.getenv("BI_LLM_MODEL", "gemini-1.5-pro")
    max_rows: int = int(os.getenv("BI_MAX_ROWS", "200"))

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )


settings = Settings()


