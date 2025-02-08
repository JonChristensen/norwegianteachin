import os
import secrets
from flask import Blueprint, redirect, url_for, session
from flask_login import login_user
from models import db, User
from authlib.integrations.flask_client import OAuth

# Create a Blueprint for authentication
auth_blueprint = Blueprint('auth', __name__)

# Initialize OAuth
oauth = OAuth()

def init_auth(app):
    oauth.init_app(app)
    
    auth0_domain = os.getenv("AUTH0_DOMAIN")
    auth0_client_id = os.getenv("AUTH0_CLIENT_ID")
    auth0_client_secret = os.getenv("AUTH0_CLIENT_SECRET")
    
    # Register the Auth0 client using the OIDC metadata URL.
    oauth.register(
        "auth0",
        client_id=auth0_client_id,
        client_secret=auth0_client_secret,
        client_kwargs={"scope": "openid profile email"},
        api_base_url=f'https://{auth0_domain}/',
        access_token_url=f'https://{auth0_domain}/oauth/token',
        authorize_url=f'https://{auth0_domain}/authorize',
        jwks_uri=f'https://{auth0_domain}/.well-known/jwks.json',
        server_metadata_url=f"https://{auth0_domain}/.well-known/openid-configuration"
    )

@auth_blueprint.route('/login')
def login():
    # Generate a nonce and store it in the session.
    nonce = secrets.token_urlsafe(16)
    session['nonce'] = nonce
    # Initiate the Auth0 authorization redirect, passing the nonce.
    auth0 = oauth.create_client('auth0')
    
    return oauth.auth0.authorize_redirect(
        redirect_uri=url_for('auth.callback', _external=True),
        nonce=nonce
    )

@auth_blueprint.route('/auth/callback')
def callback():
    auth0 = oauth.create_client('auth0')
    
    # Retrieve the token from Auth0.
    token = oauth.auth0.authorize_access_token()
    # Retrieve the nonce from the session.
    nonce = session.get('nonce')
    # Parse the ID token using the nonce.
    userinfo = auth0.get('userinfo').json()

    # Look up the user in your database using an identifier (for example, email).
    user = User.query.filter_by(email=userinfo.get('email')).first()
    if not user:
        user = User(email=userinfo.get('email'), name=userinfo.get('name'))
        db.session.add(user)
        db.session.commit()
    
    # Log the user in.
    login_user(user)
    
    # Optionally, remove the nonce from the session.
    session.pop('nonce', None)
    
    return redirect(url_for('main.index'))

@auth_blueprint.route('/logout')
def logout():
    session.clear()
    return redirect(
        f"https://{os.getenv('AUTH0_DOMAIN')}/v2/logout?returnTo={url_for('main.index', _external=True)}&client_id={os.getenv('AUTH0_CLIENT_ID')}"
    )
