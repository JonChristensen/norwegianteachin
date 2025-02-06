# models.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Verb(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    norwegian = db.Column(db.String(80), unique=True, nullable=False)
    english_meanings = db.Column(db.String(200))  # comma-separated or JSON list
    past = db.Column(db.String(80))
    past_participle = db.Column(db.String(80))
    mnemonic = db.Column(db.String(250))
    correct_streak = db.Column(db.Integer, default=0)
    total_attempts = db.Column(db.Integer, default=0)       # NEW COLUMN
    correct_attempts = db.Column(db.Integer, default=0)       # NEW COLUMN
    last_reviewed = db.Column(db.DateTime, default=datetime.utcnow)
