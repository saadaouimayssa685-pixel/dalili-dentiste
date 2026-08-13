from __future__ import annotations

from dataclasses import dataclass

from app.config import settings

from .text import normalize_text


@dataclass(frozen=True)
class LocationMatch:
    name: str | None
    governorate: str | None = None


class TunisiaLocations:
    def __init__(self) -> None:
        self.gov_aliases: dict[str, str] = {}
        self.locality_aliases: dict[str, LocationMatch] = {}
        for gov in settings.locations.get("governorates", []):
            name = gov["name"]
            for alias in [name, *gov.get("aliases", [])]:
                self.gov_aliases[normalize_text(alias)] = name
            for loc in gov.get("localities", []):
                for alias in [loc["name"], *loc.get("aliases", [])]:
                    self.locality_aliases[normalize_text(alias)] = LocationMatch(loc["name"], name)

    def governorate(self, value: str | None) -> str | None:
        return self.gov_aliases.get(normalize_text(value), value.strip() if value else None)

    def locality(self, value: str | None) -> LocationMatch:
        key = normalize_text(value)
        return self.locality_aliases.get(key, LocationMatch(value.strip() if value else None, None))

    def same_governorate(self, a: str | None, b: str | None) -> bool:
        return bool(a and b and self.governorate(a) == self.governorate(b))

    def same_locality(self, a: str | None, b: str | None) -> bool:
        return bool(a and b and normalize_text(self.locality(a).name) == normalize_text(self.locality(b).name))


locations = TunisiaLocations()

