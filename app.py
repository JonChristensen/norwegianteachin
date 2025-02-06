from flask import Flask
from models import db
from routes import main_blueprint
from dotenv import load_dotenv
load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///flashcards.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'your-secret-key'

    db.init_app(app)
    
    with app.app_context():
        db.create_all()  # create tables if they don't exist

    app.register_blueprint(main_blueprint)
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
