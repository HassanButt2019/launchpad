# LaunchPad

**Mission Control for Founders** — Validate, build, and launch your startup idea with AI-powered insights.

## Tech Stack

| Layer         | Technology                                                  |
| ------------- | ----------------------------------------------------------- |
| Backend API   | FastAPI, SQLAlchemy 2.0 (async), PostgreSQL                 |
| Frontend      | Next.js 14 (App Router), TypeScript, Tailwind CSS           |
| Shared Types  | TypeScript package (`@launchpad/shared`) with Zod schemas |
| Auth          | JWT (access + refresh tokens), bcrypt                       |
| Encryption    | RSA-OAEP + AES-256-GCM field encryption                     |
| Rate Limiting | slowapi in-memory limiter                                   |
| Migrations    | Alembic (async-compatible)                                  |
| Containers    | Docker Compose                                              |
| UI            | Radix UI primitives, Framer Motion, Lucide icons            |
| State         | Zustand (auth), TanStack Query (server state)               |

## Architecture

```
Browser ──► Next.js (3000) ──► FastAPI (8000) ──► PostgreSQL

packages/shared/     ← TypeScript types + Zod schemas
apps/api/            ← FastAPI backend
apps/web/            ← Next.js 14 frontend
scripts/seed.py      ← Demo data seeder
```

## Prerequisites

- Docker 24+ and Docker Compose v2
- Node.js 20+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

## Quick Start

### 1. Clone and configure

```bash
git clone <repo>
cd launchpad
cp .env.example .env
```

Edit `.env` and set strong values for:

- `SECRET_KEY` — at least 32 random hex characters (`openssl rand -hex 32`)
- `ENCRYPTION_MASTER_SECRET` — at least 32 random hex characters
- `RSA_PRIVATE_KEY_BASE64` — base64-encoded RSA private key used for field encryption
- `POSTGRES_PASSWORD` — strong database password
- `OPENAI_API_KEY` — required for AI validation and document generation

### 2. Start all services

```bash
docker-compose up --build -d
```

This starts PostgreSQL, the FastAPI API (port 8000), and the Next.js frontend (port 3000).

### 3. (Optional) Seed demo data

```bash
docker-compose exec api python scripts/seed.py
```

Creates `demo@launchpad.dev` / `Demo1234!` with 2 sample ideas.

### 5. Open the app

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

---

## Development (without Docker)

From the repo root, start the local backend and frontend together:

```bash
npm start
```

This starts Postgres with Docker Compose when Docker is running, then starts the FastAPI API on http://localhost:8000 and the Next.js app on http://localhost:3000.

### Backend

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # edit values

# Start dev server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd apps/web
npm install
npm run dev        # starts on http://localhost:3000
```

### Shared package

```bash
cd packages/shared
npm install
npm run dev        # watch mode — rebuilds types on change
```

---

## Environment Variables

| Variable                        | Required | Description                                                   |
| ------------------------------- | -------- | ------------------------------------------------------------- |
| `SECRET_KEY`                  | Yes      | JWT signing secret (min 32 chars)                             |
| `ENCRYPTION_MASTER_SECRET`    | Yes      | Legacy Fernet fallback key for existing encrypted rows         |
| `RSA_PRIVATE_KEY_BASE64`      | Yes      | Base64-encoded RSA private key for encrypted user data         |
| `DATABASE_URL`                | Yes      | PostgreSQL async URL (`postgresql+asyncpg://...`)           |
| `OPENAI_API_KEY`              | Yes      | OpenAI API key for AI features                                |
| `POSTGRES_DB`                 | No       | DB name (default:`launchpad`)                               |
| `POSTGRES_USER`               | No       | DB user (default:`postgres`)                                |
| `POSTGRES_PASSWORD`           | Yes      | DB password                                                   |
| `FRONTEND_URL`                | No       | CORS origin (default:`http://localhost:3000`)               |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No       | Access token TTL (default: 30)                                |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | No       | Refresh token TTL (default: 7)                                |
| `NEXT_PUBLIC_API_URL`         | No       | API base URL for frontend (default:`http://localhost:8000`) |

