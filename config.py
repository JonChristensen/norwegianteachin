# config.py
import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key")
    
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://flashcards_user:your_secure_password@localhost/flashcards"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

