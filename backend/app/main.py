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

# Vision Event Callback
def handle_vision_event(event_data):
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
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.call_soon_threadsafe(
                    lambda: asyncio.create_task(manager.broadcast(json.dumps(message)))
                )
        except RuntimeError:
            # Handle cases where the loop is not yet running or accessible
            pass

    except Exception as e:
        print(f"Error handling vision event: {e}")
    finally:
        db.close()

# Startup & Shutdown events
@app.on_event("startup")
async def startup_event():
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
def gen_frames():
    engine = vision_engine.get_vision_engine()
    while True:
        frame = engine.get_video_frame()
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
async def video_feed():
    from fastapi.responses import StreamingResponse
    return StreamingResponse(gen_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

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

# Camera Configuration Endpoints
@app.get("/api/config/camera", response_model=schemas.CameraConfig)
async def get_camera_config(db: Session = Depends(get_db)):
    settings = db.query(models.SystemSetting).filter(
        models.SystemSetting.key.in_([
            "camera_source_type", "camera_url", "camera_resolution",
            "camera_fps", "camera_brightness", "camera_contrast", "camera_autofocus"
        ])
    ).all()
    config = {s.key: s.value for s in settings}
    return schemas.CameraConfig(
        source_type=config.get("camera_source_type", "webcam"),
        url=config.get("camera_url", "0"),
        resolution=config.get("camera_resolution", "720p"),
        fps=int(config.get("camera_fps", "30")),
        brightness=int(config.get("camera_brightness", "50")),
        contrast=int(config.get("camera_contrast", "65")),
        autofocus=config.get("camera_autofocus", "true").lower() == "true",
    )

@app.put("/api/config/camera", response_model=schemas.CameraConfig)
async def update_camera_config(config: schemas.CameraConfig, db: Session = Depends(get_db)):
    mapping = {
        "camera_source_type": config.source_type,
        "camera_url": config.url,
        "camera_resolution": config.resolution,
        "camera_fps": str(config.fps),
        "camera_brightness": str(config.brightness),
        "camera_contrast": str(config.contrast),
        "camera_autofocus": str(config.autofocus).lower(),
    }
    for key, value in mapping.items():
        setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
        if setting:
            setting.value = value
        else:
            db.add(models.SystemSetting(key=key, value=value))
    db.commit()

    # Update the vision engine with new source
    v_engine = vision_engine.get_vision_engine()
    if config.source_type == "ip":
        new_source = config.url
    elif config.source_type == "webcam":
        new_source = 0
    else:
        new_source = config.url
    if v_engine.video_source != new_source:
        v_engine.video_source = new_source
        # Restart capture if running
        if v_engine.running:
            v_engine.stop()
            v_engine.start()

    return config

@app.post("/api/config/camera/test", response_model=schemas.CameraTestResult)
async def test_camera_connection(config: schemas.CameraConfig):
    import asyncio
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _test_camera_sync, config)
    return result

def _test_camera_sync(config: schemas.CameraConfig) -> dict:
    """Test camera connection synchronously (runs in thread pool)."""
    if config.source_type == "webcam":
        source = int(config.url) if config.url.isdigit() else 0
    else:
        source = config.url

    cap = None
    try:
        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            return {"success": False, "message": f"Impossible d'ouvrir la source: {source}"}

        ret, frame = cap.read()
        if not ret or frame is None:
            return {"success": False, "message": "Source ouverte mais aucune image reçue."}

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)

        return {
            "success": True,
            "message": f"Connexion réussie — {width}x{height} @ {fps:.1f} FPS",
            "resolution_detected": f"{width}x{height}",
            "fps_detected": round(fps, 1),
        }
    except Exception as e:
        return {"success": False, "message": f"Erreur: {str(e)}"}
    finally:
        if cap is not None:
            cap.release()

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
