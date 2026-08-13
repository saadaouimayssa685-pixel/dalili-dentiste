from __future__ import annotations

import base64
import csv
import hashlib
import hmac
import os
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "database" / "dentists_tunisia.db"
DEFAULT_OUTPUT = ROOT / "data" / "public" / "dentists_public_index.csv"


def _load_local_secret() -> str:
    env_secret = os.getenv("DALILI_PUBLIC_PHONE_SECRET", "").strip()
    if env_secret:
        return env_secret

    secret_file = ROOT / ".local" / "public_phone_secret.txt"
    if secret_file.exists():
        return secret_file.read_text(encoding="utf-8").strip()

    # Stable local fallback for repeatable development exports.
    # Do not rely on this for a real public release; set DALILI_PUBLIC_PHONE_SECRET.
    return "dalili-dentiste-local-public-index-secret"


def _normalize_phone(phone: str | None) -> str:
    if not phone:
        return ""
    digits = "".join(ch for ch in phone if ch.isdigit())
    if digits.startswith("216") and len(digits) > 8:
        return digits
    if len(digits) == 8:
        return "216" + digits
    return digits


def _pseudonymize_phone(phone: str | None, secret: str) -> tuple[str, str, bool]:
    normalized = _normalize_phone(phone)
    if not normalized:
        return "", "", False

    key = secret.encode("utf-8")
    digest = hmac.new(key, normalized.encode("utf-8"), hashlib.sha256).digest()
    token = base64.urlsafe_b64encode(digest[:18]).decode("ascii").rstrip("=")
    short_hash = hmac.new(key, normalized.encode("utf-8"), hashlib.sha256).hexdigest()[:16]
    return f"telenc_{token}", short_hash, True


def export_public_index(db_path: Path = DEFAULT_DB, output_path: Path = DEFAULT_OUTPUT) -> int:
    secret = _load_local_secret()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    rows = con.execute(
        """
        SELECT
            full_name,
            title,
            specialties,
            governorate,
            delegation,
            locality,
            phone,
            sources,
            source_count,
            quality_score,
            quality_status,
            updated_at
        FROM dentists_clean
        WHERE full_name IS NOT NULL AND TRIM(full_name) != ''
        ORDER BY governorate, locality, full_name
        """
    ).fetchall()
    con.close()

    with output_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "full_name",
                "title",
                "specialties",
                "governorate",
                "delegation",
                "locality",
                "has_phone",
                "phone_encrypted",
                "phone_hash",
                "sources",
                "source_count",
                "quality_score",
                "quality_status",
                "updated_at",
            ]
        )

        for row in rows:
            phone_encrypted, phone_hash, has_phone = _pseudonymize_phone(row["phone"], secret)
            writer.writerow(
                [
                    row["full_name"] or "",
                    row["title"] or "",
                    row["specialties"] or "",
                    row["governorate"] or "",
                    row["delegation"] or "",
                    row["locality"] or "",
                    int(has_phone),
                    phone_encrypted,
                    phone_hash,
                    row["sources"] or "",
                    row["source_count"] if row["source_count"] is not None else "",
                    row["quality_score"] if row["quality_score"] is not None else "",
                    row["quality_status"] or "",
                    row["updated_at"] or "",
                ]
            )

    return len(rows)


if __name__ == "__main__":
    total = export_public_index()
    print(f"Exported {total} public records to {DEFAULT_OUTPUT}")
