from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    role: str = "operator"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

class SessionBase(BaseModel):
    id: str
    start_time: datetime
    status: str

class Session(SessionBase):
    end_time: Optional[datetime] = None
    total_count: int
    rejected_count: int
    class Config:
        from_attributes = True

class DetectionLogBase(BaseModel):
    session_id: str
    status: str
    identifier: str
    detection_score: float
    logo_score: float
    color_score: float
    interval: float
    capture_url: Optional[str] = None

class DetectionLog(DetectionLogBase):
    id: int
    timestamp: datetime
    class Config:
        from_attributes = True

class AlertRuleBase(BaseModel):
    name: str
    type: str
    threshold: float
    is_active: bool

class AlertRule(AlertRuleBase):
    id: int
    class Config:
        from_attributes = True

class SystemSettingBase(BaseModel):
    key: str
    value: str

class SystemSetting(SystemSettingBase):
    class Config:
        from_attributes = True

class CameraSettings(BaseModel):
    source_type: str
    url: str
    resolution: str
    fps: int
    brightness: int
    contrast: int
    auto_focus: bool

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
