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
    role = Column(String, default="operator") # operator, admin, viewer
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    login_count = Column(Integer, default=0)

class UserActivity(Base):
    __tablename__ = "user_activities"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    username = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    action = Column(String, default="login")    # login | failed_login | logout | created | updated | deleted | password_changed
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)

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
    rule_id = Column(Integer, ForeignKey("alert_rules.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    message = Column(String)
    title = Column(String, nullable=True)
    alert_type = Column(String, default="info")   # critical | warning | info
    is_read = Column(Boolean, default=False)


class QualityReview(Base):
    __tablename__ = "quality_reviews"
    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(Integer, ForeignKey("detection_logs.id"), index=True)
    action = Column(String)  # validate, reject, ignore, correct, manual_add
    target_status = Column(String, nullable=True)  # conforme / rejete
    notes = Column(String, nullable=True)
    reviewer = Column(String, default="operator")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SystemSetting(Base):
    __tablename__ = "system_settings"
    key = Column(String, primary_key=True, index=True)
    value = Column(String)

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)       # admin, operator, viewer, custom…
    label = Column(String)                               # "Administrateur"
    description = Column(String, nullable=True)
    permissions = Column(String, default="[]")           # JSON array of permission slugs
    is_builtin = Column(Boolean, default=False)          # built-in roles cannot be deleted
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Camera(Base):
    __tablename__ = "cameras"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="Caméra")
    source_type = Column(String, default="webcam")  # webcam, rtsp, http, file
    url = Column(String, default="0")
    resolution = Column(String, default="720p")
    fps = Column(Integer, default=30)
    is_active = Column(Boolean, default=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_tested_at = Column(DateTime, nullable=True)
    last_status = Column(String, nullable=True)   # online, offline, unknown
    last_latency_ms = Column(Integer, nullable=True)
