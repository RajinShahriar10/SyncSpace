# Architecture

SyncSpace follows Clean Architecture with CQRS, implementing a premium full-stack collaboration platform.

## Clean Architecture

The backend is organized into four concentric layers with strict inward-only dependencies:

```mermaid
graph TD
    subgraph "Presentation Layer"
        API["SyncSpace.API<br/>Controllers, Hubs, Middleware"]
    end

    subgraph "Infrastructure Layer"
        INFRA["SyncSpace.Infrastructure<br/>Identity, JWT, Redis, Cloudinary, OpenAI"]
        PERSIST["SyncSpace.Persistence<br/>EF Core, DbContext, Repositories"]
    end

    subgraph "Application Layer"
        APP["SyncSpace.Application<br/>CQRS, DTOs, Validators, Interfaces"]
    end

    subgraph "Domain Layer"
        DOMAIN["SyncSpace.Domain<br/>Entities, Enums, Value Objects"]
    end

    API --> INFRA
    API --> APP
    API --> PERSIST
    INFRA --> APP
    INFRA --> PERSIST
    PERSIST --> APP
    PERSIST --> DOMAIN
    APP --> DOMAIN

    style DOMAIN fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style APP fill:#1e1b4b,stroke:#8b5cf6,color:#e0e7ff
    style PERSIST fill:#1e1b4b,stroke:#06b6d4,color:#e0e7ff
    style INFRA fill:#1e1b4b,stroke:#f59e0b,color:#e0e7ff
    style API fill:#1e1b4b,stroke:#ef4444,color:#e0e7ff
```

### Layer Responsibilities

| Layer | Project | Contains | Depends On |
|-------|---------|----------|------------|
| **Domain** | `SyncSpace.Domain` | Entities, enums, repository interfaces, Result monad | Nothing |
| **Application** | `SyncSpace.Application` | CQRS handlers, DTOs, validators, service interfaces | Domain |
| **Persistence** | `SyncSpace.Persistence` | EF Core DbContext, entity configurations, repository implementations | Domain, Application |
| **Infrastructure** | `SyncSpace.Infrastructure` | Identity, JWT, Redis, Cloudinary, OpenAI, Search, Analytics | Application, Persistence |
| **Presentation** | `SyncSpace.API` | Controllers, SignalR hubs, middleware, authorization | Application, Infrastructure, Persistence |

## CQRS Pattern

Commands and Queries are separated through MediatR, with automatic validation via pipeline behaviors:

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant MediatR
    participant Validator
    participant Handler
    participant DbContext

    Client->>Controller: POST /api/Document
    Controller->>MediatR: Send(CreateDocumentCommand)
    MediatR->>Validator: Validate command
    alt Validation fails
        Validator-->>MediatR: ValidationException
        MediatR-->>Controller: 400 Bad Request
    else Validation passes
        MediatR->>Handler: Handle(command)
        Handler->>DbContext: AddAsync(entity)
        DbContext-->>Handler: Saved
        Handler-->>MediatR: ApiResponse<T>
        MediatR-->>Controller: Result
        Controller-->>Client: 201 Created
    end
```

### Command Flow (Write Operations)

1. Client sends HTTP request to Controller
2. Controller creates MediatR Command and dispatches it
3. `ValidationBehavior` pipeline runs all FluentValidation validators
4. If valid, the Command Handler executes business logic
5. Handler uses `IUnitOfWork` to persist changes via Repository pattern
6. Returns `ApiResponse<T>` wrapper with success/error state

### Query Flow (Read Operations)

1. Client sends HTTP request to Controller
2. Controller creates MediatR Query and dispatches it
3. Query Handler reads data using `IUnitOfWork.Repository<T>()` or raw SQL
4. Returns `ApiResponse<T>` with mapped DTOs

## Backend Dependency Graph

```mermaid
graph LR
    subgraph NuGet Packages
        MR[MediatR]
        FV[FluentValidation]
        AM[AutoMapper]
        EFC[EF Core]
        NPG[Npgsql]
        ID[Identity]
        JWT[JWT Bearer]
        REDIS[StackExchange.Redis]
        CLOUD[CloudinaryDotNet]
        OAI[OpenAI]
        SIG[SignalR]
        HC[HealthChecks]
    end

    API["API"] --> MR
    API --> SIG
    API --> HC
    API --> JWT

    APP["Application"] --> MR
    APP --> FV
    APP --> AM

    PERSIST["Persistence"] --> EFC
    PERSIST --> NPG

    INFRA["Infrastructure"] --> ID
    INFRA --> JWT
    INFRA --> REDIS
    INFRA --> CLOUD
    INFRA --> OAI

    style API fill:#1e1b4b,stroke:#ef4444,color:#e0e7ff
    style APP fill:#1e1b4b,stroke:#8b5cf6,color:#e0e7ff
    style PERSIST fill:#1e1b4b,stroke:#06b6d4,color:#e0e7ff
    style INFRA fill:#1e1b4b,stroke:#f59e0b,color:#e0e7ff
