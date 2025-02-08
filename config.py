import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key")
    
    # Get the DATABASE_URL from the environment or fall back to HEROKU_POSTGRESQL_RED_URL
    _db_url = os.getenv("DATABASE_URL") or os.getenv("HEROKU_POSTGRESQL_RED_URL")
    
    # If the URL starts with "postgres://", replace it with "postgresql://"
    if _db_url and _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
