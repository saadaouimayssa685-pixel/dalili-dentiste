# Prospecting Dataset Notes

This document explains which SQL table should be used for prospecting and why.

## Recommended Table

Use `dentists_clean` for:

- prospecting exports
- delegate field preparation
- CRM import
- Power BI dashboards
- frontend dentist search

Do not use `dentists` directly for prospecting. It is the raw audit table and still contains extra collection columns.

## Clean Table Columns

The `dentists_clean` table keeps only the fields that matter operationally:

- `id`
- `full_name`
- `title`
- `specialties`
- `governorate`
- `delegation`
- `locality`
- `address`
- `phone`
- `google_maps_url`
- `latitude`
- `longitude`
- `sources`
- `source_count`
- `quality_score`
- `quality_status`
- `updated_at`

## Why This Table Matters

It is the best compromise between coverage and reliability:

- built from `unique_dentists`
- filtered by source activity
- filtered by dental relevance
- scored on phone, address, geography, and source confirmation
- rebuilt as a lighter table for operational use

## Current Caveats

As of `2026-08-11`:

- the clean dataset depends on the quality of `unique_dentists`
- not every record has a complete locality
- geographic normalization is still incomplete because `locality_references` is only partially seeded
- some profiles remain usable for prospecting but still require manual review for field deployment

## Suggested Prospecting Workflow

1. build or refresh `unique_dentists`
2. rebuild `dentists_clean`
3. export only `HIGH` and strong `MEDIUM` quality rows
4. review rows missing governorate, locality, or stable phone
5. distribute a dated export to the field team

## Minimal Prospecting Acceptance Rules

A record is safer for commercial use when it has:

- a dentist-like name
- a dental title or specialty
- at least one Tunisian phone
- a governorate
- either a locality, delegation, or address
- an active source
- a non-rejected quality score
