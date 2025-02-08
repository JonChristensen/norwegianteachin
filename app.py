from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from models import db, User
from routes import main_blueprint  # Import blueprint
from auth import auth_blueprint, init_auth

from dotenv import load_dotenv
# Load environment variables from .env file
load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")

    db.init_app(app)
    migrate = Migrate(app, db)

    login_manager = LoginManager()
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Initialize OAuth authentication
    init_auth(app)

    # Register blueprints
    app.register_blueprint(main_blueprint)
    app.register_blueprint(auth_blueprint)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
