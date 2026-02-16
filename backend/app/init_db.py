from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from . import models, auth

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
        {"key": "detection_threshold", "value": "0.7"},
        {"key": "virtual_line_x", "value": "640"},
    ]
    for s in settings:
        setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == s["key"]).first()
        if not setting:
            db.add(models.SystemSetting(**s))

    db.commit()
    db.close()

if __name__ == "__main__":
    init_db()
    print("Base de données initialisée avec succès.")
