"""
Fixtures partagées pour la suite de tests.
Utilise une base SQLite en mémoire isolée pour chaque session de test.
"""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Forcer une DB en mémoire et un secret de test AVANT l'import de l'appli
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("JWT_SECRET_KEY", "test_secret_key_not_for_production_32chars")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")

from app.database import Base, get_db  # noqa: E402 — doit venir après les env vars
from app import models, auth  # noqa: E402


# ── Base de données de test (en mémoire, recréée pour chaque test) ────────────
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Crée toutes les tables une seule fois pour la session de test."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def db():
    """Session DB fraîche pour chaque test, rollback automatique après."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db):
    """Client HTTP de test avec DB isolée."""
    # Import ici pour éviter les effets de bord au module level
    from app.main import app
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_user(db) -> models.User:
    """Crée un utilisateur admin pour les tests."""
    # Crée le rôle admin s'il n'existe pas
    role = db.query(models.Role).filter(models.Role.name == "admin").first()
    if not role:
        role = models.Role(
            name="admin",
            label="Administrateur",
            description="Accès complet",
            permissions='["*"]',
            is_builtin=True,
        )
        db.add(role)

    user = models.User(
        username="test_admin",
        hashed_password=auth.get_password_hash("password123"),
        full_name="Test Admin",
        role="admin",
        is_active=True,
        login_count=0,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def operator_user(db) -> models.User:
    """Crée un utilisateur opérateur (non-admin) pour les tests."""
    role = db.query(models.Role).filter(models.Role.name == "operateur").first()
    if not role:
        role = models.Role(
            name="operateur",
            label="Opérateur",
            description="Accès opérations",
            permissions='["dashboard_view", "sessions_manage"]',
            is_builtin=False,
        )
        db.add(role)

    user = models.User(
        username="test_operator",
        hashed_password=auth.get_password_hash("password123"),
        full_name="Test Operator",
        role="operateur",
        is_active=True,
        login_count=0,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def admin_token(client, admin_user) -> str:
    """Retourne un token JWT valide pour l'admin de test."""
    response = client.post(
        "/token",
        data={"username": "test_admin", "password": "password123"},
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["access_token"]


@pytest.fixture()
def operator_token(client, operator_user) -> str:
    """Retourne un token JWT valide pour l'opérateur de test."""
    response = client.post(
        "/token",
        data={"username": "test_operator", "password": "password123"},
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
