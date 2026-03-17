"""
Tests paramètres système — /api/system/general-settings, /api/system/security-settings
"""
import pytest
from tests.conftest import auth_header


class TestGeneralSettings:
    def test_get_settings_unauthenticated(self, client):
        response = client.get("/api/system/general-settings")
        assert response.status_code == 401

    def test_get_settings_authenticated(self, client, admin_token):
        response = client.get("/api/system/general-settings", headers=auth_header(admin_token))
        assert response.status_code == 200
        data = response.json()
        assert "site_name" in data

    def test_put_settings_as_admin(self, client, admin_token):
        response = client.put(
            "/api/system/general-settings",
            json={"site_name": "Test Site", "site_location": "Test Location"},
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200

    def test_get_settings_reflects_update(self, client, admin_token):
        client.put(
            "/api/system/general-settings",
            json={"site_name": "Updated Site Name"},
            headers=auth_header(admin_token),
        )
        response = client.get("/api/system/general-settings", headers=auth_header(admin_token))
        assert response.status_code == 200
        assert response.json().get("site_name") == "Updated Site Name"


class TestSecuritySettings:
    def test_get_security_settings_authenticated(self, client, admin_token):
        response = client.get("/api/system/security-settings", headers=auth_header(admin_token))
        assert response.status_code == 200
        data = response.json()
        assert "jwt_expire_minutes" in data
        assert "max_login_attempts" in data

    def test_get_security_settings_unauthenticated(self, client):
        response = client.get("/api/system/security-settings")
        assert response.status_code == 401
