from fastapi import FastAPI, Depends, HTTPException, status, Response, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from contextlib import asynccontextmanager
from datetime import timedelta, datetime
import cv2
import json
import asyncio
import queue
import signal
from typing import List
from . import models, schemas, database, auth, vision_engine
from .database import engine, SessionLocal, get_db

models.Base.metadata.create_all(bind=engine)


# ─── WebSocket Manager (events: COUNT_EVENT, etc.) ───────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead.append(connection)
        for c in dead:
            self.disconnect(c)

manager = ConnectionManager()

# Reference to the main asyncio event loop (set at startup)
_main_loop: asyncio.AbstractEventLoop = None


# ─── Vision Event Callback (called from vision thread) ───────────────────────
def handle_vision_event(event_data):
    db = SessionLocal()
    try:
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

        session = db.query(models.Session).filter(models.Session.id == event_data["session_id"]).first()
        if session:
            if event_data["status"] == "conforme":
                session.total_count += 1
            else:
                session.rejected_count += 1

        db.commit()

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

        # Thread-safe broadcast to the asyncio event loop
        if _main_loop and _main_loop.is_running():
            asyncio.run_coroutine_threadsafe(
                manager.broadcast(json.dumps(message)),
                _main_loop
            )

    except Exception as e:
        print(f"Error handling vision event: {e}")
    finally:
        db.close()


# ─── Lifespan: replaces deprecated @app.on_event ─────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _main_loop
    _main_loop = asyncio.get_running_loop()

    # Load camera config from DB and apply to engine
    db = SessionLocal()
    try:
        settings = db.query(models.SystemSetting).filter(
            models.SystemSetting.key.in_([
                "camera_source_type", "camera_url", "camera_resolution", "camera_fps", "camera_brightness", "camera_contrast", "camera_autofocus",
                "detection_model_path", "detection_threshold", "detection_nms_iou", "detection_max_det", "detection_imgsz", "tracking_persistence",
                "virtual_line_y_percent", "virtual_line_span_percent", "virtual_line_direction"
            ])
        ).all()
        config = {s.key: s.value for s in settings}
        source_type = config.get("camera_source_type", "webcam")
        url = config.get("camera_url", "0")

        v_engine = vision_engine.get_vision_engine()
        if source_type == "webcam":
            v_engine.video_source = int(url) if url.isdigit() else 0
        else:
            v_engine.video_source = url

        v_engine.apply_camera_settings(
            resolution=config.get("camera_resolution", "720p"),
            fps=int(config.get("camera_fps", "30")),
            brightness=int(config.get("camera_brightness", "50")),
            contrast=int(config.get("camera_contrast", "65")),
            autofocus=config.get("camera_autofocus", "true").lower() == "true",
        )

        v_engine.apply_model_config(
            model_path=config.get("detection_model_path", "models/best_V5.pt"),
            confidence_threshold=float(config.get("detection_threshold", "0.7")),
            nms_iou_threshold=float(config.get("detection_nms_iou", "0.45")),
            max_detections=int(config.get("detection_max_det", "100")),
            inference_size=int(config.get("detection_imgsz", "1280")),
            tracking_persistence=config.get("tracking_persistence", "true").lower() == "true",
        )
        v_engine.apply_virtual_line_config(
            position_percent=int(config.get("virtual_line_y_percent", "60")),
            line_span_percent=int(config.get("virtual_line_span_percent", "80")),
            direction=config.get("virtual_line_direction", "left-right"),
        )

        v_engine.set_on_count_callback(handle_vision_event)
        v_engine.start()
    finally:
        db.close()

    yield  # ── Application is running ──

    # Shutdown: stop the vision engine cleanly
    print("INFO: Shutdown signal reçu, arrêt du moteur de vision...")
    v_engine = vision_engine.get_vision_engine()
    v_engine.stop()
    _main_loop = None
    print("INFO: Shutdown complet.")


app = FastAPI(title="Cement Bag Counter API", version="1.0.0", lifespan=lifespan)

app.mount("/static", StaticFiles(directory="backend/static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Root ─────────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Welcome to Cement Bag Counter API"}


# ─── Video Feed: MJPEG fallback (kept for backwards compat) ──────────────────
def gen_frames():
    v_engine = vision_engine.get_vision_engine()
    while True:
        frame = v_engine.get_video_frame()
        if frame is not None:
            (flag, encoded) = cv2.imencode(".jpg", frame)
            if not flag:
                continue
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + bytearray(encoded) + b'\r\n')
        else:
            import time
            time.sleep(0.1)


@app.get("/api/vision/video_feed")
async def video_feed():
    from fastapi.responses import StreamingResponse
    return StreamingResponse(gen_frames(), media_type="multipart/x-mixed-replace; boundary=frame")


# ─── WebSocket Video Stream (/ws/video) ──────────────────────────────────────
@app.websocket("/ws/video")
async def websocket_video(websocket: WebSocket):
    await websocket.accept()

    v_engine = vision_engine.get_vision_engine()
    frame_queue = queue.Queue(maxsize=3)
    v_engine.add_video_subscriber(frame_queue)

    try:
        while True:
            try:
                # Wait for a frame from the vision engine (with timeout to check WS alive)
                frame_b64 = await asyncio.get_event_loop().run_in_executor(
                    None, lambda: frame_queue.get(timeout=1.0)
                )
                await websocket.send_text(frame_b64)
            except queue.Empty:
                # No frame available — send a ping to keep alive and detect disconnects
                try:
                    await websocket.send_text("")
                except Exception:
                    break
            except WebSocketDisconnect:
                break
            except Exception:
                break
    finally:
        v_engine.remove_video_subscriber(frame_queue)


# ─── WebSocket Events (/ws) ──────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


