# Demo video Dalili Dentiste

Ce dossier contient un script Playwright qui manipule l'interface comme un utilisateur et genere :

- des captures d'ecran ciblees ;
- une video de navigation ;
- un test OCR avec une carte de visite reelle.

## Avant de lancer

Demarrer l'application :

```powershell
cd "C:\Users\maiss\Desktop\Dalili Dentiste"
.\LANCER_DALILI.bat
```

Verifier les URLs :

```text
Frontend : http://127.0.0.1:5173/
Backend  : http://127.0.0.1:8000/api/health
```

## Lancer la demo

### Mode manuel recommande

Ce mode ouvre le navigateur, enregistre la video, puis vous laisse cliquer vous-meme dans l'application.

```powershell
cd "C:\Users\maiss\Desktop\Dalili Dentiste\frontend"
node ..\demo\record-manual-demo.mjs
```

Quand la demo est terminee, revenir dans le terminal et appuyer sur `ENTREE`.

### Mode automatique

```powershell
cd "C:\Users\maiss\Desktop\Dalili Dentiste\frontend"
node ..\demo\record-demo.mjs
```

Le script fait automatiquement :

1. accueil ;
2. recherche publique ;
3. ouverture d'un profil ;
4. test de l'assistant ;
5. ouverture de l'espace professionnel ;
6. scan OCR de la carte de visite ;
7. capture du dashboard professionnel.

## Sorties

Les fichiers sont crees ici :

```text
demo/output/screenshots/
demo/output/videos/
```

## Tester l'ajout SQL pendant la demo

Par defaut, la demo ne clique pas sur `Ajouter a la base` pour eviter d'inserer plusieurs fois la meme carte pendant les essais.

Pour tester aussi l'ajout dans SQLite :

```powershell
cd "C:\Users\maiss\Desktop\Dalili Dentiste\frontend"
$env:DALILI_DEMO_ADD_TO_DATABASE="true"
node ..\demo\record-demo.mjs
Remove-Item Env:\DALILI_DEMO_ADD_TO_DATABASE
```

Le backend verifiera d'abord si le dentiste existe deja avec :

- nom/prenom ;
- gouvernorat/localite ;
- telephone.

Si la fiche existe deja, l'interface affiche que la proposition est gardee en raw data. Sinon, elle est ajoutee dans la base.

## Changer l'image OCR

```powershell
$env:DALILI_CARD_IMAGE="C:\chemin\vers\carte.png"
node ..\demo\record-demo.mjs
Remove-Item Env:\DALILI_CARD_IMAGE
```
