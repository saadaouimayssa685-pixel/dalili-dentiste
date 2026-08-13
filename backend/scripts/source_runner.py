from __future__ import annotations

from pathlib import Path
from typing import Optional

import typer

from app.config import settings
from app.database import SessionLocal, init_db
from app.logging_config import configure_logging
from app.services.pipeline import ScrapingPipeline


def run_source(
    source_id: str,
    governorate: Optional[str] = None,
    limit: Optional[int] = 5,
    resume: bool = True,
    force_refresh: bool = False,
    output_dir: str = "outputs",
    log_level: str = "INFO",
) -> None:
    configure_logging(log_level)
    init_db()
    source = settings.source_config(source_id)
    if not source:
        raise typer.BadParameter(f"Source inconnue: {source_id}")
    if not source.get("enabled", False):
        typer.echo(f"Source désactivée: {source_id} - {source.get('notes', 'à valider avant collecte')}")
        raise typer.Exit(code=2)
    if source_id == "med.tn" and not governorate:
        raise typer.BadParameter("--governorate est obligatoire pour med.tn")

    with SessionLocal() as session:
        pipeline = ScrapingPipeline(session, output_dir)
        summary, paths = pipeline.run_sources(
            [source_id],
            governorate=governorate,
            limit=limit,
            resume=resume,
            force_refresh=force_refresh,
        )

    typer.echo("Résumé final")
    typer.echo(f"Source: {source_id}")
    typer.echo(f"Profils détectés: {summary.profiles_detected}")
    typer.echo(f"Profils collectés: {summary.profiles_scraped}")
    typer.echo(f"Profils échoués: {summary.profiles_failed}")
    for name, path in paths.items():
        typer.echo(f"{name}: {Path(path)}")


def source_app(source_id: str, default_governorate: str | None = None) -> typer.Typer:
    app = typer.Typer(help=f"Scraper dédié à la source {source_id}.")

    @app.command()
    def main(
        governorate: Optional[str] = typer.Option(default_governorate, "--governorate"),
        limit: Optional[int] = typer.Option(5, "--limit"),
        resume: bool = typer.Option(True, "--resume/--no-resume"),
        force_refresh: bool = typer.Option(False, "--force-refresh/--no-force-refresh"),
        output_dir: str = typer.Option("outputs", "--output-dir"),
        log_level: str = typer.Option("INFO", "--log-level"),
    ) -> None:
        run_source(
            source_id=source_id,
            governorate=governorate,
            limit=limit,
            resume=resume,
            force_refresh=force_refresh,
            output_dir=output_dir,
            log_level=log_level,
        )

    return app
