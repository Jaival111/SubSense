from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, HTMLResponse
import httpx
import models, auth
from typing import Annotated
from sqlalchemy.orm import Session
from database import SessionLocal
from dotenv import load_dotenv
import os
import secrets
load_dotenv()

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")

router = APIRouter(prefix="/api/spotify", tags=["spotify"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

@router.get("/login")
def login():
    scope = "user-read-private user-read-email user-read-currently-playing user-read-playback-state"
    state = secrets.token_urlsafe(32)
    auth_url = (
        f"https://accounts.spotify.com/authorize?client_id={CLIENT_ID}&response_type=code&redirect_uri={REDIRECT_URI}&scope={scope}&state={state}"
    )
    return RedirectResponse(auth_url)

@router.get("/callback")
async def callback(request: Request, db: db_dependency):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Authorization failed")
    
    token_url = "https://accounts.spotify.com/api/token"
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }

    async with httpx.AsyncClient() as client:
        # Get access token
        response = await client.post(token_url, data=data)
        token_data = response.json()
        
        if "error" in token_data:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        # Get user profile
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}
        profile_response = await client.get("https://api.spotify.com/v1/me", headers=headers)
        profile_data = profile_response.json()
        
        # Find user by email
        user = db.query(models.User).filter(models.User.email == profile_data['email']).first()
        if not user:
            # Create new user if not exists
            user = models.User(
                name=profile_data['display_name'],
                email=profile_data['email'],
                password="",  # You might want to handle this differently
            )
            db.add(user)
        
        # Store tokens in database
        user.spotify_access_token = token_data['access_token']
        user.spotify_refresh_token = token_data['refresh_token']
        user.spotify_token_expires_at = token_data['expires_in']
        db.commit()
        
        # Create JWT token for the user
        access_token = auth.create_access_token(data={"sub": user.email})
        
        # Return HTML that will close the popup and send the token to the parent window
        html_content = f"""
        <html>
            <body>
                <script>
                    window.opener.postMessage({{ 
                        type: 'spotify-auth-success',
                        token: '{access_token}'
                    }}, '*');
                    window.close();
                </script>
            </body>
        </html>
        """
        return HTMLResponse(content=html_content)

@router.get("/profile")
async def get_profile(db: db_dependency, current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.spotify_access_token:
        raise HTTPException(status_code=400, detail="Spotify not connected")
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {current_user.spotify_access_token}"}
        response = await client.get("https://api.spotify.com/v1/me", headers=headers)
        if response.status_code == 401:  # Token expired
            # Implement token refresh logic here
            raise HTTPException(status_code=401, detail="Token expired")
        
        profile_data = response.json()
        return profile_data

@router.post("/disconnect")
async def disconnect_spotify(db: db_dependency, current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.spotify_access_token:
        raise HTTPException(status_code=400, detail="Spotify not connected")
    
    # Clear Spotify tokens
    current_user.spotify_access_token = None
    current_user.spotify_refresh_token = None
    current_user.spotify_token_expires_at = None
    db.commit()
    
    return {"message": "Successfully disconnected from Spotify"}