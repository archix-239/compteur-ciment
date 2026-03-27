import logging
from .database import SessionLocal, engine
from . import models, auth

logger = logging.getLogger("ciment.init_db")

def init_db():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create default admin user
    admin_user = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin_user:
        hashed_pw = auth.get_password_hash("admin123")
        admin_user = models.User(
            username="admin",
            hashed_password=hashed_pw,
            full_name="Administrateur Système",
            role="admin"
        )
        db.add(admin_user)

    # Create default alert rules
    rules = [
        {"name": "Cadence Faible", "type": "production_rate", "threshold": 15.0},
        {"name": "Taux de Rejet Élevé", "type": "error_rate", "threshold": 10.0},
    ]
    for r in rules:
        rule = db.query(models.AlertRule).filter(models.AlertRule.name == r["name"]).first()
        if not rule:
            db.add(models.AlertRule(**r))

    # Create default settings
    settings = [
        {"key": "camera_url", "value": "0"},
        {"key": "camera_source_type", "value": "webcam"},
        {"key": "camera_resolution", "value": "720p"},
        {"key": "camera_fps", "value": "30"},
        {"key": "camera_brightness", "value": "50"},
        {"key": "camera_contrast", "value": "65"},
        {"key": "camera_autofocus", "value": "true"},
        {"key": "detection_model_path", "value": "models/best_V5.pt"},
        {"key": "detection_threshold", "value": "0.7"},
        {"key": "detection_nms_iou", "value": "0.45"},
        {"key": "detection_max_det", "value": "100"},
        {"key": "detection_imgsz", "value": "1280"},
        {"key": "tracking_persistence", "value": "true"},
        {"key": "virtual_line_x", "value": "640"},
        {"key": "virtual_line_y_percent", "value": "60"},
        {"key": "virtual_line_span_percent", "value": "80"},
        {"key": "virtual_line_direction", "value": "left-right"},
    ]
    for s in settings:
        setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == s["key"]).first()
        if not setting:
            db.add(models.SystemSetting(**s))

    db.commit()
    db.close()

if __name__ == "__main__":
    init_db()
    logger.info("Base de donnees initialisee avec succes.")
