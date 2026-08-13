# Mise à jour hebdomadaire Dalili Dentiste

## Architecture

Le job hebdomadaire est externe au processus web Next.js. Le point d'entrée principal est :

```bash
python -m automation.weekly_update
```

Le lancement manuel depuis la racine est :

```bash
python scripts/run_weekly_update.py
```

Modules ajoutés :

- `automation/config.py` : configuration par variables d'environnement.
- `automation/scheduler.py` : calcul de la prochaine exécution en `Africa/Tunis`.
- `automation/lock_manager.py` : verrou applicatif `runtime/weekly_update.lock`.
- `automation/backup_manager.py` : sauvegarde SQLite horodatée et vérifiée.
- `automation/weekly_update.py` : orchestration du pipeline.
- `automation/notification_manager.py` : notifications log/interface, email préparé par variable d'environnement.

## Ordre des traitements

Le job suit l'ordre suivant :

```text
Sauvegarde
→ Collecte
→ Zone temporaire
→ Validation
→ Normalisation
→ Géolocalisation
→ Déduplication
→ Comparaison avec l'existant
→ Publication
→ Rapport
→ Export
→ Notification
```

En mode simulation, la publication finale est désactivée.

## Planification

Le projet utilise Render avec Docker. La solution principale est donc un Render Cron Job défini dans `render.yaml`.

Expression Render/GitHub Actions :

```text
0 8 * * 0
```

Cette expression est en UTC. Elle correspond à dimanche 09h00 en Tunisie, car `Africa/Tunis` est UTC+1.

## Configuration

Variables principales :

```text
WEEKLY_UPDATE_ENABLED=true
WEEKLY_UPDATE_DAY=sunday
WEEKLY_UPDATE_HOUR=09
WEEKLY_UPDATE_MINUTE=00
WEEKLY_UPDATE_TIMEZONE=Africa/Tunis
WEEKLY_UPDATE_DRY_RUN=false
BACKUP_RETENTION_WEEKS=12
AUTO_MERGE_THRESHOLD=0.95
MANUAL_REVIEW_THRESHOLD=0.80
```

Aucun secret n'est stocké dans le code. Les emails éventuels utilisent `WEEKLY_UPDATE_EMAIL_TO`.

## Sauvegardes

Avant chaque traitement, une sauvegarde est créée dans :

```text
backups/dalili_before_update_YYYY-MM-DD_HHMMSS.db
```

Elle conserve :

- chemin ;
- date ;
- taille ;
- SHA256 ;
- nombre de lignes par table ;
- `run_id`.

La rétention par défaut est de 12 semaines, sans suppression de la dernière sauvegarde valide.

## Staging

Tables créées :

- `staging_dentists`
- `staging_locations`
- `staging_errors`
- `staging_duplicates`

Tables d'historique :

- `scheduled_runs`
- `scheduled_run_sources`

## Rapports et exports

Rapports :

```text
reports/weekly_update_YYYY-MM-DD.md
reports/weekly_update_YYYY-MM-DD.json
```

Exports :

```text
exports/weekly/<run_id>/dentists_unique_YYYY-MM-DD.csv
exports/weekly/<run_id>/dentists_unique_YYYY-MM-DD.xlsx
exports/weekly/<run_id>/quality_issues_YYYY-MM-DD.xlsx
exports/weekly/<run_id>/duplicates_YYYY-MM-DD.xlsx
```

## Mode Simulation

Commande :

```bash
python scripts/run_weekly_update.py --dry-run
```

Le mode simulation crée sauvegarde, verrou, staging, rapport et exports, mais ne publie pas dans les tables finales.

## Restauration

La restauration doit être faite manuellement par administrateur :

1. arrêter le job web/cron ;
2. sauvegarder la base actuelle ;
3. remplacer `dentists_tunisia.db` par la sauvegarde choisie ;
4. relancer l'application ;
5. vérifier les totaux et l'intégrité.

## Gestion des erreurs

- Si un verrou récent existe : statut `SKIPPED_ALREADY_RUNNING`.
- Si la sauvegarde échoue : le pipeline s'arrête.
- Si une source échoue : l'erreur est enregistrée et les autres sources continuent.
- Si la publication échoue : transaction annulée, staging et rapport conservés.

## Désactivation

Définir :

```text
WEEKLY_UPDATE_ENABLED=false
```

Sur Render, suspendre aussi le Cron Job si nécessaire.

## Reprise après échec

1. lire le dernier rapport dans `reports/` ;
2. inspecter `scheduled_runs` et `scheduled_run_sources` ;
3. vérifier `runtime/weekly_update.lock` ;
4. relancer en simulation ;
5. relancer en réel uniquement si la simulation est saine.
