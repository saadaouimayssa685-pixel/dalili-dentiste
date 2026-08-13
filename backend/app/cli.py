from __future__ import annotations

from pathlib import Path
from typing import Optional

import typer

from app.config import settings
from app.database import SessionLocal, init_db, list_unique_dentists, rebuild_unique_dentists
from app.exporters import export_csv, export_json
from app.logging_config import configure_logging
from app.repositories.dentists import DentistRepository
from app.scrapers.osm_pbf import extract_osm_dentists
from app.services.pipeline import ScrapingPipeline
from scripts.download_osm_tunisia import download_tunisia_pbf

app = typer.Typer(help="Collecte responsable des dentistes publics en Tunisie depuis plusieurs annuaires.")


def _pipeline(output_dir: str, log_level: str) -> ScrapingPipeline:
    configure_logging(log_level)
    init_db()
    return ScrapingPipeline(SessionLocal(), output_dir)


@app.command("scrape-listings")
def scrape_listings(
    governorate: Optional[str] = typer.Option(None, "--governorate"),
    source: str = "med.tn",
    limit: Optional[int] = None,
    output_dir: str = "outputs",
    log_level: str = "INFO",
) -> None:
    pipe = _pipeline(output_dir, log_level)
    items = pipe.scrape_source_listings(source, governorate, limit)
    typer.echo(f"Profils détectés: {len(items)}")


@app.command("scrape-profiles")
def scrape_profiles(
    governorate: Optional[str] = typer.Option(None, "--governorate"),
    source: str = "med.tn",
    limit: Optional[int] = 5,
    resume: bool = True,
    force_refresh: bool = False,
    output_dir: str = "outputs",
    log_level: str = "INFO",
) -> None:
    pipe = _pipeline(output_dir, log_level)
    items = pipe.scrape_source_listings(source, governorate, limit)
    records = pipe.scrape_profiles(items, resume=resume, force_refresh=force_refresh)
    typer.echo(f"Profils collectés: {len(records)}")


@app.command("list-sources")
def list_sources(enabled_only: bool = False) -> None:
    for source in settings.source_configs(enabled_only=enabled_only):
        status = "enabled" if source.get("enabled") else "disabled"
        typer.echo(f"{source['id']} | {status} | {source.get('name')}")


@app.command("export")
def export(format: str = "csv", governorate: Optional[str] = None, output_dir: str = "outputs") -> None:  # noqa: A002
    init_db()
    with SessionLocal() as session:
        records = list_unique_dentists(session, governorate)
    path = export_json(records, output_dir) if format == "json" else export_csv(records, output_dir)
    typer.echo(str(path))


@app.command("rebuild-unique")
def rebuild_unique() -> None:
    init_db()
    with SessionLocal() as session:
        records = rebuild_unique_dentists(session)
    typer.echo(f"Base unique reconstruite: {len(records)} dentistes")


@app.command("download-osm-tunisia")
def download_osm_tunisia(output_path: str = "data/osm/tunisia-latest.osm.pbf") -> None:
    path = download_tunisia_pbf(output_path)
    typer.echo(f"OSM Tunisie téléchargé: {path}")


@app.command("import-osm")
def import_osm(
    pbf_path: str = "data/osm/tunisia-latest.osm.pbf",
    limit: Optional[int] = None,
    output_dir: str = "outputs",
    log_level: str = "INFO",
) -> None:
    configure_logging(log_level)
    init_db()
    records = extract_osm_dentists(pbf_path, limit=limit)
    with SessionLocal() as session:
        repo = DentistRepository(session)
        for record in records:
            repo.save(record)
        unique = rebuild_unique_dentists(session)
    typer.echo(f"Dentistes OSM importés: {len(records)}")
    typer.echo(f"Base unique reconstruite: {len(unique)} dentistes")


@app.command("run-all")
def run_all(
    governorate: Optional[str] = None,
    all_governorates: bool = False,
    limit: Optional[int] = 5,
    resume: bool = True,
    force_refresh: bool = False,
    output_dir: str = "outputs",
    log_level: str = "INFO",
    source: Optional[str] = None,
    all_sources: bool = False,
) -> None:
    pipe = _pipeline(output_dir, log_level)
    if all_sources:
        source_ids = [s["id"] for s in settings.source_configs(enabled_only=True)]
    else:
        source_ids = [source or "med.tn"]
    targets = settings.governorates() if all_governorates else [governorate]
    if "med.tn" in source_ids and (not targets or not targets[0]):
        raise typer.BadParameter("Indiquez --governorate ou --all-governorates pour Med.tn.")
    total_detected = total_scraped = total_failed = 0
    paths = {}
    for gov in targets:
        if not gov and "med.tn" in source_ids:
            continue
        summary, paths = pipe.run_sources(source_ids, governorate=gov, limit=limit, resume=resume, force_refresh=force_refresh)
        total_detected += summary.profiles_detected
        total_scraped += summary.profiles_scraped
        total_failed += summary.profiles_failed
    typer.echo("Résumé final")
    typer.echo(f"Profils détectés: {total_detected}")
    typer.echo(f"Profils collectés: {total_scraped}")
    typer.echo(f"Profils échoués: {total_failed}")
    for name, path in paths.items():
        typer.echo(f"{name}: {Path(path)}")


if __name__ == "__main__":
    app()
