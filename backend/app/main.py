from fastapi import FastAPI, Depends, HTTPException, status, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import timedelta
import cv2
import json
import asyncio
from typing import List
from . import models, schemas, database, auth, vision_engine
from .database import engine, SessionLocal, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Cement Bag Counter API", version="1.0.0")

# WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()
main_loop = None

# Vision Event Callback
def handle_vision_event(event_data):
    global main_loop
    # This runs in the vision thread, so we need to use SessionLocal and broadcast via loop
    db = SessionLocal()
    try:
        # Save to DB
        db_log = models.DetectionLog(
            session_id=event_data["session_id"],
            status=event_data["status"],
            identifier=event_data["identifier"],
            detection_score=event_data["detection_score"],
            logo_score=event_data["logo_score"],
            color_score=event_data["color_score"],
            interval=event_data["interval"],
            capture_url=event_data["capture_url"]
        )
        db.add(db_log)

        # Update session counts
        session = db.query(models.Session).filter(models.Session.id == event_data["session_id"]).first()
        if session:
            if event_data["status"] == "conforme":
                session.total_count += 1
            else:
                session.rejected_count += 1

        db.commit()

        # Prepare message for WebSocket
        message = {
            "type": "COUNT_EVENT",
            "data": {
                "id": db_log.id,
                "status": db_log.status,
                "identifier": db_log.identifier,
                "timestamp": db_log.timestamp.isoformat(),
                "detection_score": db_log.detection_score,
                "logo_score": db_log.logo_score,
                "color_score": db_log.color_score,
                "capture_url": db_log.capture_url,
                "session_stats": {
                    "total": session.total_count if session else 0,
                    "rejected": session.rejected_count if session else 0
                }
            }
        }

        # Broadcast via asyncio in a thread-safe way
        if main_loop and main_loop.is_running():
            main_loop.call_soon_threadsafe(
                lambda: asyncio.create_task(manager.broadcast(json.dumps(message)))
            )

    except Exception as e:
        print(f"Error handling vision event: {e}")
    finally:
        db.close()

# Startup & Shutdown events
@app.on_event("startup")
async def startup_event():
    global main_loop
    main_loop = asyncio.get_running_loop()
    v_engine = vision_engine.get_vision_engine()
    v_engine.set_on_count_callback(handle_vision_event)
    v_engine.start()

@app.on_event("shutdown")
async def shutdown_event():
    v_engine = vision_engine.get_vision_engine()
    v_engine.stop()

app.mount("/static", StaticFiles(directory="backend/static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Cement Bag Counter API"}

# Vision Endpoints
def gen_frames(annotated=True):
    engine = vision_engine.get_vision_engine()
    while True:
        frame = engine.get_video_frame(annotated=annotated)
        if frame is not None:
            (flag, encodedImage) = cv2.imencode(".jpg", frame)
            if not flag:
                continue
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + bytearray(encodedImage) + b'\r\n')
        else:
            import time
            time.sleep(0.1)

