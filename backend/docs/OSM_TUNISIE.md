# Source OpenStreetMap Tunisie

Geofabrik publie un extrait national OpenStreetMap pour la Tunisie :

`https://download.geofabrik.de/africa/tunisia-latest.osm.pbf`

Cette source est utile pour une collecte nationale locale, surtout pour les objets OSM tagués :

- `amenity=dentist`
- `healthcare=dentist`
- `healthcare:speciality=dentist`
- `healthcare:speciality=orthodontics`

## Installation

```powershell
python -m pip install osmium
```

## Télécharger l'extrait

```powershell
python -m app download-osm-tunisia
```

Le fichier est enregistré dans :

`data/osm/tunisia-latest.osm.pbf`

## Importer dans la base

```powershell
python -m app import-osm
```

Pour tester rapidement :

```powershell
python -m app import-osm --limit 20
```

## Important

OpenStreetMap n'est pas un registre officiel des dentistes. Il faut l'utiliser comme source complémentaire :

- bon pour les coordonnées GPS et cabinets cartographiés,
- variable pour les téléphones/adresses,
- à dédupliquer avec Med.tn et Tunisie Médicale.
