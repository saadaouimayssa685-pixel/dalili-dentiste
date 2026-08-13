# Évaluation manuelle du chatbot tunisien

## Phrases testées

- Je cherche un orthodontiste à Ariana
- نحب نلقى orthodontiste في أريانة
- n7eb nal9a orthodontiste fi Ariana
- dentiste mta3 sghar fi Sfax
- طبيب أسنان للصغار في صفاقس
- 3andi mochkel fil ltha fi Tunis
- نحب نعمل appareil لسناني
- implant fi Sousse avec téléphone
- n7eb dentiste 9rib meni
- famma tbib snan fi La Marsa?
- ' OR 1=1 --
- wajhi nafekh barcha w ma najamch netnaffes

## Reconnaissance attendue

- Spécialités: orthodontie, pédodontie, implantologie, parodontologie, chirurgie orale.
- Lieux: gouvernorats et localités présents dans la base.
- Sécurité: les urgences bloquent la recherche standard.

## Erreurs possibles

- Variantes Arabizi rares non couvertes.
- Localités absentes de la base.
- Messages très ambigus sans région.

## Améliorations recommandées

- Ajouter les expressions inconnues rencontrées en usage réel dans `app/chatbot/dental_lexicon.py`.
- Étendre les alias géographiques depuis la base.
- Évaluer un mode Hugging Face uniquement si le modèle est léger, compatible CPU et licence claire.
