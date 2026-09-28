import os
import tempfile

import pytest

# Point at a throwaway SQLite file *before* app modules are imported, so
# database.py picks it up instead of the real dev railpulse.db.
_tmp_dir = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_tmp_dir, 'test_railpulse.db')}"

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c
