import pytest

from rest_framework.test import APIClient


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
