from pathlib import Path


class Settings:
    MODEL_PATH: Path = Path(__file__).parent / "weights" / "model.pkl"
    LABEL_ENCODER_PATH: Path = Path(__file__).parent / "weights" / "label_encoder.pkl"
    FORECAST_MODEL_PATH: Path = Path(__file__).parent / "weights" / "forecast_model.pkl"
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    
    @property
    def model_exists(self) -> bool:
        return self.MODEL_PATH.exists()
    
    @property
    def label_encoder_exists(self) -> bool:
        return self.LABEL_ENCODER_PATH.exists()
    
    @property
    def forecast_model_exists(self) -> bool:
        return self.FORECAST_MODEL_PATH.exists()


settings = Settings()

