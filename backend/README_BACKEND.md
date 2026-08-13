# Backend Dalili Dentiste

This folder contains the useful Python backend for Dalili Dentiste:

- multi-source dental scraping
- normalization and deduplication
- SQLite / SQL persistence
- quality scoring
- OCR for business cards
- local multilingual chatbot
- export utilities and GitHub Actions maintenance

## Current Backend Reality

As of `2026-08-11`:

- configured active sources: `9`
- last source health report: `9/9 LIVE_OK`
- raw source rows in local DB: `4295`
- unique dentist rows in local DB: `4095`
- seeded locality references: `15`

The backend is already strong as an engineering project, but the locality reference layer is not yet complete enough to claim a fully verified national geographic dataset.

## Main Structure

```text
backend/
  app/
    api.py               FastAPI entrypoint
    database.py          SQLAlchemy models and DB bootstrap
    models.py            Pydantic record models
    scrapers/            Reusable scraping modules
    services/            Quality, OCR, geography, pipeline, relevance
    normalization/       Names, phones, addresses, locations
    repositories/        DB access layer
    chatbot/             Local assistant logic
  scripts/
    sources/             One script per source
  config/
    sources.yaml         Active source configuration
    tunisia_*.json       Locality and phone references
  database/
    dentists_tunisia.db  Local SQLite database
  reports/
    source_health_latest.json
    relevant_database_report.json
  docs/
  tests/
```

## Active Sources

The configured and health-checked sources are:

```text
sante_tunisie
med.tn
lerdvmedical
tunisie_medicale
tunisie_dentiste
bonnes_adresses
goafricaonline
orthodontiste_tn
para_doctor
```

## Important Tables

- `dentists`
  Raw collected rows. Best for audit and debugging. Still contains extra collection and legacy columns.
- `unique_dentists`
  Deduplicated rows built from raw source rows.
- `relevant_dentists`
  Scored and filtered rows after relevance checks.
- `dentists_clean`
  Final lean table intended for app usage, prospecting exports, and BI.
- `locality_references`
  Geographic normalization reference table. Currently still incomplete.

## Useful Commands

Run these from `backend/`:

```powershell
python scripts/check_sources_health.py --live --timeout 20 --write-report
python -m app.cli list-sources --enabled-only
python -m app.cli run-all --all-sources --all-governorates
python -m app.cli rebuild-unique
python scripts/build_relevant_database.py --rebuild-unique
pytest
```

## OCR And Chatbot

- business card OCR lives in `app/services/business_card_ocr.py`
- the local chatbot lives in `app/chatbot/local_llm.py`
- the assistant supports French, Tunisian Arabic, and Arabizi-style input
- the local assistant is deterministic and retrieval-based, not a cloud generative model

## SQL Guidance

For operational exports, prefer `dentists_clean`.

Use `dentists` only when you need:

- raw source traceability
- low-level debugging
- legacy enrichment audit

For PostgreSQL or another SQL backend, define `DATABASE_URL` in the environment.
