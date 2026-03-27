"""
Tests d'authentification — POST /token, GET /api/users/me
"""
from tests.conftest import auth_header


class TestLogin:
    def test_login_success(self, client, admin_user):
        response = client.post(
            "/token",
            data={"username": "test_admin", "password": "password123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, admin_user):
        response = client.post(
            "/token",
            data={"username": "test_admin", "password": "wrongpassword"},
        )
        assert response.status_code == 401

    def test_login_unknown_user(self, client):
        response = client.post(
            "/token",
            data={"username": "nobody", "password": "anything"},
        )
        assert response.status_code == 401

    def test_login_inactive_user(self, client, db, admin_user):
        admin_user.is_active = False
        db.commit()
        response = client.post(
            "/token",
            data={"username": "test_admin", "password": "password123"},
        )
        # Inactive user should be rejected at token validation step
        assert response.status_code in (400, 401)


class TestCurrentUser:
    def test_get_me_authenticated(self, client, admin_token):
        response = client.get("/api/users/me", headers=auth_header(admin_token))
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "test_admin"
        assert data["role"] == "admin"
        assert "permissions" in data

    def test_get_me_no_token(self, client):
        response = client.get("/api/users/me")
        assert response.status_code == 401

    def test_get_me_invalid_token(self, client):
        response = client.get(
            "/api/users/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert response.status_code == 401
