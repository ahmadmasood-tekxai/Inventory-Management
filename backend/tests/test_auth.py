def test_register_and_login(client):
    resp = client.post(
        "/api/v1/auth/register",
        json={"username": "ahmed", "email": "ahmed@qasim.example.com", "password": "MyPass123", "full_name": "Ahmed"},
    )
    assert resp.status_code == 201
    assert resp.json()["username"] == "ahmed"

    login = client.post("/api/v1/auth/login", json={"username": "ahmed", "password": "MyPass123"})
    assert login.status_code == 200
    body = login.json()
    assert "access_token" in body
    assert body["user"]["username"] == "ahmed"


def test_login_wrong_password_fails(client):
    client.post(
        "/api/v1/auth/register",
        json={"username": "ahmed2", "email": "ahmed2@qasim.example.com", "password": "MyPass123"},
    )
    resp = client.post("/api/v1/auth/login", json={"username": "ahmed2", "password": "WrongPass"})
    assert resp.status_code == 401


def test_duplicate_username_rejected(client):
    payload = {"username": "dupe", "email": "dupe@qasim.example.com", "password": "Password1"}
    first = client.post("/api/v1/auth/register", json=payload)
    second = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201
    assert second.status_code == 409


def test_protected_route_requires_token(client):
    resp = client.get("/api/v1/items")
    assert resp.status_code == 401