@app.get("/api/vision/video_feed")
async def video_feed(raw: bool = False):
    from fastapi.responses import StreamingResponse
    return StreamingResponse(gen_frames(annotated=not raw), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/api/dashboard/summary")
async def get_dashboard_summary(db: Session = Depends(get_db)):
    active_session = db.query(models.Session).filter(models.Session.status == "active").first()
    total_bags = db.query(models.DetectionLog).filter(models.DetectionLog.status == "conforme").count()
    rejected_bags = db.query(models.DetectionLog).filter(models.DetectionLog.status == "rejete").count()

    return {
        "totalBags": total_bags,
        "rejectedBags": rejected_bags,
        "activeSessionId": active_session.id if active_session else None,
        "productionRate": 28.4, # Should be calculated
        "avgInterval": 2.21, # Should be calculated
        "consistency": 85.0 # Should be calculated
    }

@app.get("/api/logs/", response_model=List[schemas.DetectionLog])
async def get_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logs = db.query(models.DetectionLog).order_by(models.DetectionLog.timestamp.desc()).offset(skip).limit(limit).all()
    return logs

@app.get("/api/users/", response_model=List[schemas.User])
async def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users

@app.get("/api/system/health")
async def get_system_health():
    import psutil
    return {
        "status": "online",
        "cpu": psutil.cpu_percent(),
        "memory": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage('/').percent,
        "uptime": "12j 4h" # Mocked for now
    }

@app.get("/api/alerts/rules", response_model=List[schemas.AlertRule])
async def get_alert_rules(db: Session = Depends(get_db)):
    rules = db.query(models.AlertRule).all()
    return rules

@app.get("/api/analytics/performance")
async def get_performance_analytics(db: Session = Depends(get_db)):
    # Calculate OEE (Simulated for now based on real counts)
    total = db.query(models.DetectionLog).count()
    return {
        "availability": 98.5,
        "performance": 92.1,
        "quality": 99.2,
        "oee": 90.0,
        "totalCount": total
    }

@app.get("/api/quality/summary")
async def get_quality_summary(db: Session = Depends(get_db)):
    total = db.query(models.DetectionLog).count()
    rejected = db.query(models.DetectionLog).filter(models.DetectionLog.status == "rejete").count()
    rejection_rate = (rejected / total * 100) if total > 0 else 0

    return {
        "totalInspected": total,
        "rejectedCount": rejected,
        "rejectionRate": rejection_rate,
        "avgLogoScore": 0.92, # Simulated average
        "avgColorScore": 0.88 # Simulated average
    }

@app.get("/api/settings/camera", response_model=schemas.CameraSettings)
async def get_camera_settings(db: Session = Depends(get_db)):
    keys = ["camera_source_type", "camera_url", "camera_resolution", "camera_fps", "camera_brightness", "camera_contrast", "camera_auto_focus"]
    settings = db.query(models.SystemSetting).filter(models.SystemSetting.key.in_(keys)).all()
    settings_dict = {s.key: s.value for s in settings}

    return {
        "source_type": settings_dict.get("camera_source_type", "webcam"),
        "url": settings_dict.get("camera_url", "0"),
        "resolution": settings_dict.get("camera_resolution", "720p"),
        "fps": int(settings_dict.get("camera_fps", "30")),
        "brightness": int(settings_dict.get("camera_brightness", "50")),
        "contrast": int(settings_dict.get("camera_contrast", "50")),
        "auto_focus": settings_dict.get("camera_auto_focus", "true") == "true"
    }

@app.post("/api/settings/camera")
async def update_camera_settings(settings: schemas.CameraSettings, db: Session = Depends(get_db)):
    data = {
        "camera_source_type": settings.source_type,
        "camera_url": settings.url,
        "camera_resolution": settings.resolution,
        "camera_fps": str(settings.fps),
        "camera_brightness": str(settings.brightness),
        "camera_contrast": str(settings.contrast),
        "camera_auto_focus": "true" if settings.auto_focus else "false"
    }

    for key, value in data.items():
        db_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
        if db_setting:
            db_setting.value = value
        else:
            db_setting = models.SystemSetting(key=key, value=value)
            db.add(db_setting)

    db.commit()

    # Update vision engine
    v_engine = vision_engine.get_vision_engine()
    v_engine.update_params(
        source=settings.url if settings.source_type != "webcam" else 0,
        fps=settings.fps,
        brightness=settings.brightness,
        contrast=settings.contrast
    )

    return {"message": "Settings updated successfully"}

@app.post("/api/vision/test_connection")
async def test_camera_connection(settings: schemas.CameraSettings):
    v_engine = vision_engine.get_vision_engine()

    # Test values from form
    source = settings.url if settings.source_type != "webcam" else settings.url
    if isinstance(source, str) and source.isdigit():
        source = int(source)

    cap = cv2.VideoCapture(source)
    if cap.isOpened():
        cap.release()
        # If connection successful, update engine with these temporary settings for preview
        v_engine.update_params(
            source=source,
            fps=settings.fps,
            brightness=settings.brightness,
            contrast=settings.contrast
        )
        return {"status": "success", "message": "Connection successful"}
    else:
        # If it fails, we still might want to show the fallback in the engine?
        # Actually the user wants to see the fallback if it fails.
        v_engine.update_params(
            source=source,
            fps=settings.fps,
            brightness=settings.brightness,
            contrast=settings.contrast
        )
        return {"status": "success", "message": "Source tested (using fallback if unavailable)"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text() # Keep alive / receive messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# Session Endpoints
@app.get("/sessions/", response_model=list[schemas.Session])
async def read_sessions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    sessions = db.query(models.Session).offset(skip).limit(limit).all()
    return sessions

@app.post("/sessions/start", response_model=schemas.Session)
async def start_session(db: Session = Depends(get_db)):
    import datetime
    session_id = f"S-{datetime.datetime.now().strftime('%Y%m%d-%H%M')}"
    db_session = models.Session(id=session_id)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    # Notify vision engine
    v_engine = vision_engine.get_vision_engine()
    v_engine.set_active_session(session_id)

    return db_session

@app.post("/sessions/stop/{session_id}", response_model=schemas.Session)
async def stop_session(session_id: str, db: Session = Depends(get_db)):
    import datetime
    db_session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    db_session.end_time = datetime.datetime.utcnow()
    db_session.status = "completed"
    db.commit()
    db.refresh(db_session)

    # Notify vision engine
    v_engine = vision_engine.get_vision_engine()
    if v_engine.active_session_id == session_id:
        v_engine.set_active_session(None)

    return db_session

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
