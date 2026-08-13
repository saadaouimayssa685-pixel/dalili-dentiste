from __future__ import annotations

from pathlib import Path

import httpx


GEOFABRIK_TUNISIA_LATEST = "https://download.geofabrik.de/africa/tunisia-latest.osm.pbf"


def download_tunisia_pbf(output_path: str | Path = "data/osm/tunisia-latest.osm.pbf") -> Path:
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with httpx.stream("GET", GEOFABRIK_TUNISIA_LATEST, follow_redirects=True, timeout=120) as response:
        response.raise_for_status()
        with path.open("wb") as fh:
            for chunk in response.iter_bytes():
                if chunk:
                    fh.write(chunk)
    return path


if __name__ == "__main__":
    print(download_tunisia_pbf())
