# config.py
import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key")
    
    if DATABASE_URL and "localhost" not in DATABASE_URL:
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    else:
        SQLALCHEMY_DATABASE_URI = os.getenv("HEROKU_POSTGRESQL_RED_URL")
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False

