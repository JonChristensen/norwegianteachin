import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key")
    
    # Get the database URL from DATABASE_URL if set, otherwise from HEROKU_POSTGRESQL_RED_URL.
    _db_url = os.getenv("DATABASE_URL") or os.getenv("HEROKU_POSTGRESQL_RED_URL")
    
    # If _db_url exists and starts with "postgres://", replace it with "postgresql://"
    if _db_url:
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
