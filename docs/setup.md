# Local Development Setup

Get SyncSpace running on your machine in under 5 minutes.

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| .NET SDK | 10.0+ | `dotnet --version` |
| Node.js | 22+ | `node --version` |
| npm | 10+ | `npm --version` |
| PostgreSQL | 14+ | `psql --version` |

Optional:
- **Docker Desktop** — for containerized setup
- **Redis** — for caching (app works without it)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-username/SyncSpace.git
cd SyncSpace
```

### 2. Backend setup

```bash
cd backend

# Restore packages
dotnet restore

# Set up environment variables
cp src/SyncSpace.API/.env.example src/SyncSpace.API/.env
# Edit .env with your database connection string and JWT secret

# Run database migrations
dotnet ef database update --project src/SyncSpace.Persistence --startup-project src/SyncSpace.API

# Start the API
dotnet run --project src/SyncSpace.API
```

The API starts at `https://localhost:5001` (HTTPS) or `http://localhost:5000` (HTTP).

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# Start the dev server
npm run dev
```

The frontend starts at `http://localhost:3000`.

### 4. Verify it works

| Check | URL |
|-------|-----|
| API Health | http://localhost:5000/api/Health |
| API Docs | http://localhost:5000/openapi/v1.json |
| Frontend | http://localhost:3000 |

## Environment Variables

### Backend (`backend/src/SyncSpace.API/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `ConnectionStrings__DefaultConnection` | Yes | PostgreSQL connection string |
| `Jwt__Key` | Yes | JWT signing secret (min 32 chars) |
| `Cloudinary__CloudName` | No | Cloudinary cloud name |
| `Cloudinary__ApiKey` | No | Cloudinary API key |
| `Cloudinary__ApiSecret` | No | Cloudinary API secret |
| `OpenAI__ApiKey` | No | OpenAI API key for AI features |
| `Redis__Connection` | No | Redis connection string |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL (e.g., `http://localhost:5000`) |

## Docker Setup (Alternative)

Run the entire stack with Docker Compose:

```bash
cd docker
docker-compose up --build
```

This starts:
- **API** on port 5000
- **Frontend** on port 3000
- **PostgreSQL** on port 5432
- **Redis** on port 6379

## Running Tests

### Backend (120 tests)

```bash
cd backend
dotnet test
```

### Frontend (50 tests)

```bash
cd frontend
npm run test
```

## Troubleshooting

### "Could not connect to PostgreSQL"
- Ensure PostgreSQL is running: `pg_isready`
- Verify connection string in `.env`
- Check database exists: `psql -l`

### "Port already in use"
- Kill the process using the port:
  - Windows: `netstat -ano | findstr :5000` then `taskkill /PID <pid> /F`
  - macOS/Linux: `lsof -ti:5000 | xargs kill -9`

### "JWT key too short"
- The `Jwt__Key` must be at least 32 characters
- Generate one: `openssl rand -base64 32`

### NuGet restore fails with version conflicts
- The project targets .NET 10 SDK. Ensure you have the correct SDK version.
- Run `dotnet --list-sdks` to verify.
