import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key")
    
    # Define a local variable inside the class for the database URL
    _db_url = os.getenv("DATABASE_URL")
    
    if _db_url and "localhost" not in _db_url:
        SQLALCHEMY_DATABASE_URI = _db_url
    else:
        SQLALCHEMY_DATABASE_URI = os.getenv("HEROKU_POSTGRESQL_RED_URL")
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
