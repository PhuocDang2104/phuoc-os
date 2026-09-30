import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy.exc import OperationalError

from app.core.config import Settings
from app.main import create_app


def test_liveness_is_independent_of_database():
    with TestClient(create_app(Settings(_env_file=None))) as client:
        assert client.get("/health").json() == {"status": "ok"}
        response = client.get("/health/db")
        assert response.status_code == 503
        assert response.json() == {"detail": "Database unavailable"}


def test_database_errors_do_not_expose_credentials():
    class BrokenEngine:
        def connect(self):
            raise OperationalError("postgres://private:secret@host/db", {}, Exception())

    application = create_app(Settings(_env_file=None))
    with TestClient(application) as client:
        application.state.engine = BrokenEngine()
        response = client.get("/health/db")
        assert response.status_code == 503
        assert "secret" not in response.text


def test_only_configured_origins_receive_cors_headers():
    with TestClient(create_app(Settings(_env_file=None))) as client:
        allowed = client.get("/health", headers={"Origin": "http://localhost:3000"})
        rejected = client.get("/health", headers={"Origin": "https://untrusted.example"})
        assert allowed.headers["access-control-allow-origin"] == "http://localhost:3000"
        assert "access-control-allow-origin" not in rejected.headers


@pytest.mark.parametrize("origins", [["*"], ["http://localhost:3000"], []])
def test_production_rejects_unsafe_cors(origins):
    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            app_env="production",
            postgres_password="test-only-password",
            cors_origins=origins,
        )
