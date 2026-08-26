from alembic.config import Config
from alembic.script import ScriptDirectory
from pathlib import Path


def test_current_head_matches_initial_migration():
    backend_dir = Path(__file__).resolve().parents[1]
    script = ScriptDirectory.from_config(Config(str(backend_dir / "alembic.ini")))

    assert script.get_current_head() == "20260826_0005"
