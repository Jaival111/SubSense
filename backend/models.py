from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Enum, DateTime, Boolean
from datetime import datetime
from sqlalchemy.orm import relationship
import enum
from database import Base

class BillingCycle(enum.Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)

    subscriptions = relationship("Subscription", back_populates="user")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    app_name = Column(String)
    cost = Column(Float)
    billing_cycle = Column(Enum(BillingCycle))
    start_date = Column(Date)
    next_billing_date = Column(Date)
    is_active = Column(Integer, default=1)  # 1 = active, 0 = inactive

    user = relationship("User", back_populates="subscriptions")
    usage = relationship("AppUsage", back_populates="subscription", cascade="all, delete-orphan")

class AppUsage(Base):
    __tablename__ = "app_usage"

    id = Column(Integer, primary_key=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"))
    

    subscription = relationship("Subscription", back_populates="usage")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    is_read = Column(Boolean, default=False)
