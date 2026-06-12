# 📝 Todo App — Full-stack avec CI/CD

Projet de to-do list complet pour cours de CI/CD.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  VPS (Docker Compose)                           │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Frontend │  │ Backend  │  │  PostgreSQL   │  │
│  │ (Nginx)  │──│ (Express)│──│  (port 5432)  │  │
│  │ port 80  │  │ port 3001│  │              │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│       │                                         │
│   http://vps-ip:8080                            │
└─────────────────────────────────────────────────┘
```

### Stack technique

| Composant | Techno | Rôle |
|-----------|--------|------|
| Frontend | React + Vite + TypeScript | Interface utilisateur |
| Backend | Express + Prisma + TypeScript | API REST |
| Base de données | PostgreSQL 16 | Stockage persistant |
| Serveur statique | Nginx | Sert React + proxy /api |
| CI/CD | GitHub Actions | Tests + build + deploy |

---

## Démarrage rapide

```bash
# Lancer tout avec Docker Compose
docker compose up --build

# L'app est accessible sur :
open http://localhost:8080
```

---

## Développement local (sans Docker)

```bash
# Terminal 1 — PostgreSQL
docker run -d --name todo-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=todoapp \
  -p 5432:5432 \
  postgres:16-alpine

# Terminal 2 — Backend
cd backend
cp .env.example .env       # DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todoapp"
npm install
npx prisma db push          # Crée les tables
npm run dev                  # http://localhost:3001

# Terminal 3 — Frontend
cd frontend
npm install
npm run dev                  # http://localhost:5173 (proxy /api → :3001)
```

---

## API Endpoints

| Méthode | Route | Description | Body |
|---------|-------|-------------|------|
| GET | `/api/todos` | Liste toutes les todos | — |
| POST | `/api/todos` | Crée une todo | `{ "title": "Ma tâche" }` |
| PATCH | `/api/todos/:id` | Toggle done/non-done | — |
| DELETE | `/api/todos/:id` | Supprime une todo | — |

---

## Pipeline CI/CD

Le pipeline GitHub Actions s'exécute à chaque push/PR sur `main`.

```mermaid
flowchart TD
    A["🔔 Push / PR sur main"] --> B

    subgraph B["Job CI — Matrix parallèle"]
        direction TB
        C1["backend"] --> D1["npm ci"]
        D1 --> E1["lint"]
        E1 --> F1["typecheck"]
        F1 --> G1["build"]

        C2["frontend"] --> D2["npm ci"]
        D2 --> E2["lint"]
        E2 --> F2["typecheck"]
        F2 --> G2["build"]
    end

    B --> H{"Branche = main ?\net push (pas PR) ?"}
    H -- "Non → stop" --> I["✅ CI passée"]
    H -- "Oui" --> J

    subgraph J["Job CD — Deploy"]
        direction TB
        K["🐳 Login Docker Hub"]
        K --> L["Build & push backend"]
        L --> M["Build & push frontend"]
        M --> N["🚀 SSH → VPS"]
        N --> O["docker compose pull + up -d"]
    end

    J --> P["✅ App en ligne !"]

    style B fill:#1a73e8,color:#fff
    style J fill:#34a853,color:#fff
    style H fill:#fbbc04,color:#000
```

### Détail des étapes CI

```mermaid
flowchart LR
    A["📥 Checkout\n(récupère le code)"] --> B["📦 npm ci\n(installe les deps)"]
    B --> C["🔍 Lint\n(ESLint: style code)"]
    C --> D["🧩 TypeCheck\n(tsc: erreurs de types)"]
    D --> E["🏗️ Build\n(compilation finale)"]
```

### Détail du deploy

```mermaid
flowchart LR
    A["🐳 Build images\nDocker"] --> B["📤 Push\nvers Docker Hub"]
    B --> C["🌐 SSH\nvers le VPS"]
    C --> D["⬇️ Pull images\n+ restart"]
```

---

## Configuration GitHub Actions (secrets à ajouter)

Aller dans **Settings → Secrets and variables → Actions** :

| Secret | Description | Exemple |
|--------|-------------|---------|
| `DOCKER_USERNAME` | Ton user Docker Hub | `cyrilleblanc` |
| `DOCKER_PASSWORD` | Token Docker Hub (pas le mot de passe) | `dckr_pat_xxx...` |
| `VPS_HOST` | IP publique du VPS | `51.68.xxx.xxx` |
| `VPS_USER` | Utilisateur SSH | `root` |
| `VPS_SSH_KEY` | Clé privée SSH | contenu de `~/.ssh/id_ed25519` |

---

## Structure du projet

```
todo-app/
├── backend/
│   ├── src/index.ts          # Serveur Express + routes CRUD
│   ├── prisma/schema.prisma  # Modèle de données (Todo)
│   ├── Dockerfile            # Build multi-stage Node.js
│   ├── package.json
│   ├── tsconfig.json
│   └── eslint.config.js
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Composant principal React
│   │   ├── main.tsx          # Point d'entrée
│   │   └── index.css         # Styles
│   ├── nginx.conf            # Proxy /api → backend
│   ├── Dockerfile            # Build multi-stage (Node → Nginx)
│   ├── vite.config.ts        # Config Vite + proxy dev
│   ├── package.json
│   ├── tsconfig.json
│   └── eslint.config.js
├── docker-compose.yml        # 3 services: db + backend + frontend
├── .github/workflows/
│   └── ci-cd.yml             # Pipeline GitHub Actions
└── README.md                 # Ce fichier
```
