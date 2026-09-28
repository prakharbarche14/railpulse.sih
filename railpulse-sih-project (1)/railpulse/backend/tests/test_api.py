def test_health_check(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_list_trains_seeded(client):
    resp = client.get("/api/trains")
    assert resp.status_code == 200
    trains = resp.json()
    assert len(trains) == 5
    numbers = {t["train_number"] for t in trains}
    assert "12155" in numbers


def test_search_trains_by_name(client):
    resp = client.get("/api/trains", params={"q": "Bhopal"})
    assert resp.status_code == 200
    trains = resp.json()
    assert any("Bhopal" in t["train_name"] for t in trains)


def test_train_detail_has_route_and_eta(client):
    resp = client.get("/api/trains/12155")
    assert resp.status_code == 200
    data = resp.json()
    assert data["train"]["train_number"] == "12155"
    assert len(data["route"]) == 8
    assert len(data["eta"]) > 0
    for stop in data["eta"]:
        assert "predicted_arrival" in stop
        assert "confidence" in stop


def test_train_not_found(client):
    resp = client.get("/api/trains/99999")
    assert resp.status_code == 404


def test_register_and_login(client):
    resp = client.post(
        "/api/auth/register",
        json={"name": "Test User", "email": "test.user@example.com", "password": "supersecret"},
    )
    assert resp.status_code == 201
    token = resp.json()["access_token"]
    assert token

    resp = client.post(
        "/api/auth/login",
        json={"email": "test.user@example.com", "password": "supersecret"},
    )
    assert resp.status_code == 200
    assert resp.json()["user"]["email"] == "test.user@example.com"


def test_login_wrong_password_fails(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": "test.user@example.com", "password": "wrongpassword"},
    )
    assert resp.status_code == 401


def test_subscribe_requires_auth(client):
    resp = client.post("/api/trains/12155/subscribe")
    assert resp.status_code == 401


def test_subscribe_with_auth(client):
    login = client.post(
        "/api/auth/login",
        json={"email": "test.user@example.com", "password": "supersecret"},
    )
    token = login.json()["access_token"]
    resp = client.post(
        "/api/trains/12155/subscribe",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["subscribed"] is True


def test_admin_metrics_requires_admin_role(client):
    login = client.post(
        "/api/auth/login",
        json={"email": "test.user@example.com", "password": "supersecret"},
    )
    token = login.json()["access_token"]
    resp = client.get("/api/admin/metrics", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


def test_admin_metrics_with_demo_admin(client):
    login = client.post(
        "/api/auth/login",
        json={"email": "admin@railpulse.demo", "password": "password123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    resp = client.get("/api/admin/metrics", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_tracked_trains"] == 5


def test_analytics_dashboard_stats(client):
    resp = client.get("/api/analytics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["active_trains"] == 5
    assert 0 <= data["on_time_pct"] <= 100
