# GhostOS

GhostOS est un environnement de bureau simulé, entièrement conçu en HTML, CSS et JavaScript natif (aucune dépendance, aucun build). Le projet reproduit l'expérience d'un système d'exploitation dans le navigateur, précédé d'un parcours d'accueil complet : démarrage, page de bienvenue, connexion, puis bureau avec icônes, dock, menu Démarrer et une suite d'applications réellement fonctionnelles.

## Parcours du site

```
boot.html  →  welcome.html  →  login.html  →  Bureau.html
(démarrage)   (bienvenue)      (connexion)     (bureau GhostOS)
```

`Ghost (1).js` gère la redirection vers `Bureau.html` une fois la connexion validée.

## Structure du projet

```
├── boot.html       → écran de démarrage
├── login.html       → page de connexion
├── welcome.html     → page de bienvenue / accueil
├── Acceuil.css       → styles de la page d'accueil
├── Welcome.css       → styles de la page de bienvenue
├── Ghost (1).js      → script de redirection après connexion
├── Spider.jpg        → visuel utilisé sur le parcours d'accueil
├── Bureau.html       → point d'entrée du bureau GhostOS
├── Bureau.css        → tout le style du bureau (glassmorphisme, thèmes clair/sombre, animations)
├── Bureau.js         → toute la logique du bureau (fenêtres, navigation, calculs, thèmes…)
└── README.md
```

> `Bureau.html` peut aussi être ouvert directement dans le navigateur pour tester le bureau GhostOS de manière isolée, sans repasser par le parcours de connexion.

## Fonctionnalités du bureau

- **Bureau & Dock** — icônes fonctionnelles, horloge et batterie en temps réel, notifications.
- **Menu Démarrer** — applications épinglées, recherche, options d'alimentation.
- **Explorateur de fichiers** — arborescence virtuelle navigable (dossiers/fichiers), historique précédent/suivant, recherche en direct, fenêtre déplaçable et redimensionnable.
- **Calculatrice** — opérations de base et fonctions scientifiques (sin, cos, tan, log, ln, √, x², 1/x, x^y, n!…), historique des calculs cliquable.
- **Notes** — bloc-notes réellement éditable.
- **Galerie** — grille de photos, aperçu détaillé, zoom et navigation précédent/suivant.
- **Paramètres** — mode clair/sombre appliqué à tout le système, choix de la couleur d'accent (nuancier + sélecteur personnalisé), réglage de l'intensité du flou (glassmorphisme).

## Équipe du projet

| Rôle | GitHub |
|---|---|
| Chef de projet — coordination GitHub, hébergement du site, conception du bureau et des applications qui le composent | [Hassanecbl0](https://github.com/Hassanecbl0) |
| Conception de la page d'accueil | [kindaroukieta14](https://github.com/kindaroukieta14) |
| Conception de la page de bienvenue et du login | [Grace-ZAGRE](https://github.com/Grace-ZAGRE) |
| Brainstorming et conception des applications du bureau | [hortensekabore](https://github.com/hortensekabore) |
| Contribution au projet | [guissoufoazialeilatou-ctrl](https://github.com/guissoufoazialeilatou-ctrl) |

---

Projet réalisé dans le cadre du parcours en informatique — Burkina Institute of Technology (BIT).
# Ghost-webOs
