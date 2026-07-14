# Deployment Guide

How to deploy SyncSpace to production using Vercel, Railway, and Neon.

## Architecture

```mermaid
graph LR
    USERS["Users"] --> VCL["Vercel<br/>Next.js Frontend"]
    VCL -->|"API Calls"| RY["Railway<br/>ASP.NET Backend"]
    RY --> PG["Neon<br/>PostgreSQL"]
    RY --> RD["Redis<br/>Caching"]
    RY --> CL["Cloudinary<br/>File Storage"]
    RY --> OAI["OpenAI<br/>AI Features"]

    style VCL fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style RY fill:#1e1b4b,stroke:#8b5cf6,color:#e0e7ff
    style PG fill:#1e1b4b,stroke:#06b6d4,color:#e0e7ff
```

## 1. Database (Neon)

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from the dashboard
4. The connection string format: `postgresql://user:password@host/database?sslmode=require`

No manual migration needed — the API runs `db.Database.MigrateAsync()` on startup in development. For production, run migrations manually or add a startup job.

## 2. Backend (Railway)

1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Railway will detect the `railway.json` config and use the Dockerfile
4. Set environment variables in the Railway dashboard:

| Variable | Value |
|----------|-------|
| `ConnectionStrings__DefaultConnection` | Your Neon connection string |
| `Jwt__Key` | A random 32+ character secret |
| `Jwt__Issuer` | SyncSpace |
| `Jwt__Audience` | SyncSpace |
| `Jwt__ExpirationInMinutes` | 60 |
| `Jwt__RefreshExpirationInDays` | 7 |
| `Cloudinary__CloudName` | Your Cloudinary cloud name |
| `Cloudinary__ApiKey` | Your Cloudinary API key |
| `Cloudinary__ApiSecret` | Your Cloudinary API secret |
| `OpenAI__ApiKey` | Your OpenAI API key |
| `OpenAI__Model` | gpt-4o |
| `Redis__Connection` | Railway Redis URL |
| `Cors__Origins` | `["https://your-app.vercel.app"]` |
| `ASPNETCORE_ENVIRONMENT` | Production |

5. Railway assigns a public URL (e.g., `your-api.up.railway.app`)
6. Enable the health check path: `/health`

### Custom Domain

1. Go to Railway project Settings → Networking
2. Add your custom domain
3. Update DNS CNAME record to point to Railway's domain
4. Update `Cors__Origins` with your new domain

## 3. Frontend (Vercel)

1. Create account at [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel auto-detects Next.js
4. Set environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Your Railway backend URL (e.g., `https://your-api.up.railway.app`) |

5. Deploy — Vercel auto-deploys on every push to `main`
6. The `vercel.json` config handles CORS headers and rewrites

### Custom Domain

1. Go to Vercel project Settings → Domains
2. Add your custom domain
3. Update DNS as instructed by Vercel
4. Update backend `Cors__Origins` with the new domain

## 4. CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push to `main`/`develop` and PRs to `main`:

```mermaid
graph LR
    PUSH["Push to main"] --> CI["CI Pipeline"]
    CI --> LINT["Frontend Lint & TypeCheck"]
    CI --> BUILD["Backend Build"]
    CI --> TEST["Backend Tests"]
    LINT --> DEPLOY_FE["Auto-deploy Frontend<br/>(Vercel)"]
    BUILD --> DEPLOY_BE["Auto-deploy Backend<br/>(Railway)"]
    TEST --> DEPLOY_BE

    style CI fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style DEPLOY_FE fill:#1e1b4b,stroke:#10b981,color:#e0e7ff
    style DEPLOY_BE fill:#1e1b4b,stroke:#10b981,color:#e0e7ff
```

| Job | Steps |
|-----|-------|
| `frontend-lint` | `npm ci` → `npm run lint` → `npm run type-check` |
| `backend-build` | `dotnet restore` → `dotnet build` → `dotnet test` |

Both Vercel and Railway are configured for automatic deployment from the `main` branch.

## 5. Environment Variables Reference

### Required (Backend)

| Variable | Description | Example |
|----------|-------------|---------|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string | `Host=ep-cool-bird-123456.us-east-2.aws.neon.tech;Database=syncspace;...` |
| `Jwt__Key` | JWT signing secret (32+ chars) | `your-super-secret-jwt-key-min-32-chars` |

### Optional (Backend)

| Variable | Description | Default |
|----------|-------------|---------|
| `Cloudinary__CloudName` | Cloudinary cloud name | — |
| `Cloudinary__ApiKey` | Cloudinary API key | — |
| `Cloudinary__ApiSecret` | Cloudinary API secret | — |
| `OpenAI__ApiKey` | OpenAI API key | — |
| `OpenAI__Model` | AI model name | `gpt-4o` |
| `Redis__Connection` | Redis connection string | `localhost:6379` |
| `Cors__Origins` | Allowed frontend origins | `["http://localhost:3000"]` |

### Required (Frontend)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://your-api.up.railway.app` |

## 6. Health Checks

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `GET /health` | Full check (DB + Redis) | No |
| `GET /health/ready` | Readiness (DB only) | No |
| `GET /health/live` | Liveness (always 200) | No |
| `GET /api/Health` | Simple status | No |

Response format:
```json
{
  "status": "Healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "1.0.0",
  "environment": "Production",
  "checks": [
    { "name": "database", "status": "Healthy", "duration": 12.5 },
    { "name": "redis", "status": "Healthy", "duration": 3.2 }
  ]
}
```

## 7. Monitoring

- **Railway**: Built-in logs, metrics, and restart policies (max 5 retries on failure)
- **Vercel**: Analytics, speed insights, function logs
- **Neon**: Dashboard with query stats, connection pool monitoring
- **Health checks**: Configure external monitoring (UptimeRobot, BetterStack) to poll `/health`

## 8. Security Checklist

- [ ] JWT secret is 32+ characters and randomly generated
- [ ] CORS origins are set to production domain only (not `*`)
- [ ] HTTPS is enforced (Vercel and Railway handle this automatically)
- [ ] Database connection uses SSL (`sslmode=require`)
- [ ] Environment variables are set in platform dashboards (not in code)
- [ ] `.env` files are in `.gitignore`
- [ ] OpenAPI docs are not exposed in production (already gated by `IsDevelopment()`)
