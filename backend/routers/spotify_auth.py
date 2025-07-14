from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks, Header
from fastapi.responses import RedirectResponse, HTMLResponse
import httpx
import models, auth
from typing import Annotated
from sqlalchemy.orm import Session
from database import SessionLocal
from dotenv import load_dotenv
import os
import base64
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import urllib.parse
from models import BillingCycle
import statistics
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
load_dotenv()

import logging
logger = logging.getLogger(__name__)

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")
CRON_SECRET = os.getenv("CRON_SECRET")
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_PASS = os.getenv("GMAIL_PASS")
RENEW_SUB_URL = os.getenv("RENEW_SUB_URL")

router = APIRouter(prefix="/api/spotify", tags=["spotify"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]


async def refresh_spotify_token(user, db):
    token_url = "https://accounts.spotify.com/api/token"
    data = {
        "grant_type": "refresh_token",
        "refresh_token": user.spotify_refresh_token,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=urllib.parse.urlencode(data), headers=headers)
        token_data = response.json()
        if "access_token" in token_data:
            user.spotify_access_token = token_data["access_token"]
            if "refresh_token" in token_data:
                user.spotify_refresh_token = token_data["refresh_token"]
            user.spotify_token_expires_at = token_data["expires_in"]
            db.commit()
            return user.spotify_access_token
        else:
            raise HTTPException(status_code=401, detail="Failed to refresh Spotify token")
        

def refresh_spotify_token_sync(user, db):
    token_url = "https://accounts.spotify.com/api/token"
    data = {
        "grant_type": "refresh_token",
        "refresh_token": user.spotify_refresh_token,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    with httpx.Client() as client:
        response = client.post(token_url, data=urllib.parse.urlencode(data), headers=headers)
        token_data = response.json()
        if "access_token" in token_data:
            user.spotify_access_token = token_data["access_token"]
            if "refresh_token" in token_data:
                user.spotify_refresh_token = token_data["refresh_token"]
            user.spotify_token_expires_at = token_data["expires_in"]
            db.commit()
            return user.spotify_access_token
        else:
            raise Exception("Failed to refresh Spotify token")
        

@router.get("/login")
def login(token: str):
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    
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
        jwt_token = base64.urlsafe_b64decode(encoded_state.encode()).decode()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    try:
        payload = auth.decode_access_token(jwt_token)  # should return {"sub": email}
        user_email = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

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
                        window.location.href = 'https://subsense.vercel.app';
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
            try:
                new_token = await refresh_spotify_token(current_user, db)
                headers = {"Authorization": f"Bearer {new_token}"}
                response = await client.get("https://api.spotify.com/v1/me", headers=headers)
            except Exception:
                raise HTTPException(status_code=401, detail="Token expired and refresh failed")
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch profile")
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


@router.post("/connect-with-subscription")
async def connect_with_subscription(
    subscription_data: dict,
    db: db_dependency,
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.spotify_access_token:
        raise HTTPException(status_code=400, detail="Please connect to Spotify first")
    
    try:
        start_date = datetime.fromisoformat(subscription_data.get("start_date")).date()
        next_billing_date = datetime.fromisoformat(subscription_data.get("next_billing_date")).date()

        db_subscription = models.Subscription(
            user_id=current_user.id,
            app_name=subscription_data.get("app_name", "Spotify"),
            cost=float(subscription_data.get("cost", 0)),
            billing_cycle=BillingCycle(subscription_data.get("billing_cycle", "monthly")),
            start_date=start_date,
            next_billing_date=next_billing_date,
            is_active=1,
            should_omit=True
        )
        db.add(db_subscription)
        db.commit()
        db.refresh(db_subscription)
        
        return {
            "message": "Spotify connected and subscription created successfully",
            "subscription": {
                "id": db_subscription.id,
                "app_name": db_subscription.app_name,
                "cost": db_subscription.cost,
                "billing_cycle": db_subscription.billing_cycle.value,
                "start_date": db_subscription.start_date.isoformat(),
                "next_billing_date": db_subscription.next_billing_date.isoformat()
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create subscription: {str(e)}")
    

@router.get("/renew-subscription")
async def renew_subscription(email: str, db: db_dependency):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return HTMLResponse("User not found", status_code=404)
    subscription = db.query(models.Subscription).filter_by(user_id=user.id, app_name="Spotify").order_by(models.Subscription.id.desc()).first()
    if not subscription:
        return HTMLResponse("Spotify subscription not found", status_code=404)
    subscription.should_omit = False
    db.commit()
    return RedirectResponse("https://subsense.vercel.app")


def get_recommendation(email: str):
    db: Session = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        subscription = db.query(models.Subscription).filter_by(user_id=user.id, app_name="Spotify").first()
        app_usage = db.query(models.AppUsageStats).filter_by(user_id=user.id, subscription_id=subscription.id, app_name="Spotify").all()
        total_days = (subscription.next_billing_date - subscription.start_date).days
        total_active_days = sum([usage.is_active for usage in app_usage])
        active_percentage = (total_active_days / total_days) * 100
        total_usage_values = [usage.total_usage for usage in app_usage]
        if len(total_usage_values) >= 2:
            usage_consistancy_score = statistics.stdev(total_usage_values)
        else:
            usage_consistancy_score = 0.0
        
        if active_percentage < 30:
            if usage_consistancy_score < 15:
                return "omit"
            else:
                return "keep" # inconcistent usage, but active enough to keep
        elif active_percentage >= 60:
            return "keep"
        elif active_percentage >= 40 and usage_consistancy_score < 30:
            return "keep"
        else:
            return "keep" # inconcistent usage, but active enough to keep
    finally:
        db.close()


def send_renewal_email(user_email, user_name=None):
    status = get_recommendation(user_email)
    link = f"{RENEW_SUB_URL}?email={user_email}"
    body = f"""
    Hi{f' {user_name}' if user_name else ''},<br><br>
    Your Spotify subscription is due for renewal today.<br>
    Based on your usage, we recommend you to <strong>{status}</strong> this subscription.<br><br>
    If you wish to continue using Spotify with our service, please <a href='{link}'>reconnect your Spotify account</a>.<br><br>
    If you do not reconnect, your Spotify integration will remain disconnected.<br><br>
    Thank you!<br>
    Team SubSense.
    """
    msg = MIMEMultipart()
    msg['From'] = GMAIL_USER
    msg['To'] = user_email
    msg['Subject'] = "Spotify Subscription Renewal Confirmation"
    msg.attach(MIMEText(body, 'html'))
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(GMAIL_USER, GMAIL_PASS)
            server.sendmail(GMAIL_USER, user_email, msg.as_string())
        logger.info(f"Renewal email sent to {user_email}")
    except Exception as e:
        logger.error(f"Failed to send renewal email to {user_email}: {str(e)}")


def fetch_recently_played_for_all_users():
    db: Session = SessionLocal()
    try:
        users = db.query(models.User).filter(models.User.spotify_access_token.isnot(None)).all()
        today = datetime.now(ZoneInfo("Asia/Kolkata")).date()
        for user in users:
            try:
                # Check for Spotify subscription renewal
                subscription = db.query(models.Subscription).filter_by(user_id=user.id, app_name="Spotify", is_active=1).first()
                if subscription and subscription.next_billing_date == today:
                    # Mark subscription as inactive
                    subscription.is_active = 0
                    # Disconnect Spotify
                    user.spotify_access_token = None
                    user.spotify_refresh_token = None
                    user.spotify_token_expires_at = None
                    db.commit()
                    # Send renewal email
                    send_renewal_email(user.email, getattr(user, 'name', None))
                    logger.info(f"Processed renewal for user {user.email}")
                headers = {"Authorization": f"Bearer {user.spotify_access_token}"} if user.spotify_access_token else None
                if headers:
                    with httpx.Client() as client:
                        yesterday = datetime.now(ZoneInfo("Asia/Kolkata")) - timedelta(days=1)
                        timestamp = int(yesterday.timestamp() * 1000)
                        response = client.get(f"https://api.spotify.com/v1/me/player/recently-played?after={timestamp}", headers=headers)
                        if response.status_code == 401:  # Token expired, refresh
                            try:
                                new_token = refresh_spotify_token_sync(user, db)
                                headers = {"Authorization": f"Bearer {new_token}"}
                                response = client.get(f"https://api.spotify.com/v1/me/player/recently-played?after={timestamp}", headers=headers)
                            except Exception as e:
                                logger.error(f"Error refreshing token for user {user.email}: {str(e)}")
                        if response.status_code == 200:
                            data = response.json()
                            tracks_today = 0
                            while True:
                                for item in data.get("items", []):
                                    tracks_today += 1
                                next_url = data.get("next")
                                if not next_url:
                                    break
                                response = client.get(next_url, headers=headers)
                                if response.status_code != 200:
                                    logger.error(f"Error fetching next page for user {user.email}: {response.text}")
                                    break
                                data = response.json()

                            usage_stats = models.AppUsageStats(
                                user_id=user.id,
                                subscription_id=subscription.id if subscription else None,
                                app_name="Spotify",
                                date=today,
                                is_active=False if tracks_today == 0 else True,
                                total_usage=tracks_today
                            )
                            existing = db.query(models.AppUsageStats).filter_by(user_id=user.id, app_name="Spotify", date=today).first()
                            if not existing:
                                db.add(usage_stats)
                                db.commit()
            except Exception as e:
                logger.error(f"Error fetching recently played for user {user.email}: {str(e)}")
    finally:
        db.close()


@router.post("/fetch-recently-played")
def fetch_recently_played(background_tasks: BackgroundTasks, x_api_key: str = Header(...)):
    if x_api_key != CRON_SECRET:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    background_tasks.add_task(fetch_recently_played_for_all_users)
    return {"message": "Background task started to fetch recently played tracks for all users."}

