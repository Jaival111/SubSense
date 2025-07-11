from fastapi import APIRouter, Depends, HTTPException
from typing import List
import models, schemas, auth
from typing import Annotated
from sqlalchemy.orm import Session
from database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

@router.post("/signup", response_model=schemas.Token)
def signup(user: schemas.UserCreate, db: db_dependency):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = models.User(
        name = user.name,
        email = user.email,
        password = user.password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = auth.create_access_token(data={"sub": new_user.email})

    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: db_dependency):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    token = auth.create_access_token(data={"sub": db_user.email})

    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
async def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.get("/users", response_model=List[schemas.UserResponse])
def list_users(db: db_dependency):
    users = db.query(models.User).all()
    return users

@router.post("/validate-email", response_model=schemas.ValidateEmail)
def validate_email(email: schemas.ValidateEmail, db: db_dependency):
    user = db.query(models.User).filter(models.User.email == email.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"email": email.email}

@router.post("/reset-password", response_model=schemas.PasswordReset)
def reset_password(user: schemas.PasswordReset, db: db_dependency):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_user.password = user.new_password
    db.commit()
    db.refresh(db_user)

    return db_user