from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routers import user_auth, spotify_auth

app = FastAPI()

app.include_router(user_auth.router)
app.include_router(spotify_auth.router)

origins = [
    "https://subsense.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)