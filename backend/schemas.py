from pydantic import BaseModel, EmailStr
from datetime import date
from models import BillingCycle

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True

class ValidateEmail(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str

class SubscriptionCreate(BaseModel):
    app_name: str
    cost: float
    billing_cycle: BillingCycle
    start_date: date
    next_billing_date: date

class SubscriptionResponse(BaseModel):
    id: int
    user_id: int
    app_name: str
    cost: float
    billing_cycle: BillingCycle
    start_date: date
    next_billing_date: date
    is_active: int

    class Config:
        from_attributes = True