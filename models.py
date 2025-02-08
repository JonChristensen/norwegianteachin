from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

# Global Verb model (the list of verbs and their static data)
class Verb(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    norwegian = db.Column(db.String(80), unique=True, nullable=False)
    english_meanings = db.Column(db.String(200))  # e.g., "to make, to do"
    past = db.Column(db.String(80))
    past_participle = db.Column(db.String(80))
    mnemonic = db.Column(db.String(250))
    last_reviewed = db.Column(db.DateTime, default=datetime.utcnow)
    # No longer storing progress directly in the Verb model.

# User model for multi-user support.
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    # Use a field that maps to the external auth provider (e.g., Auth0, Firebase, etc.)
    auth_provider_id = db.Column(db.String(100), unique=True, nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Relationship to track progress on verbs.
    progress = db.relationship('UserVerbProgress', backref='user', lazy=True)

# Model to track each user's progress for each verb.
class UserVerbProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    verb_id = db.Column(db.Integer, db.ForeignKey('verb.id'), nullable=False)
    total_attempts = db.Column(db.Integer, default=0)
    correct_attempts = db.Column(db.Integer, default=0)
    last_reviewed = db.Column(db.DateTime, default=datetime.utcnow)
    # Optional: a correct streak field, etc.
    # Create a relationship back to the Verb (optional, for easier access)
    verb = db.relationship('Verb', backref='progress_entries')
