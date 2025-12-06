from __future__ import annotations

from typing import Any

import google.generativeai as genai

from app.config import settings


class LLMClient:
    def __init__(self) -> None:
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is required for BI service")
        genai.configure(api_key=settings.gemini_api_key)
        model_name = settings.llm_model.replace("models/", "")
        self._model: Any = genai.GenerativeModel(model_name)

    def generate_sql(self, question: str, schema_text: str) -> str:
        prompt = (
            "You are an expert PostgreSQL analyst. "
            "Use only the provided schema. "
            "Generate a single safe SELECT query with LIMIT, no comments.\n\n"
            f"Database schema:\n{schema_text}\n\n"
            f"Question:\n{question}\n\n"
            "Return only the SQL."
        )
        res = self._model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,
                "max_output_tokens": 512,
                "top_p": 0.9,
                "top_k": 40,
            },
        )
        text = (res.text or "").strip()
        if "```" in text:
            start = text.find("```")
            end = text.rfind("```")
            if end > start:
                code = text[start + 3 : end]
                if code.lstrip().lower().startswith("sql"):
                    code = code.split("\n", 1)[1]
                text = code.strip()
        return text.rstrip(";").strip()


llm = LLMClient()


