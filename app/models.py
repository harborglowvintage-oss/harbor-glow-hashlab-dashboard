"""Pydantic models and application settings."""
from typing import Optional
from pydantic import BaseModel, Field, EmailStr, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Load configuration from environment variables and .env file."""
    app_name: str = "FastAPI Starter"
    app_version: str = "0.1.0"
    welcome_message: str = "Welcome to the FastAPI starter project."

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


class Item(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(
        None, max_length=500, description="Short description of the item"
    )
    price: float = Field(gt=0)
    email: EmailStr


class ItemResponse(BaseModel):
    success: bool = True
    message: str
    item: Item


settings = Settings()
