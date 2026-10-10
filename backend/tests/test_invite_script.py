import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]


def test_import_script_runs_standalone(tmp_path, api_client):
    """The CLI imports the guest list without the FastAPI app loaded, so every
    model it needs must be registered by the script itself."""
    csv_file = tmp_path / "invitati.csv"
    csv_file.write_text(
        "first_name,last_name,gender,relation,head,family_name,phone,party_size\n"
        "Christian,Rossi,m,,,Rossi,,\n"
        "Arianna,Rossi,f,spouse,Christian Rossi,,,\n",
        encoding="utf-8",
    )
    result = subprocess.run(
        [sys.executable, str(BACKEND / "scripts" / "generate_invite_links.py"), str(csv_file), "--base-url", "https://site.test"],
        capture_output=True, text=True, cwd=BACKEND, check=False,
    )
    assert result.returncode == 0, result.stderr
    assert "Christian Rossi -> https://site.test/invito/" in result.stdout
    assert "2 persone create" in result.stdout
    assert (tmp_path / "invitati_output.csv").exists()
