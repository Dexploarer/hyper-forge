# Asset-Forge Architecture Patterns

## Tech Stack

### Frontend

- **React 19.2.0** - Modern React with hooks and concurrent features
- **Vite 6.0** - Fast development server and build tool
- **TypeScript strict mode** - Full type safety
- **React Router** - Client-side routing
- **Three.js 0.169.0** - 3D rendering engine
- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Helper components for R3F
- **Tailwind CSS** - Utility-first styling

### Backend

- **Elysia 1.4.15** - Fast Bun web framework
- **Bun** - JavaScript runtime and package manager
- **TypeBox** - Runtime type validation
- **Swagger/OpenAPI** - API documentation

### Database

- **PostgreSQL** - Primary database
- **Drizzle ORM 0.44.6** - TypeScript ORM with migrations
- **Drizzle Kit** - Migration management

### Authentication

- **Privy** - Wallet-based authentication (JWT)
- Web3 wallet integration

### AI Services

- **Vercel AI SDK 5.0.89** - AI orchestration
- **AI Gateway** - Provider abstraction (OpenAI, Anthropic)
- **Meshy AI** - 3D asset generation (Text-to-3D, Image-to-3D)

### Deployment

- **Railway** - Backend and database hosting
- **Vercel** (optional) - Frontend CDN

## Design Principles

- **Modular**: Each feature is self-contained
- **Type-Safe**: TypeScript strict mode everywhere
- **RESTful APIs**: Follow REST conventions
- **Database First**: Schema-driven development
- **Research First**: Use Deepwiki before coding
- **Bun First**: Use Bun over Node.js, npm, pnpm
- **No Mocks**: Real implementations in tests

## Monorepo Structure

```
asset-forge/
├── packages/
│   └── core/                      # Main application
│       ├── src/                   # React frontend
│       │   ├── components/
│       │   │   ├── shared/        # Reusable components
│       │   │   ├── pages/         # Page components
│       │   │   ├── layout/        # Layout components
│       │   │   └── providers/     # Context providers
│       │   ├── hooks/             # Custom React hooks
│       │   └── utils/             # Utility functions
│       ├── server/                # Elysia backend
│       │   ├── api-elysia.ts      # Main server entry
│       │   ├── routes/            # API route handlers
│       │   ├── services/          # Business logic
│       │   │   ├── api/           # External API clients
│       │   │   └── mesh/          # 3D processing services
│       │   └── db/                # Database layer
│       │       ├── schema/        # Drizzle schemas
│       │       └── migrations/    # SQL migrations
│       ├── dev-book/              # Comprehensive documentation
│       └── package.json
├── package.json                   # Workspace root
└── turbo.json                     # Build orchestration
```

## Key Architectural Patterns

### Service Layer

Business logic in `apps/core/server/services/`:

- `TeamService` - Team collaboration
- `AssetService` - Asset management
- `MeshyService` - 3D generation
- `AudioAPIClient` - Audio generation
- `ContentAPIClient` - AI content generation

### Route Layer

HTTP handlers in `apps/core/server/routes/`:

- TypeBox validation for all inputs/outputs
- Elysia route handlers with proper HTTP methods
- Swagger documentation tags
- Privy JWT authentication middleware

### Schema Layer

Database schemas with Drizzle in `apps/core/server/db/schema/`:

- TypeScript-first schema definitions
- Auto-generated migrations
- Type-safe queries

### Component Layer

Reusable React components in `apps/core/src/components/`:

- Functional components with hooks
- TypeScript with strict typing
- Proper cleanup in useEffect
- Loading and error states

## State Management

- **React Context** for global state (user, teams, projects)
- **React hooks** (`useState`, `useEffect`) for local state
- **Privy hooks** (`usePrivy`, `useWallets`) for auth
- **No Redux/MobX** - Keep it simple

## API Design Patterns

### Request/Response Flow

1. Client makes request to `/api/endpoint`
2. Vite proxy forwards to Elysia server in dev
3. Route handler validates with TypeBox
4. Service layer processes business logic
5. Database operations via Drizzle
6. Response with proper status codes

### Error Handling

```typescript
{ error: string, message: string }
```

### Status Codes

- 200: Success (GET, PATCH, DELETE)
- 201: Created (POST)
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid auth)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error
