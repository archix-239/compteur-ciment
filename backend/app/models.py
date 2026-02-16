from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String, default="operator") # operator, admin
    is_active = Column(Boolean, default=True)

class Session(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, index=True) # S-YYYYMMDD-XX
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    total_count = Column(Integer, default=0)
    rejected_count = Column(Integer, default=0)
    status = Column(String, default="active") # active, completed
    logs = relationship("DetectionLog", back_populates="session")

class DetectionLog(Base):
    __tablename__ = "detection_logs"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String) # conforme, rejete
    identifier = Column(String) # UUID or track_id
    detection_score = Column(Float)
    logo_score = Column(Float)
    color_score = Column(Float)
    interval = Column(Float) # seconds since last detection
    capture_url = Column(String) # path to snapshot
    session = relationship("Session", back_populates="logs")

class AlertRule(Base):
    __tablename__ = "alert_rules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String) # production_rate, consistency, error_rate
    threshold = Column(Float)
    is_active = Column(Boolean, default=True)

class AlertHistory(Base):
    __tablename__ = "alert_history"
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("alert_rules.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    message = Column(String)
    is_read = Column(Boolean, default=False)

class SystemSetting(Base):
    __tablename__ = "system_settings"
    key = Column(String, primary_key=True, index=True)
    value = Column(String)
