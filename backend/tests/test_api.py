
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_lead():
    response = client.post(
        "/api/leads",
        json={
            "name": "Automated Test Lead",
            "company": "Test Company",
            "phone": "9876543210",
        },
    )

    assert response.status_code == 201

    data = response.json()
    assert data["name"] == "Automated Test Lead"
    assert data["status"] == "New"
    assert "id" in data

def test_update_lead_status():
    create_response = client.post(
        "/api/leads",
        json={"name": "Status Test Lead"},
    )
    assert create_response.status_code == 201
    lead_id = create_response.json()["id"]

    response = client.patch(
        f"/api/leads/{lead_id}",
        json={"status": "Qualified"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "Qualified"


def test_add_discussion_and_follow_up():
    create_response = client.post(
        "/api/leads",
        json={"name": "Discussion Test Lead"},
    )
    assert create_response.status_code == 201
    lead_id = create_response.json()["id"]

    response = client.post(
        f"/api/leads/{lead_id}/discussions",
        json={
            "note": "Discussed the requirements.",
            "follow_up_at": "2026-10-16T10:00:00+05:30",
        },
    )

    assert response.status_code == 201
    result = response.json()
    assert result["discussion"]["note"] == "Discussed the requirements."
    assert result["lead"]["next_follow_up_at"] is not None

    history_response = client.get(
        f"/api/leads/{lead_id}/discussions"
    )
    assert history_response.status_code == 200
    assert any(
        item["note"] == "Discussed the requirements."
        for item in history_response.json()
    )
