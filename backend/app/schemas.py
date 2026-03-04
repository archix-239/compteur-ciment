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
    last_login: Optional[datetime] = None
    login_count: int = 0
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserPasswordChange(BaseModel):
    new_password: str

class UserActivityOut(BaseModel):
    id: int
    username: str
    timestamp: datetime
    action: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
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


class SessionListResponse(BaseModel):
    items: List[Session]
    total: int
    active_session_id: Optional[str] = None


class DetectionLogListResponse(BaseModel):
    items: List[DetectionLog]
    total: int
    page: int
    page_size: int

class AlertRuleBase(BaseModel):
    name: str
    type: str
    threshold: float
    is_active: bool

class AlertRule(AlertRuleBase):
    id: int
    class Config:
        from_attributes = True

class AlertRuleUpdate(BaseModel):
    name: Optional[str] = None
    threshold: Optional[float] = None
    is_active: Optional[bool] = None

class AlertHistoryCreate(BaseModel):
    message: str
    title: str = "Alerte manuelle"
    alert_type: str = "info"   # critical | warning | info

class AlertHistoryResponse(BaseModel):
    id: int
    rule_id: Optional[int] = None
    timestamp: datetime
    message: str
    title: str
    is_read: bool
    alert_type: str
    class Config:
        from_attributes = True

class AlertSettings(BaseModel):
    sound_enabled: bool = True
    sound_volume: int = 65
    email_enabled: bool = True
    slack_enabled: bool = False
    supervisor_phone: str = "+33 6 12 34 56 78"

class SystemSettingBase(BaseModel):
    key: str
    value: str

class SystemSetting(SystemSettingBase):
    class Config:
        from_attributes = True

class CameraConfig(BaseModel):
    source_type: str = "webcam"  # ip, webcam, file
    url: str = "0"
    resolution: str = "720p"  # 1080p, 720p, 480p
    fps: int = 30
    brightness: int = 50
    contrast: int = 65
    autofocus: bool = True

class CameraTestResult(BaseModel):
    success: bool
    message: str
    resolution_detected: Optional[str] = None
    fps_detected: Optional[float] = None


class ModelConfig(BaseModel):
    selected_model: str = "models/best_V5.pt"
    confidence_threshold: float = 0.7
    nms_iou_threshold: float = 0.45
    max_detections: int = 100
    inference_size: int = 1280
    tracking_persistence: bool = True


class VirtualLineConfig(BaseModel):
    position_percent: int = 60
    line_span_percent: int = 80
    direction: str = "left-right"


class QualityReviewBase(BaseModel):
    log_id: int
    action: str
    target_status: Optional[str] = None
    notes: Optional[str] = None
    reviewer: str = "operator"


class QualityReview(QualityReviewBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True


class UpdateLogRequest(BaseModel):
    action: str
    target_status: Optional[str] = None
    notes: Optional[str] = None
    reviewer: str = "operator"
    corrected_identifier: Optional[str] = None


class ManualVerificationItem(BaseModel):
    id: int
    timestamp: datetime
    session_id: str
    identifier: str
    detection_score: float
    logo_score: float
    color_score: float
    interval: float
    capture_url: Optional[str] = None
    status: str
    reason: str
    reviewed: bool


class ManualVerificationResponse(BaseModel):
    items: List[ManualVerificationItem]
    total: int


class QualityAnomaly(BaseModel):
    id: str
    type: str
    time: str
    severity: str
    description: str
    thumbnail: Optional[str] = None
    status: str


class QualityAnomalyResponse(BaseModel):
    items: List[QualityAnomaly]
    total: int


class QualityDashboardResponse(BaseModel):
    totalInspected: int
    rejectedCount: int
    rejectionRate: float
    avgLogoScore: float
    avgColorScore: float
    avgDetectionScore: float
    confidenceDistribution: List[dict]
    logoDistribution: List[dict]
    recentErrors: int
    reviewedCorrections: int

class CameraDeviceCreate(BaseModel):
    name: str
    source_type: str = "webcam"
    url: str = "0"
    resolution: str = "720p"
    fps: int = 30
    notes: Optional[str] = None

class CameraDeviceUpdate(BaseModel):
    name: Optional[str] = None
    source_type: Optional[str] = None
    url: Optional[str] = None
    resolution: Optional[str] = None
    fps: Optional[int] = None
    notes: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
