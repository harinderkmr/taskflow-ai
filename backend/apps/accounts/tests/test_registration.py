import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.mark.django_db
def test_user_can_register():
    client = APIClient()
    response = client.post(
        "/api/v1/auth/register/",
        {
            "email": "harinder@test.com",
            "password": "Password@123",
            "confirm_password": "Password@123",
            "first_name": "Harinder",
            "last_name": "Kumar",
        },
        format="json",
    )
    assert response.status_code == 201
    assert "user" in response.data
    assert "access" in response.data
    assert "refresh" in response.data


@pytest.mark.django_db
def test_user_can_login():
    User.objects.create_user(
        email="harinder@test.com",
        password="Password@123",
        first_name="Harinder",
        last_name="Kumar",
    )

    client = APIClient()
    response = client.post(
        "/api/v1/auth/login/",
        {
            "email": "harinder@test.com",
            "password": "Password@123",
        },
        format="json",
    )
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data
    assert response.data["user"]["email"] == "harinder@test.com"


@pytest.mark.django_db
def test_authenticated_user_can_get_profile():
    user = User.objects.create_user(
        email="harinder@test.com",
        password="Password@123",
        first_name="Harinder",
        last_name="Kumar",
    )

    client = APIClient()
    
    # Try fetching without auth first
    response = client.get("/api/v1/auth/me/")
    assert response.status_code == 401

    # Authenticate the client
    client.force_authenticate(user=user)
    response = client.get("/api/v1/auth/me/")
    assert response.status_code == 200
    assert response.data["email"] == "harinder@test.com"
    assert response.data["first_name"] == "Harinder"
