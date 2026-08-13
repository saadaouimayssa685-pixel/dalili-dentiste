import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.source_runner import source_app

app = source_app("tunisie_dentiste", default_governorate="Tunis")

if __name__ == "__main__":
    app()
