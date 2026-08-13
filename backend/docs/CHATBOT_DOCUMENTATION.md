# Dalili Assistant

Dalili Assistant est un chatbot de recherche intégré à l’interface Next.js. Il utilise uniquement la base locale Dalili Dentiste et ne génère jamais de professionnels fictifs.

## Fonctionnement

- Mode par défaut: `rules`
- Coût: gratuit, sans clé API
- Sources: table `unique_dentists` chargée par l’application
- Recherche: filtres validés en Python sur spécialité, gouvernorat, localité, téléphone et Maps
- Résultats: maximum 5 fiches dans la première réponse

## Langues

Le MVP comprend:

- français;
- tunisien en alphabet arabe;
- tunisien latin / Arabizi.

Exemples:

- `Je cherche un orthodontiste à Ariana`
- `نحب نلقى طبيب أسنان في أريانة`
- `n7eb nal9a dentiste fi Ariana`
- `dentiste mta3 sghar fi Sfax`

## Sécurité médicale

Le chatbot facilite la recherche d’un professionnel et ne remplace pas un avis médical. En cas de signes inquiétants, il recommande de contacter rapidement les urgences ou un professionnel de santé, sans diagnostic.

## Limites

- La géolocalisation exacte utilisateur n’est pas activée.
- Le mode Hugging Face/LLM est préparé conceptuellement mais désactivé.
- Les résultats dépendent de la qualité et complétude de la base Dalili.

## Tests

```powershell
python -m pytest tests\test_chatbot.py -v
python -m compileall .
```
