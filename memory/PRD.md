# Pandore - Plateforme d'achat/vente de musique digitale

## Vision Produit
Alternative au streaming - les utilisateurs achètent et possèdent leur musique pour toujours.

## Stack Technique
- **Frontend**: React + Tailwind CSS + Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payments**: Stripe (à intégrer)
- **Auth**: Email/Password + Google OAuth (prévu)

## Fonctionnalités Implémentées

### Design "Bioluminescent Ocean" (28 Jan 2026)
- ✅ Thème sombre par défaut avec bulles flottantes animées
- ✅ Effet glassmorphism sur toutes les cartes
- ✅ Gradients cyan/violet/rose
- ✅ Animations Framer Motion

### Navbar Draggable (28 Jan 2026)
- ✅ Navbar flottante déplaçable n'importe où
- ✅ Tous les menus visibles (Découvrir, Bibliothèque, Playlists, Dashboard)
- ✅ Bouton minimiser → petit bouton flottant
- ✅ Toggle thème dark/light

### Pages Redesignées (28 Jan 2026)
- ✅ Home - Hero avec stats animées, sections Nouveautés/Top/Albums/Artistes
- ✅ Login/Register - Formulaires glassmorphism
- ✅ Browse - Recherche + tabs Titres/Albums
- ✅ TrackDetail - Détails complets avec achat

### Authentification
- ✅ Login/Register email/password
- ✅ JWT tokens + cookies
- ✅ Switch rôle User/Artist

### Données
- ✅ 500+ tracks, 50+ artistes, 75+ albums (seed data)
- ✅ Credentials test: `luna.waves@pandore.com` / `artist123`

## Backlog Priorisé

### P0 - Critique
- (Aucun bloqueur actuel)

### P1 - Important
- [ ] Intégration Stripe checkout
- [ ] Téléchargement fichiers musicaux achetés
- [ ] Playlists création/édition complète
- [ ] Corriger images albums (cover_url)

### P2 - Souhaitable
- [ ] Analytics dashboard artiste
- [ ] Rôle Admin/modération
- [ ] Google OAuth
- [ ] Sauvegarde position navbar (localStorage)

## Architecture Fichiers Clés

```
/app/frontend/src/
├── components/
│   ├── Navbar.js          # Navbar draggable
│   ├── BubbleCard.js      # Composants bulles/glow
│   ├── TrackCard.js       # Cartes tracks
│   ├── AlbumCard.js       # Cartes albums
│   └── AudioPlayer.js     # Lecteur flottant
├── pages/
│   ├── Home.js            # Page accueil
│   ├── Login.js           # Connexion
│   ├── Browse.js          # Navigation
│   └── TrackDetail.js     # Détail track
├── contexts/
│   └── ThemeContext.js    # Gestion thème
└── index.css              # CSS animations/glassmorphism

/app/backend/
└── server.py              # API FastAPI (monolithique)
```

## Endpoints API Principaux
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/tracks` - Liste tracks
- `GET /api/albums` - Liste albums
- `GET /api/artists` - Liste artistes
- `POST /api/purchases/checkout` - Achat (Stripe)
