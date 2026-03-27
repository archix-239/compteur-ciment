"""
Tests gestion des clés API — /api/apikeys/
"""
from tests.conftest import auth_header


class TestApiKeys:
    def test_list_keys_unauthenticated(self, client):
        response = client.get("/api/apikeys/")
        assert response.status_code == 401

    def test_list_keys_authenticated(self, client, admin_token):
        response = client.get("/api/apikeys/", headers=auth_header(admin_token))
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_create_key_returns_raw_key_once(self, client, admin_token):
        response = client.post(
            "/api/apikeys/",
            json={"name": "Test Key", "scope": "read"},
            headers=auth_header(admin_token),
        )
        assert response.status_code == 201
        data = response.json()
        assert "raw_key" in data
        assert data["raw_key"].startswith("cmt_")
        assert len(data["raw_key"]) > 10
        # Le raw_key ne doit PAS être stocké tel quel côté serveur
        key_id = data["id"]

        # Vérifier que la liste ne retourne PAS le raw_key
        list_response = client.get("/api/apikeys/", headers=auth_header(admin_token))
        keys_in_list = list_response.json()
        listed_key = next((k for k in keys_in_list if k["id"] == key_id), None)
        assert listed_key is not None
        assert "raw_key" not in listed_key

    def test_create_key_invalid_scope(self, client, admin_token):
        response = client.post(
            "/api/apikeys/",
            json={"name": "Bad Key", "scope": "superadmin"},
            headers=auth_header(admin_token),
        )
        assert response.status_code in (400, 422)

    def test_revoke_key(self, client, admin_token):
        # Crée une clé
        create_response = client.post(
            "/api/apikeys/",
            json={"name": "To Revoke", "scope": "read"},
            headers=auth_header(admin_token),
        )
        assert create_response.status_code == 201
        key_id = create_response.json()["id"]

        # Révoque la clé
        delete_response = client.delete(
            f"/api/apikeys/{key_id}",
            headers=auth_header(admin_token),
        )
        assert delete_response.status_code == 200

    def test_revoke_nonexistent_key(self, client, admin_token):
        response = client.delete("/api/apikeys/99999", headers=auth_header(admin_token))
        assert response.status_code == 404
