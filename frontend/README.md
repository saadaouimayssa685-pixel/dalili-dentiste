# Dalili Dentiste Tounsi

Crée une interface web responsive premium pour « Dalili Dentiste Tounsi », annuaire dentaire en Tunisie. Identité visuelle : thème clair, fond blanc et bleu très pâle, bleu marine #071A45 pour les titres, turquoise #08979D et bleu #1267D8 pour les accents, cartes arrondies, ombres légères, design professionnel et rassurant. Ne pas utiliser de thème sombre.

PAGE HOME (/)
- Header sticky : logo Dalili Dentiste Tounsi à gauche ; Accueil, À propos, Recherche, Assistant, Contact ; sélecteur Français ; bouton « Ajouter mon cabinet + ». Supprimer complètement « Divisions ».
- Hero sans moteur de recherche. Texte principal : « Tlawwej 3la dentiste ? Dalili m3ak. » avec le mot dentiste en turquoise. Sous-titre : « Le guide intelligent pour trouver un dentiste de confiance, proche de vous, partout en Tunisie. »
- Visuel captivant à droite : grande dent blanche 3D sur socle, silhouette de la Tunisie et repère de localisation, ambiance clinique lumineuse.
- Deux cartes CTA : « Espace grand public » vers /public et « Espace professionnel » vers /professional.
- Section À propos juste après le hero, avant les profils : image réelle d’un cabinet dentaire moderne, titre « Notre mission, votre sourire. », texte de présentation, 4 valeurs : Fiabilité, Proximité, Excellence, Engagement, lien vers /about.
- Section « Dentistes recommandés » après À propos : 4 cartes visibles sur desktop avec photo, badge Vérifié, nom, spécialité, gouvernorat/ville, note, téléphone et bouton « Voir le profil ». Ajouter « Voir tous les dentistes » vers /public/recherche.
- Section « Pourquoi choisir Dalili ? » obligatoirement après les dentistes : Profils vérifiés, Couverture nationale (24 gouvernorats), Assistant intelligent, Données sécurisées. Fond bleu-turquoise très clair, pas sombre.
- Ne jamais afficher le bloc « Scanner une carte » sur la Home.
- Chatbot flottant en bas à droite.

PAGE ABOUT US (/about)
Créer une page autonome, robuste et professionnelle : qui sommes-nous, mission, vision, engagements, fonctionnement de la collecte à la consultation. Ton crédible, clair, sans promesse médicale. Utiliser le même design clair.

ESPACE GRAND PUBLIC (/public)
- Titre « Espace grand public ».
- Moteur de recherche avec liste déroulante obligatoire des 24 gouvernorats tunisiens, puis Ville/Localité et Spécialité ; pas de saisie libre du gouvernorat et aucune limitation.
- Résultats de dentistes en cartes.
- Ici seulement, afficher le bloc « Scanner une carte » et un bloc Assistant.

ESPACE PROFESSIONNEL (/professional)
Tableau de bord moderne avec statistiques, propositions, recherche avancée, carte et accès « Scanner une carte ».

FOOTER COMPACT
- Bande CTA compacte avant le footer : « Vous êtes dentiste ? », « Espace professionnel » et bouton « Ajouter mon cabinet ».
- Footer bleu marine compact avec logo, contact, navigation, liens utiles, réseaux sociaux et application.
- Colonne « Sources de données » : afficher seulement 3 sources visibles : med.tn, CNOMDT, Tunisie Dentiste ; bouton interactif « + Plus de sources » qui déplie : Bonnes Adresses, Go Africa Online, Le RDV Médical, Orthodontiste.tn, Para Doctor, Santé Tunisie, Tunisie Médicale, Tunisie Dentistes.
- Ne pas ajouter FAQ ni Blog.

Créer les interactions, états hover, navigation entre pages, responsive mobile/tablette/desktop et données de démonstration réalistes. Utiliser React, TypeScript, Tailwind et shadcn/ui.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/380d5639-4e1b-4e24-b6f2-082ff2e300e6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