---

## API Endpoints

### Authentication

| Method | Endpoint                  | Description           |
| ------ | ------------------------- | --------------------- |
| POST   | `/api/v1/auth/register` | Create account        |
| POST   | `/api/v1/auth/login`    | Login, receive tokens |
| POST   | `/api/v1/auth/refresh`  | Rotate refresh token  |
| POST   | `/api/v1/auth/logout`   | Blacklist tokens      |
| GET    | `/api/v1/auth/me`       | Get current user      |

### Ideas

| Method | Endpoint                                   | Description                   |
| ------ | ------------------------------------------ | ----------------------------- |
| GET    | `/api/v1/ideas`                          | List user's ideas             |
| POST   | `/api/v1/ideas`                          | Create idea                   |
| GET    | `/api/v1/ideas/{id}`                     | Get idea                      |
| PUT    | `/api/v1/ideas/{id}`                     | Update idea                   |
| DELETE | `/api/v1/ideas/{id}`                     | Delete idea                   |
| POST   | `/api/v1/ideas/{id}/validate`            | Trigger AI validation         |
| GET    | `/api/v1/ideas/{id}/validation`          | Get latest validation report  |
| GET    | `/api/v1/ideas/{id}/documents`           | List documents                |
| POST   | `/api/v1/ideas/{id}/documents`           | Generate document (AI)        |
| GET    | `/api/v1/ideas/{id}/documents/{doc_id}`  | Get document with content     |
| PUT    | `/api/v1/ideas/{id}/documents/{doc_id}`  | Update document               |
| GET    | `/api/v1/ideas/{id}/checklist`           | Get phase checklists          |
| PATCH  | `/api/v1/ideas/{id}/checklist/{item_id}` | Toggle checklist item         |
| GET    | `/api/v1/ideas/{id}/journey`             | Full startup journey overview |

---

## Security Features

- **Encryption at rest** — User idea content, documents, AI chat messages, validation analysis, and formation documents are encrypted with RSA-OAEP protected AES-256-GCM field encryption. Legacy Fernet decryption is retained for older rows.
- **Row-level security** — All queries filter by `user_id` at the service layer.
- **Token security** — Access tokens are in-memory only (never localStorage). Refresh tokens are stored in secure same-site browser cookies. Logout blacklists tokens in process memory.
- **CORS** — Restricted to `FRONTEND_URL` only.
- **Rate limiting** — Via slowapi on all endpoints.
- **Security headers** — X-Frame-Options, X-Content-Type-Options, Referrer-Policy on every response.
- **Non-root containers** — Both API and web Docker images run as non-root users.

---

## Project Structure

```



uvicorn app.main:app --reload --port 8000


launchpad/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── dependencies.py
│   │   │   ├── security/       # JWT, Fernet encryption, middleware
│   │   │   ├── models/         # SQLAlchemy ORM models
│   │   │   ├── schemas/        # Pydantic v2 schemas
│   │   │   ├── routers/        # FastAPI route handlers
│   │   │   ├── services/       # Business logic + AI calls
│   │   │   └── utils/          # Startup checklist templates
│   └── web/                    # Next.js 14 frontend
│       └── src/
│           ├── app/            # App Router pages
│           │   ├── (auth)/     # Login, Register
│           │   └── (dashboard) # Dashboard, Ideas, Validate, Docs, Journey
│           ├── components/
│           │   ├── idea/       # IdeaCard, ValidationScore, StageTracker
│           │   ├── documents/  # DocumentCard, DocumentEditor
│           │   └── journey/    # StartupJourney
│           ├── hooks/          # useAuth, useIdeas
│           ├── lib/            # axios instance, utils
│           └── store/          # Zustand auth store
├── packages/
│   └── shared/                 # TypeScript types + Zod schemas
├── scripts/
│   └── seed.py                 # Demo data seeder
├── docker-compose.yml
├── .env.example
└── .pre-commit-config.yaml
```
# launchpad
