import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key")
    
    # Define a local variable inside the class
    _database_url = os.getenv("DATABASE_URL")
    
    if _database_url and "localhost" not in _database_url:
        SQLALCHEMY_DATABASE_URI = _database_url
    else:
        SQLALCHEMY_DATABASE_URI = os.getenv("HEROKU_POSTGRESQL_RED_URL")
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
