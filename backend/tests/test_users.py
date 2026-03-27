"""
Tests endpoints utilisateurs — /api/users/
Vérifie l'authentification, les permissions admin, le CRUD.
"""
from tests.conftest import auth_header


class TestUserListSecurity:
    """L'endpoint GET /api/users/ requiert une authentification admin."""

    def test_list_users_unauthenticated(self, client):
        response = client.get("/api/users/")
        assert response.status_code == 401

    def test_list_users_as_operator(self, client, operator_token):
        response = client.get("/api/users/", headers=auth_header(operator_token))
        assert response.status_code == 403

    def test_list_users_as_admin(self, client, admin_token, admin_user):
        response = client.get("/api/users/", headers=auth_header(admin_token))
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert any(u["username"] == "test_admin" for u in data)


class TestCreateUser:
    def test_create_user_unauthenticated(self, client):
        response = client.post("/api/users/", json={
            "username": "newuser", "password": "pass123",
            "role": "operateur", "full_name": "New User",
        })
        assert response.status_code == 401

    def test_create_user_as_operator(self, client, operator_token):
        response = client.post(
            "/api/users/",
            json={"username": "newuser2", "password": "pass123", "role": "operateur", "full_name": ""},
            headers=auth_header(operator_token),
        )
        assert response.status_code == 403

    def test_create_user_as_admin(self, client, admin_token):
        response = client.post(
            "/api/users/",
            json={"username": "created_user", "password": "securepass", "role": "operateur", "full_name": "Created"},
            headers=auth_header(admin_token),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "created_user"
        assert "hashed_password" not in data

    def test_create_user_duplicate_username(self, client, admin_token, admin_user):
        response = client.post(
            "/api/users/",
            json={"username": "test_admin", "password": "pass123", "role": "operateur", "full_name": ""},
            headers=auth_header(admin_token),
        )
        assert response.status_code == 409

    def test_create_user_short_password(self, client, admin_token):
        response = client.post(
            "/api/users/",
            json={"username": "shortpwduser", "password": "abc", "role": "operateur", "full_name": ""},
            headers=auth_header(admin_token),
        )
        assert response.status_code in (400, 422)


class TestUpdateUser:
    def test_update_user_unauthenticated(self, client, operator_user):
        response = client.put(f"/api/users/{operator_user.id}", json={"full_name": "Changed"})
        assert response.status_code == 401

    def test_update_user_as_operator(self, client, operator_token, admin_user):
        response = client.put(
            f"/api/users/{admin_user.id}",
            json={"full_name": "Hacked"},
            headers=auth_header(operator_token),
        )
        assert response.status_code == 403

    def test_update_user_as_admin(self, client, admin_token, operator_user):
        response = client.put(
            f"/api/users/{operator_user.id}",
            json={"full_name": "Updated Name"},
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        assert response.json()["full_name"] == "Updated Name"

    def test_update_nonexistent_user(self, client, admin_token):
        response = client.put(
            "/api/users/99999",
            json={"full_name": "Ghost"},
            headers=auth_header(admin_token),
        )
        assert response.status_code == 404


class TestDeleteUser:
    def test_delete_user_unauthenticated(self, client, operator_user):
        response = client.delete(f"/api/users/{operator_user.id}")
        assert response.status_code == 401

    def test_delete_user_as_operator(self, client, operator_token, admin_user):
        response = client.delete(
            f"/api/users/{admin_user.id}",
            headers=auth_header(operator_token),
        )
        assert response.status_code == 403

    def test_admin_cannot_delete_self(self, client, admin_token, admin_user):
        response = client.delete(
            f"/api/users/{admin_user.id}",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 400

    def test_delete_user_as_admin(self, client, admin_token, db):
        from app import models, auth as app_auth
        # Crée un utilisateur temporaire à supprimer
        temp = models.User(
            username="to_delete", hashed_password=app_auth.get_password_hash("pass123"),
            full_name="Temp", role="operateur", is_active=True, login_count=0,
        )
        db.add(temp)
        db.commit()
        db.refresh(temp)
        response = client.delete(f"/api/users/{temp.id}", headers=auth_header(admin_token))
        assert response.status_code == 200


class TestUserActivity:
    def test_activity_unauthenticated(self, client):
        response = client.get("/api/users/activity")
        assert response.status_code == 401

    def test_activity_as_operator(self, client, operator_token):
        response = client.get("/api/users/activity", headers=auth_header(operator_token))
        assert response.status_code == 403

    def test_activity_as_admin(self, client, admin_token):
        response = client.get("/api/users/activity", headers=auth_header(admin_token))
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data

    def test_activity_pagination(self, client, admin_token):
        response = client.get(
            "/api/users/activity?limit=5&page=1",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) <= 5