```

## Frontend Architecture

```mermaid
graph TD
    subgraph "Next.js App Router"
        PAGES["Pages<br/>(app/)"]
        LAYOUT["Layouts<br/>dashboard, auth, onboarding"]
    end

    subgraph "Feature Modules"
        FEAT["features/<br/>admin, ai, analytics, audit,<br/>boards, chat, documents,<br/>drive, notifications, search,<br/>workspace"]
    end

    subgraph "Shared Components"
        UI["UI Components<br/>button, badge, card, input,<br/>avatar, tooltip"]
        LAYOUT2["Layout Components<br/>sidebar, header, dashboard-layout"]
        FEATURE["Feature Components<br/>kanban-board, editor,<br/>file-browser, message-list"]
    end

    subgraph "State Management"
        ZUSTAND["Zustand Stores<br/>auth, UI, workspace, feature stores"]
        RQ["React Query<br/>Server state caching"]
    end

    subgraph "API Layer"
        API["lib/api.ts<br/>Axios instance with interceptors"]
        CLIENTS["lib/*.ts<br/>Feature-specific API clients"]
    end

    subgraph "Real-time"
        SR["SignalR Hubs<br/>documents, chat, notifications"]
    end

    PAGES --> FEAT
    PAGES --> LAYOUT2
    FEAT --> UI
    FEAT --> ZUSTAND
    FEAT --> RQ
    ZUSTAND --> API
    RQ --> CLIENTS
    CLIENTS --> API
    FEAT --> SR

    style PAGES fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style FEAT fill:#1e1b4b,stroke:#8b5cf6,color:#e0e7ff
    style UI fill:#1e1b4b,stroke:#06b6d4,color:#e0e7ff
    style ZUSTAND fill:#1e1b4b,stroke:#f59e0b,color:#e0e7ff
    style API fill:#1e1b4b,stroke:#ef4444,color:#e0e7ff
    style SR fill:#1e1b4b,stroke:#10b981,color:#e0e7ff
```

### State Management Strategy

| Layer | Tool | Purpose |
|-------|------|---------|
| Server State | React Query (`@tanstack/react-query`) | API data fetching, caching, mutations |
| Client State | Zustand | Auth session, UI state, feature-specific state |
| Form State | react-hook-form + Zod | Form validation and submission |
| URL State | Next.js App Router params/searchParams | Route-based state |

## Real-Time Architecture

```mermaid
graph LR
    subgraph "Client"
        WEB["Next.js Client"]
    end

    subgraph "SignalR Hubs"
        DOC["DocumentHub<br/>/hubs/documents"]
        CHAT["ChatHub<br/>/hubs/chat"]
        NOTIF["NotificationHub<br/>/hubs/notifications"]
        COLLAB["CollaborationHub"]
    end

    subgraph "Features"
        EDITOR["Collaborative Editor<br/>Cursor tracking, presence"]
        MESSAGING["Real-time Chat<br/>Channels, DMs, reactions"]
        PUSH["Push Notifications<br/>In-app alerts"]
    end

    WEB -->|WebSocket| DOC
    WEB -->|WebSocket| CHAT
    WEB -->|WebSocket| NOTIF
    DOC --> EDITOR
    CHAT --> MESSAGING
    NOTIF --> PUSH

    style WEB fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style DOC fill:#1e1b4b,stroke:#10b981,color:#e0e7ff
    style CHAT fill:#1e1b4b,stroke:#10b981,color:#e0e7ff
    style NOTIF fill:#1e1b4b,stroke:#10b981,color:#e0e7ff
```

## Design Patterns

| Pattern | Where Used | Purpose |
|---------|-----------|---------|
| **Repository** | `IRepository<T>` in Domain, implemented in Persistence | Abstract data access behind generic interface |
| **CQRS** | MediatR commands/queries in Application | Separate read and write models |
| **Decorator** | `CachedSearchService`, `CachedAnalyticsService` | Add Redis caching transparently |
| **Result Monad** | `Result<T>` in Domain | Explicit success/failure without exceptions |
| **Pipeline Behavior** | `ValidationBehavior<,>` | Auto-validate all MediatR requests |
| **Vertical Slices** | Feature-based organization | Each feature is self-contained |
| **Mediator** | MediatR | Decouple controllers from handlers |
| **Factory** | `TestWebApplicationFactory` | Create test server without real dependencies |

## Technology Stack

```mermaid
graph TD
    subgraph Frontend
        N["Next.js 15"]
        R["React 19"]
        TS["TypeScript"]
        TW["Tailwind CSS"]
        ZS["Zustand"]
        FM["Framer Motion"]
        RQ2["React Query"]
    end

    subgraph Backend
        NET[".NET 10 / C#"]
        MVC["ASP.NET Core Web API"]
        MED["MediatR"]
        FV2["FluentValidation"]
        EFC2["Entity Framework Core"]
        SIG2["SignalR"]
    end

    subgraph Data
        PG["PostgreSQL"]
        RD["Redis"]
        NEON["Neon (Serverless PG)"]
    end

    subgraph External
        CL["Cloudinary"]
        OAI2["OpenAI GPT-4o"]
        GGL["Google OAuth"]
    end

    subgraph DevOps
        DK["Docker"]
        RY["Railway"]
        VCL["Vercel"]
        GH["GitHub Actions"]
    end

    N --> R
    N --> TW
    MVC --> MED
    MVC --> EFC2
    EFC2 --> PG
    MVC --> SIG2

    style N fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style NET fill:#1e1b4b,stroke:#8b5cf6,color:#e0e7ff
    style PG fill:#1e1b4b,stroke:#06b6d4,color:#e0e7ff
```
