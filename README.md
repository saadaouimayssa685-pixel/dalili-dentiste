# Dalili Dentiste

Dalili Dentiste is a Tunisian dental intelligence platform that combines multi-source web scraping, SQL data consolidation, OCR, geolocation, and a local chatbot assistant.

The project is designed for three audiences:

- the public, to find a dentist more easily
- medical delegates and prospectors, to work from a cleaner dental database
- internal operators, to validate quality, review sources, and prepare exports

## What The Project Combines

- `web scraping`: 9 active public sources currently configured
- `SQL / SQLite`: raw, unique, relevant, and clean dentist tables
- `normalization`: names, phones, addresses, governorates, localities
- `OCR`: business card scanning with French, English, and Arabic handling
- `local chatbot`: deterministic FR / Tunisian Arabic / Arabizi assistant
- `frontend`: public and professional interfaces connected to the backend
- `exports`: CSV / XLSX / Power BI-ready outputs

## Current Project Status

As of `2026-08-11`, the local database contains:

- `4295` raw source rows in `dentists`
- `4095` unique rows in `unique_dentists`
- `15` seeded locality reference entries in `locality_references`

The source health report currently marks `9/9` configured sources as `LIVE_OK`.

This means the project is already strong as a technical portfolio and demo platform, but it is not yet a fully certified commercial database. The biggest remaining gap is geographic and business-grade validation:

- locality reference coverage is still incomplete
- some records still miss locality or governorate details
- "open / closed / functional" status remains a heuristic layer, not a confirmed truth source
- the raw SQL table still contains legacy enrichment columns that are useful for audit but not ideal for prospecting exports

## Useful Data Tables

- `dentists`
  Raw collected rows, close to source reality, includes audit and legacy enrichment columns.
- `unique_dentists`
  Deduplicated dentists built from raw data.
- `relevant_dentists`
  Quality-scored dentist rows kept after relevance filtering.
- `dentists_clean`
  Final lean table intended for the application, CRM-style exports, and BI usage.
- `locality_references`
  Locality normalization reference used by the geocoding pipeline.

## Public Demo Dataset

The real SQLite database is intentionally not committed to GitHub because it contains operational contact data collected from public directories.

For portfolio review, a small anonymized sample is included:

```text
backend/data/sample/dentists_demo_sample.csv
```

The sample preserves the structure needed to understand the project while replacing dentist names with demo identifiers.

For open-source usefulness, a public dentist index is also included:

```text
backend/data/public/dentists_public_index.csv
```

This public index includes names, specialties, governorates, localities, sources, quality indicators, and a non-readable phone token. Raw phone numbers are not published in clear text. The fields `phone_encrypted`, `phone_hash`, and `has_phone` allow technical matching and coverage analysis without exposing the original phone value.

Regenerate the public index locally with:

```powershell
cd "C:\Users\maiss\Desktop\Dalili Dentiste\backend"
python scripts\export_public_index.py
```

## Repository Structure

```text
Dalili Dentiste/
  backend/      FastAPI backend, scrapers, SQL, OCR, chatbot, automation
  frontend/     Lovable/Vite frontend connected to the backend
  README.md     Main repository overview
```

## Backend Highlights

- one script per source in `backend/scripts/sources/`
- reusable scraping and normalization modules in `backend/app/`
- deterministic local assistant in `backend/app/chatbot/local_llm.py`
- OCR extraction in `backend/app/services/business_card_ocr.py`
- relevant clean dataset build in `backend/app/services/relevant_database.py`

## Run Locally

### Full app

```powershell
cd "C:\Users\maiss\Desktop\Dalili Dentiste"
.\LANCER_DALILI.bat
```

### Backend only

```powershell
cd "C:\Users\maiss\Desktop\Dalili Dentiste\backend"
python -m app.api
```

### Frontend only

```powershell
cd "C:\Users\maiss\Desktop\Dalili Dentiste\frontend"
npm install
npm run dev
```

## Recommended GitHub Positioning

This repository is best presented as:

`An AI-assisted dental data platform for Tunisia combining scraping, SQL cleaning, OCR, geolocation, and a multilingual local assistant.`

## Recommended LinkedIn Angle

Use the project as a showcase of:

- data engineering
- entity resolution and deduplication
- applied OCR
- practical LLM assistant design
- health-market prospecting intelligence
- product thinking from data collection to interface

## Honest Limitations

- not an official registry
- not medical advice
- not yet a fully verified national business directory
- some sources are stronger than others in profile completeness
- geographic normalization still needs expansion beyond the current locality seed set

## Next Milestones

1. expand locality reference coverage for all Tunisian governorates and delegations
2. remove or archive legacy raw columns not needed in final prospecting exports
3. assign a confidence score and last verification date to every clean record
4. separate "portfolio demo dataset" from "business-ready dataset"
5. publish cleaned exports and dashboard screenshots for GitHub and LinkedIn