def _recompute_session_counters(db: Session, session_id: str):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        return
    total_conforme = db.query(models.DetectionLog).filter(
        models.DetectionLog.session_id == session_id,
        models.DetectionLog.status == "conforme"
    ).count()
    total_rejete = db.query(models.DetectionLog).filter(
        models.DetectionLog.session_id == session_id,
        models.DetectionLog.status == "rejete"
    ).count()
    session.total_count = total_conforme
    session.rejected_count = total_rejete



# ─── Timeline ────────────────────────────────────────────────────────────────
@app.get("/api/timeline/hourly")
async def get_timeline_hourly(hours: int = 24, db: Session = Depends(get_db)):
    """Distribution horaire de production sur les N dernières heures (max 168h)."""
    from datetime import datetime as _dt, timedelta as _td

    hours = max(1, min(hours, 168))
    now = _dt.utcnow()
    start = now - _td(hours=hours)

    logs = (
        db.query(models.DetectionLog)
        .filter(models.DetectionLog.timestamp >= start)
        .order_by(models.DetectionLog.timestamp.asc())
        .all()
    )

    # Normalisation timestamp
    def _to_dt(ts):
        if isinstance(ts, str):
            try:
                return _dt.fromisoformat(ts)
            except Exception:
                return None
        return ts

    # Groupement par bucket horaire
    data = []
    for i in range(hours - 1, -1, -1):
        b_start = now - _td(hours=i + 1)
        b_end   = now - _td(hours=i)
        label   = b_start.strftime("%H:%M")

        b_conformes = []
        b_rejected  = 0
        for log in logs:
            ts = _to_dt(log.timestamp)
            if ts is None or not (b_start <= ts < b_end):
                continue
            if log.status == "conforme":
                b_conformes.append(ts)
            elif log.status == "rejete":
                b_rejected += 1

        # Intervalle moyen dans le bucket
        iv_list = []
        for j in range(1, len(b_conformes)):
            delta = (b_conformes[j] - b_conformes[j - 1]).total_seconds()
            if 0 < delta < 120:
                iv_list.append(delta)

        data.append({
            "time":     label,
            "count":    len(b_conformes),
            "interval": round(sum(iv_list) / len(iv_list), 2) if iv_list else 0.0,
            "rejected": b_rejected,
        })

    # Analyse des pics (seulement les buckets non vides)
    non_empty = [b for b in data if b["count"] > 0]
    peak_max  = max(non_empty, key=lambda b: b["count"]) if non_empty else None
    peak_min  = min(non_empty, key=lambda b: b["count"]) if non_empty else None

    return {
        "data":        data,
        "peakMax":     peak_max,
        "peakMin":     peak_min,
        "totalBags":   sum(b["count"]    for b in data),
        "totalRejected": sum(b["rejected"] for b in data),
        "periodHours": hours,
    }


# ─── Dashboard ────────────────────────────────────────────────────────────────
@app.get("/api/dashboard/summary")
async def get_dashboard_summary(db: Session = Depends(get_db)):
    import math as _math
    from datetime import datetime as _dt, timedelta as _td

    now = _dt.utcnow()

    active_session = db.query(models.Session).filter(models.Session.status == "active").first()
    total_bags = db.query(models.DetectionLog).filter(models.DetectionLog.status == "conforme").count()
    rejected_bags = db.query(models.DetectionLog).filter(models.DetectionLog.status == "rejete").count()

    # Logs conformes de la session active, triés chronologiquement
    if active_session:
        session_logs = (
            db.query(models.DetectionLog)
            .filter(
                models.DetectionLog.session_id == active_session.id,
                models.DetectionLog.status == "conforme",
            )
            .order_by(models.DetectionLog.timestamp.asc())
            .all()
        )
    else:
        session_logs = []

    # Normalisation des timestamps (string ISO ou datetime)
    timestamps = []
    for log in session_logs:
        ts = log.timestamp
        if isinstance(ts, str):
            try:
                ts = _dt.fromisoformat(ts)
            except Exception:
                continue
        timestamps.append(ts)

    # Intervalles entre sacs consécutifs (on ignore les pauses > 120s)
    ts_intervals: list[tuple] = []  # (timestamp_du_sac_précédent, durée)
    for i in range(1, len(timestamps)):
        delta = (timestamps[i] - timestamps[i - 1]).total_seconds()
        if 0 < delta < 120:
            ts_intervals.append((timestamps[i - 1], delta))

    all_iv = [iv for _, iv in ts_intervals]
    avg_interval = sum(all_iv) / len(all_iv) if all_iv else 0.0

    # Taux de production : sacs dans les 5 dernières minutes
    cutoff_5min = now - _td(minutes=5)
    recent_count = sum(1 for ts in timestamps if ts >= cutoff_5min)
    production_rate = round(recent_count / 5.0, 2)

    # Consistance : 100 × (1 − CV), CV = σ/μ
    if len(all_iv) >= 2 and avg_interval > 0:
        variance = sum((x - avg_interval) ** 2 for x in all_iv) / len(all_iv)
        stddev = _math.sqrt(variance)
        cv = stddev / avg_interval
        consistency = max(0.0, round((1.0 - cv) * 100.0, 1))
        stddev_val = round(stddev, 2)
    else:
        stddev_val = 0.0
        consistency = 100.0

    # Première / deuxième moitié de session
    if len(all_iv) >= 4:
        mid = len(all_iv) // 2
        fh = all_iv[:mid]
        sh = all_iv[mid:]
        first_half_interval = round(sum(fh) / len(fh), 2)
        second_half_interval = round(sum(sh) / len(sh), 2)
        slowdown_pct = (
            round(((second_half_interval - first_half_interval) / first_half_interval) * 100.0, 1)
            if first_half_interval > 0 else 0.0
        )
    else:
        first_half_interval = round(avg_interval, 2)
        second_half_interval = round(avg_interval, 2)
        slowdown_pct = 0.0

    # Graphique intervalles : buckets par minute sur les 14 dernières minutes
    interval_data = []
    for i in range(13, -1, -1):
        b_start = now - _td(minutes=i + 1)
        b_end = now - _td(minutes=i)
        label = f"{b_start.hour}:{str(b_start.minute).zfill(2)}"
        b_iv = [iv for ts, iv in ts_intervals if b_start <= ts < b_end]
        if b_iv:
            interval_data.append({
                "time": label,
                "avgInterval": round(sum(b_iv) / len(b_iv), 2),
                "minInterval": round(min(b_iv), 2),
                "maxInterval": round(max(b_iv), 2),
            })
        else:
            interval_data.append({"time": label, "avgInterval": 0, "minInterval": 0, "maxInterval": 0})

    # Heatmap : 6 buckets de 5 secondes (dernières 30s)
    heatmap_data = []
    for i in range(5, -1, -1):
        b_start = now - _td(seconds=(i + 1) * 5)
        b_end = now - _td(seconds=i * 5)
        count = sum(1 for ts in timestamps if b_start <= ts < b_end)
        level = "none" if count == 0 else "low" if count < 2 else "medium" if count < 4 else "high"
        heatmap_data.append({"time": f"{(5 - i) * 5}s", "activity": {"level": level, "count": count}})

    # Production gaps : intervalles > 2× la moyenne
    production_gaps = []
    if avg_interval > 0 and len(timestamps) >= 2:
        for i in range(1, len(timestamps)):
            delta = (timestamps[i] - timestamps[i - 1]).total_seconds()
            if delta > 2 * avg_interval:
                deviation_pct = int(((delta - avg_interval) / avg_interval) * 100)
                production_gaps.append({
                    "id": str(i),
                    "bagRange": f"#{i} → #{i + 1}",
                    "duration": f"{delta:.2f}s",
                    "time": timestamps[i - 1].strftime("%H:%M"),
                    "deviation": deviation_pct,
                })

    return {
        "totalBags": total_bags,
        "rejectedBags": rejected_bags,
        "activeSessionId": active_session.id if active_session else None,
        "productionRate": production_rate,
        "avgInterval": round(avg_interval, 2),
        "consistency": consistency,
        "stddev": stddev_val,
        "firstHalfInterval": first_half_interval,
        "secondHalfInterval": second_half_interval,
        "slowdownPercent": slowdown_pct,
        "intervalData": interval_data,
        "heatmapData": heatmap_data,
        "productionGaps": production_gaps,
    }


