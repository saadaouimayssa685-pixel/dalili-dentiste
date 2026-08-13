Dalili Dentiste
================

Structure du dossier:

- backend
  API FastAPI, scraping, OCR, chatbot local et base SQLite propre.

- frontend
  Interface Lovable / Vite connectee au backend.

Lancer l'application en local:

1. Ouvrir un terminal dans ce dossier.
2. Executer:

   LANCER_DALILI.bat

URLs:

- Interface: http://127.0.0.1:5173/
- API backend: http://127.0.0.1:8000/api/health

Notes:

- La table propre utilisee est backend/database/dentists_tunisia.db, table dentists_clean.
- Le bouton Google Maps ouvre un nouvel onglet vers la localisation du cabinet quand disponible, sinon une recherche Google Maps avec nom + adresse.
- La cartographie affiche une carte stylisee de la Tunisie avec points proportionnels par gouvernorat.
