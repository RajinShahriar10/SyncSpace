# Developer Guide

A comprehensive guide for contributing to SyncSpace. Covers conventions, patterns, and workflows used throughout the codebase.

## Project Structure

```
SyncSpace/
├── backend/                     ASP.NET Core 10 backend
│   ├── src/
│   │   ├── SyncSpace.API/           Presentation layer (controllers, hubs, middleware)
│   │   ├── SyncSpace.Application/   Business logic (CQRS, DTOs, validators)
│   │   ├── SyncSpace.Domain/        Core domain (entities, enums, interfaces)
│   │   ├── SyncSpace.Infrastructure/ External services (auth, storage, AI)
│   │   └── SyncSpace.Persistence/   Data access (EF Core, repositories)
│   └── tests/
│       ├── SyncSpace.Domain.UnitTests/
│       ├── SyncSpace.Application.UnitTests/
│       └── SyncSpace.Infrastructure.IntegrationTests/
├── frontend/                    Next.js 15 frontend
│   └── src/
│       ├── app/                 App Router pages and layouts
│       ├── components/          Shared UI components
│       ├── features/            Feature modules (vertical slices)
│       ├── lib/                 API clients and utilities
│       ├── hooks/               Custom React hooks
│       ├── providers/           Context providers
│       ├── store/               Global Zustand stores
│       └── __tests__/           Frontend tests
├── docker/                      Docker configuration
└── docs/                        Documentation
```

## Backend Conventions

### Clean Architecture

The backend follows strict Clean Architecture with inward-only dependencies:

```
API → Infrastructure → Application → Domain
```

- **Domain** has zero project dependencies
- **Application** depends only on Domain
- **Persistence** depends on Domain + Application
- **Infrastructure** depends on Application + Persistence
- **API** depends on Application + Infrastructure + Persistence

### Adding a New Feature (CQRS Pattern)

Each feature lives in `SyncSpace.Application/Features/{FeatureName}/` with this structure:

```
Features/FeatureName/
├── Commands/
│   └── FeatureCommands.cs      Create, Update, Delete handlers
├── Queries/
│   └── FeatureQueries.cs       Get, GetById, GetByWorkspace handlers
└── DTOs/
    └── FeatureDTOs.cs          Request/Response DTOs
    └── FeatureValidators.cs    FluentValidation validators
```

#### Step-by-step: Adding a "Projects" feature

**1. Domain Entity** — `SyncSpace.Domain/Entities/Project.cs`

```csharp
public class Project : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid AuthorId { get; set; }

    // Navigation properties
    public Workspace Workspace { get; set; } = null!;
    public User Author { get; set; } = null!;
}
```

**2. DTOs** — `SyncSpace.Application/Features/Projects/DTOs/ProjectDTOs.cs`

```csharp
public record CreateProjectCommand(
    string Name,
    string? Description,
    Guid WorkspaceId
) : IRequest<ApiResponse<ProjectDto>>;

public record ProjectDto(
    Guid Id,
    string Name,
    string? Description,
    Guid WorkspaceId,
    DateTime CreatedAt
);
```

**3. Validators** — `SyncSpace.Application/Features/Projects/DTOs/ProjectValidators.cs`

```csharp
public class CreateProjectCommandValidator : AbstractValidator<CreateProjectCommand>
{
    public CreateProjectCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters");
    }
}
```

**4. Command Handler** — `SyncSpace.Application/Features/Projects/Commands/ProjectCommands.cs`

```csharp
public class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand, ApiResponse<ProjectDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateProjectCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<ProjectDto>> Handle(CreateProjectCommand request, CancellationToken cancellationToken)
    {
        var project = new Project
        {
            Name = request.Name,
            Description = request.Description,
            WorkspaceId = request.WorkspaceId
        };

        await _unitOfWork.Repository<Project>().AddAsync(project, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new ProjectDto(project.Id, project.Name, project.Description, project.WorkspaceId, project.CreatedAt);
        return ApiResponse<ProjectDto>.Success(dto, "Project created");
    }
}
```

