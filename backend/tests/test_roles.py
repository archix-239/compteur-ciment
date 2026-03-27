"""
Tests endpoints rôles — /api/roles/
"""
from tests.conftest import auth_header


class TestRoleList:
    def test_list_roles_unauthenticated(self, client):
        response = client.get("/api/roles/")
        assert response.status_code == 401

    def test_list_roles_authenticated(self, client, operator_token):
        # Tout utilisateur authentifié peut lire la liste des rôles
        response = client.get("/api/roles/", headers=auth_header(operator_token))
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_permissions_catalog_authenticated(self, client, operator_token):
        response = client.get("/api/roles/permissions", headers=auth_header(operator_token))
        assert response.status_code == 200

    def test_permissions_catalog_unauthenticated(self, client):
        response = client.get("/api/roles/permissions")
        assert response.status_code == 401


class TestCreateRole:
    def test_create_role_unauthenticated(self, client):
        response = client.post("/api/roles/", json={
            "name": "test_role", "label": "Test", "description": "", "permissions": [],
        })
        assert response.status_code == 401

    def test_create_role_as_operator(self, client, operator_token):
        response = client.post(
            "/api/roles/",
            json={"name": "test_role2", "label": "Test2", "description": "", "permissions": []},
            headers=auth_header(operator_token),
        )
        assert response.status_code == 403

    def test_create_role_as_admin(self, client, admin_token):
        response = client.post(
            "/api/roles/",
            json={"name": "custom_role", "label": "Custom Role", "description": "Test role", "permissions": ["dashboard_view"]},
            headers=auth_header(admin_token),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "custom_role"
        assert "dashboard_view" in data["permissions"]

    def test_create_role_invalid_name(self, client, admin_token):
        response = client.post(
            "/api/roles/",
            json={"name": "Invalid Role Name!", "label": "Bad", "description": "", "permissions": []},
            headers=auth_header(admin_token),
        )
        assert response.status_code == 400

    def test_create_role_duplicate(self, client, admin_token):
        payload = {"name": "dup_role", "label": "Dup", "description": "", "permissions": []}
        client.post("/api/roles/", json=payload, headers=auth_header(admin_token))
        response = client.post("/api/roles/", json=payload, headers=auth_header(admin_token))
        assert response.status_code == 409


class TestDeleteRole:
    def test_delete_builtin_role_forbidden(self, client, admin_token, db):
        from app import models
        builtin = db.query(models.Role).filter(models.Role.is_builtin).first()
        if builtin:
            response = client.delete(f"/api/roles/{builtin.id}", headers=auth_header(admin_token))
            assert response.status_code == 400

    def test_delete_custom_role(self, client, admin_token, db):
        from app import models
        role = models.Role(
            name="to_delete_role", label="Delete Me", description="",
            permissions="[]", is_builtin=False,
        )
        db.add(role)
        db.commit()
        db.refresh(role)
        response = client.delete(f"/api/roles/{role.id}", headers=auth_header(admin_token))
        assert response.status_code == 200
