from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, HTMLResponse
import httpx
import models, auth
from typing import Annotated
from sqlalchemy.orm import Session
from database import SessionLocal
from dotenv import load_dotenv
import os
import base64
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
def login(token: str):
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    
    # Encode the token in base64 to pass via `state`
    encoded_state = base64.urlsafe_b64encode(token.encode()).decode()
    scope = "user-read-private user-read-email user-read-recently-played"

    auth_url = (
        f"https://accounts.spotify.com/authorize?client_id={CLIENT_ID}&response_type=code&redirect_uri={REDIRECT_URI}&scope={scope}&state={encoded_state}"
    )
    return RedirectResponse(auth_url)

@router.get("/callback")
async def callback(request: Request, db: db_dependency):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Authorization failed")
    
    encoded_state = request.query_params.get("state")

    if not code or not encoded_state:
        raise HTTPException(status_code=400, detail="Missing code or state")

    try:
        # Decode JWT from base64-encoded state
        jwt_token = base64.urlsafe_b64decode(encoded_state.encode()).decode()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    # Manually call your JWT decoder function (from auth.py)
    try:
        payload = auth.decode_access_token(jwt_token)  # should return {"sub": email}
        user_email = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Fetch user from DB
    current_user = db.query(models.User).filter(models.User.email == user_email).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")
    
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
        
        # Store tokens in database for the current user
        current_user.spotify_access_token = token_data['access_token']
        current_user.spotify_refresh_token = token_data['refresh_token']
        current_user.spotify_token_expires_at = token_data['expires_in']
        db.commit()
        
        # Create JWT token for the user
        access_token = auth.create_access_token(data={"sub": current_user.email})
        
        # Return HTML that will close the popup and send the token to the parent window
        html_content = f"""
        <html>
            <body>
                <script>
                    if (window.opener) {{
                        window.opener.postMessage({{
                        type: 'spotify-auth-success',
                        token: '{{access_token}}'
                        }}, '*');
                        window.close();
                    }} else {{
                        window.location.href = 'http://localhost:3000';
                    }}
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
    user = db.query(models.User).filter(models.User.id == current_user.id).first()

    if not user.spotify_access_token:
        raise HTTPException(status_code=400, detail="Spotify is not connected.")

    user.spotify_access_token = None
    user.spotify_refresh_token = None
    user.spotify_token_expires_at = None
    db.commit()
    
    return {"message": "Successfully disconnected from Spotify"}

@router.get("/status")
async def spotify_status(current_user: models.User = Depends(auth.get_current_user)):
    return {"connected": current_user.spotify_access_token is not None}
