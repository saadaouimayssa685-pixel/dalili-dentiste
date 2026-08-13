# Scan carte visite dentiste

L'onglet `Scan carte` de l'interface Next.js permet de :

- uploader une image de carte visite ;
- lire le texte avec PaddleOCR si installé ;
- classifier la carte : dentiste ou non dentiste ;
- extraire nom, titre, téléphone, adresse, localité et gouvernorat ;
- enregistrer la fiche uniquement après validation utilisateur.

## Installer PaddleOCR

PaddleOCR est optionnel car il est plus lourd que les autres dépendances.

```powershell
pip install -e ".[ocr]"
```

Ou directement :

```powershell
python -m pip install paddleocr paddlepaddle
```

## Utilisation

1. Lancer l'interface Next.js.
2. Ouvrir l'onglet `Scan carte`.
3. Importer une image `png`, `jpg`, `jpeg` ou `webp`.
4. Cliquer `Scanner l'image`.
5. Si la carte est validée comme dentiste, cliquer `Valider et enregistrer dans la base`.

## Mode sans PaddleOCR

Si PaddleOCR n'est pas installé, l'image ne sera pas scannée automatiquement.

Tu peux quand même coller le texte OCR manuellement dans la zone `Texte OCR manuel ou test`, puis cliquer `Analyser le texte`.

## Règles de validation

La carte est acceptée si elle contient des signaux forts :

- `dentiste`
- `médecin dentiste`
- `chirurgien dentiste`
- `orthodontiste`
- `implantologie`
- téléphone tunisien valide
- localisation tunisienne
- nom probable de praticien

Elle est rejetée si elle semble appartenir à une autre profession : architecte, avocat, pharmacie, restaurant, etc.

## Source en base

Les fiches validées sont stockées avec :

```text
source = business_card_ocr
```

La base unique est reconstruite après l'enregistrement.