**5. Controller** — `SyncSpace.API/Controllers/ProjectController.cs`

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProjectController(IMediator mediator) => _mediator = mediator;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProjectCommand command)
    {
        var result = await _mediator.Send(command);
        return result.Success ? StatusCode(201, result) : BadRequest(result);
    }
}
```

**6. EF Configuration** — Add to `EntityConfigurations.cs`

**7. Migration** — `dotnet ef migrations add AddProjects --project src/SyncSpace.Persistence --startup-project src/SyncSpace.API`

### C# Style Guide

- Use **file-scoped namespaces**: `namespace SyncSpace.Domain.Entities;`
- Use **records** for DTOs and commands
- Use **primary constructors** where appropriate
- Naming: `PascalCase` for types/methods/properties, `_camelCase` for private fields
- All entities inherit from `BaseEntity` or `AuditableEntity`
- Use `ApiResponse<T>` as the standard return type for all endpoints
- Use `Result<T>` monad for domain-level operations

### Entity Rules

- `BaseEntity` provides: `Id` (Guid), `CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy`
- `AuditableEntity` adds: `IsDeleted`, `DeletedAt`, `DeletedBy` (soft delete)
- FK properties use `Guid` type, navigation properties use the entity type
- Self-referencing relationships use nullable FK (e.g., `Message.ThreadId`)
- Join tables (WorkspaceMember, ChannelMember, CardLabel) use composite unique indexes

## Frontend Conventions

### Feature Module Structure

Each feature lives in `src/features/{featureName}/`:

```
features/featureName/
├── components/     React components specific to this feature
├── stores/         Zustand state management
├── hooks/          Custom hooks
├── services/       API client functions (or use src/lib/featureName.ts)
└── types/          TypeScript interfaces
```

### Component Patterns

- Use **functional components** with TypeScript
- Use **shadcn/ui** style components from `src/components/ui/`
- Use **framer-motion** for animations
- Use **clsx** + **tailwind-merge** via the `cn()` utility for class merging
- Lazy-load heavy components with `next/dynamic` + skeleton placeholders
- Wrap frequently re-rendered lists with `React.memo`

### State Management

- **Zustand** for client-side state (auth, UI, feature stores)
- **React Query** (`@tanstack/react-query`) for server state
- Store pattern:

```typescript
interface FeatureState {
  items: Item[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (item: CreateItemRequest) => Promise<void>;
}

export const useFeatureStore = create<FeatureState>((set) => ({
  items: [],
  loading: false,
  error: null,
  fetchItems: async () => { /* ... */ },
  addItem: async (item) => { /* ... */ },
}));
```

### API Client Pattern

Each domain has a client file in `src/lib/`:

```typescript
import { api } from './api';

export const featureApi = {
  getAll: (workspaceId: string) =>
    api.get<FeatureDto[]>(`/Feature/workspace/${workspaceId}`),
  getById: (id: string) =>
    api.get<FeatureDto>(`/Feature/${id}`),
  create: (data: CreateFeatureRequest) =>
    api.post<FeatureDto>('/Feature', data),
  update: (id: string, data: UpdateFeatureRequest) =>
    api.put<FeatureDto>(`/Feature/${id}`, data),
  delete: (id: string) =>
    api.delete(`/Feature/${id}`),
};
```

### TypeScript Style

- Use **interfaces** for object shapes, **type aliases** for unions/intersections
- Use **PascalCase** for types/interfaces, **camelCase** for variables/functions
- Use **Zod** for runtime validation alongside TypeScript types
- Export component types alongside components

## Testing Strategy

### Backend Test Layers

| Layer | Framework | What to Test | Count |
|-------|-----------|--------------|-------|
| Domain Unit | xUnit + FluentAssertions | Entity behavior, computed properties, enums | 39 |
| Application Unit | xUnit + Moq + FluentAssertions | Command handlers, validators, ApiResponse | 55 |
| Integration | xUnit + Moq + WebApplicationFactory | Full HTTP request/response through controllers | 26 |

### Writing Integration Tests

Integration tests use `TestWebApplicationFactory` which bypasses `Program.Main` entirely:

```csharp
public class MyControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public MyControllerTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Get_ReturnsSuccess()
    {
        // Arrange - users are pre-seeded in TestIdentityService._users

        // Act
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestTokens.ValidToken);
        var response = await _client.GetAsync("/api/MyResource");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
```

Key patterns:
- `TestIdentityService._users` is **static** for cross-scope persistence
- `TestRefreshTokenService._tokens` is **static** for cross-scope persistence
- `TestSyncSpaceDbContext` uses InMemory database with manual ambiguous navigation configs
- Validators are registered in the test DI container
- `ExceptionHandlingMiddleware` is registered for error handling

### Frontend Tests

| Type | Framework | What to Test |
|------|-----------|--------------|
| Unit | Vitest + React Testing Library | Utility functions, component rendering, store behavior |

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
});
```

## Git Workflow

### Branch Strategy

- `main` — Production-ready code
- `develop` — Integration branch
- `feature/*` — New features
- `fix/*` — Bug fixes
- `docs/*` — Documentation changes

### Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add project management feature
fix: resolve navigation bug on mobile
docs: update API documentation
refactor: extract validation into separate files
test: add integration tests for ProjectController
```

### Pull Request Process

1. Create feature branch from `develop`
2. Make changes with tests
3. Run `dotnet test` and `npm run test`
4. Create PR with description
5. CI pipeline runs lint + build + tests
6. Review and merge

## Performance Considerations

### Backend

- **Response Compression** — Brotli + Gzip enabled for all responses
- **Rate Limiting** — Auth endpoints: 10 req/min, API endpoints: 100 req/min
- **Redis Caching** — `CachedSearchService` and `CachedAnalyticsService` wrap base services
- **Database Indexes** — All foreign keys and frequently queried columns are indexed
- **Soft Deletes** — `AuditableEntity` prevents data loss, enables audit trails

### Frontend

- **Lazy Loading** — Heavy components (editor, charts, command palette) use `next/dynamic`
- **Image Optimization** — `next/image` with AVIF/WebP formats
- **Code Splitting** — Feature-based module structure enables automatic splitting
- **Memoization** — `React.memo` on frequently re-rendered list components
- **Standalone Output** — `output: "standalone"` for optimized Docker deployments