# ─── Logs ─────────────────────────────────────────────────────────────────────
@app.get("/api/logs/", response_model=schemas.DetectionLogListResponse)
async def get_logs(
    page: int = 1,
    page_size: int = 20,
    status: str | None = None,
    session_id: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)

    query = db.query(models.DetectionLog)
    if status:
        mapped_status = "conforme" if status.lower() in ["verifie", "vérifié", "conforme"] else "rejete" if status.lower() in ["rejete", "rejeté"] else status
        query = query.filter(models.DetectionLog.status == mapped_status)
    if session_id:
        query = query.filter(models.DetectionLog.session_id == session_id)
    if search:
        query = query.filter(models.DetectionLog.identifier.ilike(f"%{search}%"))

    total = query.count()
    logs = query.order_by(models.DetectionLog.timestamp.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": logs,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ─── Users ────────────────────────────────────────────────────────────────────
@app.get("/api/users/", response_model=List[schemas.User])
async def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users


# ─── System Health ────────────────────────────────────────────────────────────
@app.get("/api/system/health")
async def get_system_health():
    import psutil
    return {
        "status": "online",
        "cpu": psutil.cpu_percent(),
        "memory": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage('/').percent,
        "uptime": "12j 4h"
    }


# ─── Alerts ───────────────────────────────────────────────────────────────────
@app.get("/api/alerts/rules", response_model=List[schemas.AlertRule])
async def get_alert_rules(db: Session = Depends(get_db)):
    rules = db.query(models.AlertRule).all()
    return rules


# ─── Analytics / OEE ─────────────────────────────────────────────────────────
@app.get("/api/analytics/oee")
async def get_oee_analytics(hours: int = 24, db: Session = Depends(get_db)):
    """OEE / TRS analytics computed from real DetectionLog & Session data."""
    import math as _math
    from datetime import datetime as _dt, timedelta as _td

    hours = max(1, min(hours, 720))
    now = _dt.utcnow()
    start = now - _td(hours=hours)
    prev_start = start - _td(hours=hours)
    planned_seconds = hours * 3600
    TARGET_RATE = 1100  # bags/hour theoretical max

    def _to_dt(ts):
        if isinstance(ts, str):
            try:
                return _dt.fromisoformat(ts)
            except Exception:
                return None
        return ts

    # ── Current period ──────────────────────────────────────────────────────
    logs = (
        db.query(models.DetectionLog)
        .filter(models.DetectionLog.timestamp >= start)
        .order_by(models.DetectionLog.timestamp.asc())
        .all()
    )
    conforming = [l for l in logs if l.status == "conforme"]
    rejected   = [l for l in logs if l.status == "rejete"]
    total_bags     = len(conforming)
    rejected_count = len(rejected)
    total_inspected = total_bags + rejected_count

    quality = round((total_bags / total_inspected * 100) if total_inspected > 0 else 100.0, 1)

    # Sessions overlapping the period
    sessions = db.query(models.Session).filter(
        models.Session.start_time >= start
    ).all()
    active_sess = db.query(models.Session).filter(models.Session.status == "active").first()
    if active_sess and active_sess not in sessions:
        sessions.append(active_sess)

    total_session_seconds = 0.0
    for sess in sessions:
        s_start = _to_dt(sess.start_time)
        s_end   = _to_dt(sess.end_time) if sess.end_time else now
        if s_start is None:
            continue
        s_start = max(s_start, start)
        s_end   = min(s_end,   now)
        dur = (s_end - s_start).total_seconds()
        if dur > 0:
            total_session_seconds += dur

    availability = round(
        min(100.0, total_session_seconds / planned_seconds * 100) if planned_seconds > 0 else 0.0, 1
    )

    actual_rate = total_bags / (total_session_seconds / 3600) if total_session_seconds > 0 else 0.0
    performance = round(min(100.0, actual_rate / TARGET_RATE * 100) if TARGET_RATE > 0 else 0.0, 1)

    oee = round((availability * performance * quality) / 10000.0, 1)

    # ── Previous period OEE (for delta) ────────────────────────────────────
    prev_logs = db.query(models.DetectionLog).filter(
        models.DetectionLog.timestamp >= prev_start,
        models.DetectionLog.timestamp < start,
    ).all()
    prev_conforming = [l for l in prev_logs if l.status == "conforme"]
    prev_total      = len(prev_conforming)
    prev_inspected  = prev_total + len([l for l in prev_logs if l.status == "rejete"])

    prev_sessions = db.query(models.Session).filter(
        models.Session.start_time >= prev_start,
        models.Session.start_time <  start,
    ).all()
    prev_sess_secs = 0.0
    for sess in prev_sessions:
        s_start = _to_dt(sess.start_time)
        s_end   = _to_dt(sess.end_time) if sess.end_time else start
        if s_start is None:
            continue
        s_start = max(s_start, prev_start)
        s_end   = min(s_end,   start)
        dur = (s_end - s_start).total_seconds()
        if dur > 0:
            prev_sess_secs += dur

    prev_quality      = (prev_total / prev_inspected * 100) if prev_inspected > 0 else 100.0
    prev_availability = min(100.0, prev_sess_secs / planned_seconds * 100) if planned_seconds > 0 else 0.0
    prev_actual_rate  = prev_total / (prev_sess_secs / 3600) if prev_sess_secs > 0 else 0.0
    prev_performance  = min(100.0, prev_actual_rate / TARGET_RATE * 100) if TARGET_RATE > 0 else 0.0
    prev_oee          = (prev_availability * prev_performance * prev_quality) / 10000.0
    oee_delta = round(oee - prev_oee, 1)

    # ── Hourly / bucketed chart data ────────────────────────────────────────
    if hours <= 48:
        bucket_hours = 1
    elif hours <= 168:
        bucket_hours = 4
    else:
        bucket_hours = 24

    num_buckets = hours // bucket_hours
    hourly_data = []
    for i in range(num_buckets - 1, -1, -1):
        b_start = now - _td(hours=(i + 1) * bucket_hours)
        b_end   = now - _td(hours=i * bucket_hours)
        if bucket_hours >= 24:
            label = b_start.strftime("%d/%m")
        elif bucket_hours > 1:
            label = b_start.strftime("%d/%m %H:%M")
        else:
            label = b_start.strftime("%H:%M")

        b_count = sum(
            1 for l in conforming
            if _to_dt(l.timestamp) and b_start <= _to_dt(l.timestamp) < b_end
        )
        hourly_data.append({"name": label, "real": b_count, "target": TARGET_RATE, "forecast": 0})

    # Rolling 3-bucket forecast
    for i, h in enumerate(hourly_data):
        prev_vals = [hourly_data[j]["real"] for j in range(max(0, i - 3), i) if hourly_data[j]["real"] > 0]
        h["forecast"] = round(sum(prev_vals) / len(prev_vals)) if prev_vals else h["real"]

    # ── Downtime distribution ───────────────────────────────────────────────
    all_ts = sorted(ts for l in logs if (ts := _to_dt(l.timestamp)) is not None)

    production_secs    = 0.0
    micro_stops_secs   = 0.0
    technical_fail_secs = 0.0
    for i in range(1, len(all_ts)):
        delta = (all_ts[i] - all_ts[i - 1]).total_seconds()
        if delta < 30:
            production_secs    += delta
        elif delta < 120:
            micro_stops_secs   += delta
        else:
            technical_fail_secs += delta

    if planned_seconds > 0:
        prod_pct    = round(production_secs     / planned_seconds * 100, 1)
        micro_pct   = round(micro_stops_secs    / planned_seconds * 100, 1)
        failure_pct = round(technical_fail_secs / planned_seconds * 100, 1)
        idle_pct    = max(0.0, round(100 - prod_pct - micro_pct - failure_pct, 1))
    else:
        prod_pct = micro_pct = failure_pct = idle_pct = 0.0

    downtime_data = [
        {"name": "Production",      "value": prod_pct,    "color": "#22c55e"},
        {"name": "Micro-arrêts",    "value": micro_pct,   "color": "#eab308"},
        {"name": "Panne Technique", "value": failure_pct, "color": "#ef4444"},
        {"name": "Inactivité",      "value": idle_pct,    "color": "#6366f1"},
    ]
    total_stops_h = round((planned_seconds - production_secs) / 3600, 1)

    # ── Recommendations ─────────────────────────────────────────────────────
    intervals = []
    for i in range(1, len(all_ts)):
        d = (all_ts[i] - all_ts[i - 1]).total_seconds()
        if 0 < d < 120:
            intervals.append(d)

    recommendations = []
    if intervals:
        avg_iv = sum(intervals) / len(intervals)
        if len(intervals) >= 2:
            variance = sum((x - avg_iv) ** 2 for x in intervals) / len(intervals)
            cv = _math.sqrt(variance) / avg_iv if avg_iv > 0 else 0
            if cv > 0.3:
                recommendations.append({
                    "type": "speed", "color": "orange",
                    "title": "Vitesse Convoyeur",
                    "text": (
                        f"Coefficient de variation des intervalles : {cv*100:.0f}%. "
                        f"Stabiliser la cadence pourrait améliorer la consistance "
                        f"de {min(15, int(cv * 30))}%."
                    ),
                })

    if total_inspected > 0 and rejected_count / total_inspected > 0.03:
        recommendations.append({
            "type": "quality", "color": "blue",
            "title": "Taux de Rejet",
            "text": (
                f"{rejected_count} sacs rejetés "
                f"({rejected_count / total_inspected * 100:.1f}% du total). "
                f"Vérifier le positionnement caméra et le seuil de confiance du modèle."
            ),
        })

    if availability < 80.0 and total_bags > 0:
        recommendations.append({
            "type": "maintenance", "color": "red",
            "title": "Disponibilité Faible",
            "text": (
                f"Disponibilité à {availability}% sur la période. "
                f"Augmenter la durée des sessions de production actives."
            ),
        })

    defaults = [
        {"type": "speed", "color": "orange", "title": "Vitesse Convoyeur",
         "text": "Débit stable sur la période analysée. Aucun ajustement de vitesse nécessaire."},
        {"type": "maintenance", "color": "blue", "title": "Maintenance Prédictive",
         "text": "Aucune anomalie de cadence détectée. Prochain entretien selon le calendrier prévu."},
        {"type": "quality", "color": "green", "title": "Qualité de Donnée",
         "text": f"Taux de conformité à {quality}%. Les conditions de détection sont optimales."},
    ]
    while len(recommendations) < 3:
        recommendations.append(defaults[len(recommendations) % len(defaults)])

    return {
        "oee":              oee,
        "oeeDelta":         oee_delta,
        "availability":     availability,
        "performance":      performance,
        "quality":          quality,
        "totalBags":        total_bags,
        "rejectedBags":     rejected_count,
        "targetRatePerHour": TARGET_RATE,
        "actualRatePerHour": round(actual_rate, 1),
        "sessionHours":     round(total_session_seconds / 3600, 1),
        "hourlyData":       hourly_data,
        "downtimeData":     downtime_data,
        "totalStopsHours":  total_stops_h,
        "recommendations":  recommendations,
        "periodHours":      hours,
    }


# ─── Quality ──────────────────────────────────────────────────────────────────
@app.get("/api/quality/summary", response_model=schemas.QualityDashboardResponse)
async def get_quality_summary(db: Session = Depends(get_db)):
    logs = db.query(models.DetectionLog).all()
    total = len(logs)
    rejected = len([l for l in logs if l.status == "rejete"])
    rejection_rate = (rejected / total * 100) if total > 0 else 0

    avg_logo = sum((l.logo_score or 0) for l in logs) / total if total else 0
    avg_color = sum((l.color_score or 0) for l in logs) / total if total else 0
    avg_detect = sum((l.detection_score or 0) for l in logs) / total if total else 0

    bins = {"0-20%": 0, "20-40%": 0, "40-60%": 0, "60-80%": 0, "80-100%": 0}
    for l in logs:
        v = (l.detection_score or 0) * 100
        if v < 20:
            bins["0-20%"] += 1
        elif v < 40:
            bins["20-40%"] += 1
        elif v < 60:
            bins["40-60%"] += 1
        elif v < 80:
            bins["60-80%"] += 1
        else:
            bins["80-100%"] += 1

    logo_conforme = len([l for l in logs if (l.logo_score or 0) >= 0.8])
    logo_flou = len([l for l in logs if 0.5 <= (l.logo_score or 0) < 0.8])
    logo_absent = len([l for l in logs if (l.logo_score or 0) < 0.5])
    reviews_count = db.query(models.QualityReview).count()
    recent_errors = db.query(models.DetectionLog).filter(
        models.DetectionLog.status == "rejete",
        models.DetectionLog.timestamp >= (datetime.utcnow() - timedelta(hours=24))
    ).count()

    return {
        "totalInspected": total,
        "rejectedCount": rejected,
        "rejectionRate": rejection_rate,
        "avgLogoScore": avg_logo,
        "avgColorScore": avg_color,
        "avgDetectionScore": avg_detect,
        "confidenceDistribution": [{"range": k, "count": v} for k, v in bins.items()],
        "logoDistribution": [
            {"name": "Logo Conforme", "value": logo_conforme, "color": "#f97316"},
            {"name": "Logo Flou", "value": logo_flou, "color": "#eab308"},
            {"name": "Sans Logo", "value": logo_absent, "color": "#ef4444"},
        ],
        "recentErrors": recent_errors,
        "reviewedCorrections": reviews_count,
    }


@app.get("/api/quality/manual-verification", response_model=schemas.ManualVerificationResponse)
async def get_manual_verification_queue(
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)

    reviewed_ids = [r[0] for r in db.query(models.QualityReview.log_id).all()]

    query = db.query(models.DetectionLog).filter(
        (models.DetectionLog.status == "rejete") |
        (models.DetectionLog.detection_score < 0.6)
    )
    if reviewed_ids:
        query = query.filter(~models.DetectionLog.id.in_(reviewed_ids))
    if search:
        query = query.filter(models.DetectionLog.identifier.ilike(f"%{search}%"))

    total = query.count()
    items = query.order_by(models.DetectionLog.timestamp.desc()).offset((page - 1) * page_size).limit(page_size).all()

    mapped = []
    for l in items:
        reason = "Non conforme" if l.status == "rejete" else "Confiance faible"
        mapped.append({
            "id": l.id,
            "timestamp": l.timestamp,
            "session_id": l.session_id,
            "identifier": l.identifier,
            "detection_score": l.detection_score,
            "logo_score": l.logo_score,
            "color_score": l.color_score,
            "interval": l.interval,
            "capture_url": l.capture_url,
            "status": l.status,
            "reason": reason,
            "reviewed": False,
        })
    return {"items": mapped, "total": total}


@app.get("/api/quality/reviews", response_model=list[schemas.QualityReview])
async def get_quality_reviews(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(models.QualityReview).order_by(models.QualityReview.created_at.desc()).limit(limit).all()


@app.get("/api/quality/anomalies", response_model=schemas.QualityAnomalyResponse)
async def get_quality_anomalies(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(models.DetectionLog).order_by(models.DetectionLog.timestamp.desc()).limit(limit).all()
    items = []
    for l in logs:
        is_low_conf = (l.detection_score or 0) < 0.6
        is_reject = l.status == "rejete"
        if not is_low_conf and not is_reject:
            continue
        severity = "high" if (l.detection_score or 0) < 0.5 or is_reject else "medium"
        items.append({
            "id": f"AN-{l.id}",
            "type": "Sac rejeté" if is_reject else "Confiance faible",
            "time": l.timestamp.strftime("%H:%M:%S"),
            "severity": severity,
            "description": f"Score détection {l.detection_score:.2f}, logo {l.logo_score:.2f}, couleur {l.color_score:.2f}",
            "thumbnail": f"/static/captures/{l.capture_url.split('/')[-1]}" if l.capture_url else None,
            "status": "pending",
        })
    return {"items": items, "total": len(items)}


@app.patch("/api/logs/{log_id}", response_model=schemas.DetectionLog)
async def review_log(log_id: int, payload: schemas.UpdateLogRequest, db: Session = Depends(get_db)):
    log = db.query(models.DetectionLog).filter(models.DetectionLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    original_status = log.status

    action = payload.action.lower()
    if action in ["validate", "valider", "correct"]:
        log.status = payload.target_status or "conforme"
    elif action in ["reject", "rejeter"]:
        log.status = payload.target_status or "rejete"
    elif action in ["ignore", "ignorer"]:
        pass

    if payload.corrected_identifier:
        log.identifier = payload.corrected_identifier

    review = models.QualityReview(
        log_id=log.id,
        action=payload.action,
        target_status=log.status,
        notes=payload.notes,
        reviewer=payload.reviewer,
    )
    db.add(review)

    if original_status != log.status:
        _recompute_session_counters(db, log.session_id)

    db.commit()
    db.refresh(log)
    return log


# ─── Camera Configuration ────────────────────────────────────────────────────
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

    # Determine new video source and apply camera settings in runtime
    v_engine = vision_engine.get_vision_engine()
    if config.source_type == "webcam":
        new_source = int(config.url) if config.url.isdigit() else 0
    else:
        new_source = config.url

    source_changed = v_engine.video_source != new_source
    if source_changed:
        v_engine.video_source = new_source

    # Apply settings (hardware + software post-processing parameters)
    v_engine.apply_camera_settings(
        resolution=config.resolution,
        fps=config.fps,
        brightness=config.brightness,
        contrast=config.contrast,
        autofocus=config.autofocus,
    )

    # Restart only when source changes (avoid unnecessary RTSP reconnect storms)
    if v_engine.running and source_changed:
        if v_engine.stop():
            v_engine.start()

    return config


@app.post("/api/config/camera/test", response_model=schemas.CameraTestResult)
async def test_camera_connection(config: schemas.CameraConfig):
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _test_camera_sync, config)
    return result


@app.get("/api/config/runtime")
async def get_runtime_config(db: Session = Depends(get_db)):
    v_engine = vision_engine.get_vision_engine()
    settings = db.query(models.SystemSetting).filter(
        models.SystemSetting.key.in_(["camera_url", "detection_model_path"])
    ).all()
    cfg = {s.key: s.value for s in settings}
    runtime = v_engine.get_runtime_info()
    return {
        "camera_name": runtime.get("camera_name", f"CAM_{cfg.get('camera_url', '0')}"),
        "model": cfg.get("detection_model_path", runtime.get("model", "models/best_V5.pt")),
        "capture_fps": runtime.get("capture_fps", 0),
        "line": runtime.get("line", {}),
    }


def _test_camera_sync(config: schemas.CameraConfig) -> dict:
    """Test camera connection synchronously (runs in thread pool).

    If the tested source matches the running vision engine source,
    temporarily stop the engine to avoid webcam access conflicts on Windows.
    """
    import os as _os
    import sys as _sys

    if config.source_type == "webcam":
        source = int(config.url) if config.url.isdigit() else 0
    else:
        source = config.url

    # Check if we need to pause the vision engine (same webcam source conflict only)
    v_engine = vision_engine.get_vision_engine()
    engine_was_running = False
    same_source = v_engine.running and v_engine.video_source == source
    is_webcam_source = isinstance(source, int) or (isinstance(source, str) and source.isdigit())
    if same_source and is_webcam_source:
        print(f"INFO: Pause du moteur de vision pour test caméra (source webcam: {source})")
        engine_was_running = v_engine.stop()

    cap = None
    try:
        # Use FFMPEG backend for RTSP/HTTP
        if isinstance(source, str) and source.startswith("rtsp://"):
            _os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|analyzeduration;5000000|probesize;5000000"
            cap = cv2.VideoCapture(source, cv2.CAP_FFMPEG)
        elif isinstance(source, str) and (source.startswith("http://") or source.startswith("https://")):
            cap = cv2.VideoCapture(source, cv2.CAP_FFMPEG)
        elif isinstance(source, int) or (isinstance(source, str) and source.isdigit()):
            # Webcam: use DirectShow on Windows
            idx = int(source) if isinstance(source, str) else source
            if _sys.platform == "win32":
                cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
            else:
                cap = cv2.VideoCapture(idx)
        else:
            # Video file
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
        # Restart vision engine if we paused it
        if engine_was_running:
            print("INFO: Redémarrage du moteur de vision après test caméra")
            v_engine.start()


# ─── Available Models ────────────────────────────────────────────────────────

@app.get("/api/models/list")
async def list_available_models():
    """Liste les fichiers .pt disponibles dans le dossier models/."""
    import os as _os
    models_dir = "models"
    v_engine = vision_engine.get_vision_engine()
    active_path = v_engine.model_path
    if not _os.path.isdir(models_dir):
        return {"models": [], "active_model": active_path}
    result = []
    for fname in sorted(_os.listdir(models_dir)):
        if not fname.endswith(".pt"):
            continue
        fpath = f"models/{fname}"
        try:
            size_mb = round(_os.path.getsize(fpath) / (1024 * 1024), 1)
        except OSError:
            size_mb = 0.0
        result.append({
            "path": fpath,
            "filename": fname,
            "size_mb": size_mb,
            "is_active": fpath == active_path,
        })
    return {"models": result, "active_model": active_path}


@app.post("/api/models/activate")
async def activate_model(payload: dict, db: Session = Depends(get_db)):
    """Bascule le modèle actif sur le chemin fourni et l'applique à chaud."""
    import os as _os
    model_path = (payload.get("model_path") or "").strip()
    if not model_path:
        raise HTTPException(status_code=400, detail="model_path requis")
    if not _os.path.isfile(model_path):
        raise HTTPException(status_code=404, detail=f"Modèle introuvable : {model_path}")
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "detection_model_path").first()
    if setting:
        setting.value = model_path
    else:
        db.add(models.SystemSetting(key="detection_model_path", value=model_path))
    db.commit()
    v_engine = vision_engine.get_vision_engine()
    v_engine.apply_model_config(model_path=model_path)
    return {"activated": model_path, "message": f"Modèle basculé vers {model_path}"}


@app.post("/api/models/upload")
async def upload_model(file: UploadFile = File(...)):
    """Reçoit un fichier .pt et le sauvegarde dans le dossier models/."""
    import os as _os
    import shutil as _shutil
    if not file.filename or not file.filename.endswith(".pt"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers .pt sont acceptés.")
    safe_name = _os.path.basename(file.filename)
    if not safe_name:
        raise HTTPException(status_code=400, detail="Nom de fichier invalide.")
    models_dir = "models"
    _os.makedirs(models_dir, exist_ok=True)
    dest = _os.path.join(models_dir, safe_name)
    with open(dest, "wb") as f:
        _shutil.copyfileobj(file.file, f)
    size_mb = round(_os.path.getsize(dest) / (1024 * 1024), 1)
    return {"path": f"models/{safe_name}", "filename": safe_name, "size_mb": size_mb}


@app.delete("/api/models/{filename}")
async def delete_model(filename: str):
    """Supprime un fichier .pt du dossier models/. Refuse si c'est le modèle actif."""
    import os as _os
    safe_name = _os.path.basename(filename)
    if not safe_name.endswith(".pt"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers .pt peuvent être supprimés.")
    fpath = f"models/{safe_name}"
    v_engine = vision_engine.get_vision_engine()
    if fpath == v_engine.model_path:
        raise HTTPException(status_code=409, detail="Impossible de supprimer le modèle actuellement actif.")
    if not _os.path.isfile(fpath):
        raise HTTPException(status_code=404, detail=f"Modèle introuvable : {fpath}")
    _os.remove(fpath)
    return {"deleted": fpath}


# ─── IA Model Configuration ──────────────────────────────────────────────────
@app.get("/api/config/model", response_model=schemas.ModelConfig)
async def get_model_config(db: Session = Depends(get_db)):
    settings = db.query(models.SystemSetting).filter(
        models.SystemSetting.key.in_([
            "detection_model_path", "detection_threshold", "detection_nms_iou",
            "detection_max_det", "detection_imgsz", "tracking_persistence"
        ])
    ).all()
    config = {s.key: s.value for s in settings}

    return schemas.ModelConfig(
        selected_model=config.get("detection_model_path", "models/best_V5.pt"),
        confidence_threshold=float(config.get("detection_threshold", "0.7")),
        nms_iou_threshold=float(config.get("detection_nms_iou", "0.45")),
        max_detections=int(config.get("detection_max_det", "100")),
        inference_size=int(config.get("detection_imgsz", "1280")),
        tracking_persistence=config.get("tracking_persistence", "true").lower() == "true",
    )


@app.put("/api/config/model", response_model=schemas.ModelConfig)
async def update_model_config(config: schemas.ModelConfig, db: Session = Depends(get_db)):
    mapping = {
        "detection_model_path": config.selected_model,
        "detection_threshold": str(config.confidence_threshold),
        "detection_nms_iou": str(config.nms_iou_threshold),
        "detection_max_det": str(config.max_detections),
        "detection_imgsz": str(config.inference_size),
        "tracking_persistence": str(config.tracking_persistence).lower(),
    }
    for key, value in mapping.items():
        setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
        if setting:
            setting.value = value
        else:
            db.add(models.SystemSetting(key=key, value=value))
    db.commit()

    v_engine = vision_engine.get_vision_engine()
    v_engine.apply_model_config(
        model_path=config.selected_model,
        confidence_threshold=config.confidence_threshold,
        nms_iou_threshold=config.nms_iou_threshold,
        max_detections=config.max_detections,
        inference_size=config.inference_size,
        tracking_persistence=config.tracking_persistence,
    )
    return config


# ─── Virtual Line Configuration ──────────────────────────────────────────────
@app.get("/api/config/virtual-line", response_model=schemas.VirtualLineConfig)
async def get_virtual_line_config(db: Session = Depends(get_db)):
    settings = db.query(models.SystemSetting).filter(
        models.SystemSetting.key.in_([
            "virtual_line_y_percent", "virtual_line_span_percent", "virtual_line_direction"
        ])
    ).all()
    config = {s.key: s.value for s in settings}

    return schemas.VirtualLineConfig(
        position_percent=int(config.get("virtual_line_y_percent", "60")),
        line_span_percent=int(config.get("virtual_line_span_percent", "80")),
        direction=config.get("virtual_line_direction", "left-right"),
    )


@app.put("/api/config/virtual-line", response_model=schemas.VirtualLineConfig)
async def update_virtual_line_config(config: schemas.VirtualLineConfig, db: Session = Depends(get_db)):
    mapping = {
        "virtual_line_y_percent": str(config.position_percent),
        "virtual_line_span_percent": str(config.line_span_percent),
        "virtual_line_direction": config.direction,
    }
    for key, value in mapping.items():
        setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
        if setting:
            setting.value = value
        else:
            db.add(models.SystemSetting(key=key, value=value))
    db.commit()

    v_engine = vision_engine.get_vision_engine()
    v_engine.apply_virtual_line_config(
        position_percent=config.position_percent,
        line_span_percent=config.line_span_percent,
        direction=config.direction,
    )
    return config


@app.get("/api/config/line")
async def get_line_config(db: Session = Depends(get_db)):
    cfg = await get_virtual_line_config(db)
    line_type = "vertical" if cfg.direction in ["left-right", "right-left"] else "horizontal"
    return {
        "type": line_type,
        "direction": cfg.direction,
        "position_percent": cfg.position_percent,
        "line_span_percent": cfg.line_span_percent,
    }


@app.put("/api/config/line")
async def update_line_config(payload: dict, db: Session = Depends(get_db)):
    direction = payload.get("direction", "left-right")
    line_type = payload.get("type")
    position_percent = int(payload.get("position_percent", 60))
    line_span_percent = int(payload.get("line_span_percent", 80))

    # Force coherence between type and direction
    if direction in ["top-down", "bottom-up"]:
        line_type = "horizontal"
    elif direction in ["left-right", "right-left"]:
        line_type = "vertical"

    cfg = schemas.VirtualLineConfig(
        position_percent=position_percent,
        line_span_percent=line_span_percent,
        direction=direction,
    )
    await update_virtual_line_config(cfg, db)
    return {
        "type": line_type,
        "direction": direction,
        "position_percent": position_percent,
        "line_span_percent": line_span_percent,
    }


# ─── Auth ─────────────────────────────────────────────────────────────────────
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


# ─── Sessions ─────────────────────────────────────────────────────────────────
@app.get("/sessions/active", response_model=schemas.Session | None)
async def read_active_session(db: Session = Depends(get_db)):
    return db.query(models.Session).filter(models.Session.status == "active").order_by(models.Session.start_time.desc()).first()


@app.get("/sessions/", response_model=schemas.SessionListResponse)
async def read_sessions(
    page: int = 1,
    page_size: int = 20,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)

    query = db.query(models.Session)
    if status:
        query = query.filter(models.Session.status == status)

    total = query.count()
    items = query.order_by(models.Session.start_time.desc()).offset((page - 1) * page_size).limit(page_size).all()
    active = db.query(models.Session).filter(models.Session.status == "active").first()
    return {
        "items": items,
        "total": total,
        "active_session_id": active.id if active else None,
    }


@app.post("/sessions/start", response_model=schemas.Session)
async def start_session(db: Session = Depends(get_db)):
    import datetime
    active = db.query(models.Session).filter(models.Session.status == "active").first()
    if active:
        return active

    session_id = f"S-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"
    db_session = models.Session(id=session_id)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    v_engine = vision_engine.get_vision_engine()
    v_engine.set_active_session(session_id)

    return db_session


@app.post("/sessions/stop/{session_id}", response_model=schemas.Session)
async def stop_session(session_id: str, db: Session = Depends(get_db)):
    import datetime
    db_session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    if db_session.status != "active":
        return db_session

    db_session.end_time = datetime.datetime.utcnow()
    db_session.status = "completed"
    db.commit()
    db.refresh(db_session)

    v_engine = vision_engine.get_vision_engine()
    if v_engine.active_session_id == session_id:
        v_engine.set_active_session(None)

    return db_session


@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    if db_session.status == "active":
        raise HTTPException(status_code=400, detail="Cannot delete active session")

    db.query(models.DetectionLog).filter(models.DetectionLog.session_id == session_id).delete()
    db.delete(db_session)
    db.commit()
    return {"deleted": 1, "session_id": session_id}


@app.delete("/api/sessions/batch")
async def delete_sessions_batch(payload: dict, db: Session = Depends(get_db)):
    session_ids = payload.get("session_ids", [])
    if not session_ids:
        return {"deleted": 0}

    active = db.query(models.Session).filter(models.Session.id.in_(session_ids), models.Session.status == "active").count()
    if active > 0:
        raise HTTPException(status_code=400, detail="Cannot delete active sessions")

    db.query(models.DetectionLog).filter(models.DetectionLog.session_id.in_(session_ids)).delete(synchronize_session=False)
    deleted = db.query(models.Session).filter(models.Session.id.in_(session_ids)).delete(synchronize_session=False)
    db.commit()
    return {"deleted": deleted}


# ─── Entrypoint ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        timeout_graceful_shutdown=5,
    )
