# Asset-Forge Claude Code Instructions

This is the Claude Code configuration for the Asset-Forge project.

## Project Overview

Asset-Forge is an AI-powered 3D asset generation platform for game development, using:

- React + Vite + Three.js frontend
- Elysia (Bun) backend
- PostgreSQL + Drizzle ORM
- Vercel AI SDK for content generation
- Meshy AI for 3D generation

## Development Standards

**MOST CRITICAL - READ FIRST:**

- Always use Deepwiki when implementing anything new, fixing errors, or troubleshooting
- Never assume knowledge about external libraries - use `mcp__deepwiki__ask_question` first
- Code is a liability - prefer editing over creating, simple over complex
- Research first, code last

## Key Technologies

Use Deepwiki MCP for current documentation on these:

- **Elysia**: `elysiajs/elysia` - Fast Bun web framework
- **Drizzle ORM**: `drizzle-team/drizzle-orm` - TypeScript ORM
- **Three.js**: `mrdoob/three.js` - 3D rendering
- **React Three Fiber**: `pmndrs/react-three-fiber` - React Three.js
- **Vercel AI SDK**: AI orchestration with AI Gateway
- **Privy**: `privy-io/privy-js` - Wallet authentication

## Bun-First Development

Default to using Bun instead of Node.js:

- Use `bun <file>` instead of `node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install`
- Use `bun run <script>` instead of `npm run`
- Bun automatically loads .env, don't use dotenv

## Testing Standards

- **NO MOCKS OR SPIES** - Use real implementations only
- Build mini-worlds for feature tests
- Use Playwright for browser automation
- Test both data and visual output
- 100% pass rate required before deployment

## Architecture

### Monorepo Structure

```
asset-forge/
├── packages/
│   └── core/             # Main application
│       ├── src/          # React frontend
│       ├── server/       # Elysia backend
│       └── dev-book/     # Documentation
├── package.json          # Workspace root
└── turbo.json            # Build orchestration
```

### Design Principles

- **Modular**: Each feature is self-contained
- **Type-Safe**: TypeScript strict mode everywhere
- **RESTful APIs**: Follow REST conventions
- **Database First**: Schema-driven development

### Tech Stack Specifics

- **Frontend**: React 19.2.0 + Vite 6.0 + TypeScript
- **3D**: Three.js 0.169.0 + React Three Fiber + Drei
- **Backend**: Elysia 1.4.15 (Bun) + TypeScript
- **Database**: PostgreSQL + Drizzle ORM 0.44.6
- **Auth**: Privy (JWT wallet-based)
- **AI**: Vercel AI SDK 5.0.89 + Meshy + OpenAI/Anthropic via AI Gateway

## Database Migrations

When schema changes are needed:

1. Edit TypeScript schema in `packages/core/server/db/schema/`
2. Generate migration: `bun run db:generate`
3. Review generated SQL in `server/db/migrations/`
4. Apply migration: `bun run db:migrate`
5. Commit both schema and migration files

## API Development

When adding new endpoints:

1. **Research with Deepwiki** - Check current Elysia patterns
2. Define types in service file with TypeBox
3. Implement business logic in service class
4. Create route handler with TypeBox validation
5. Add Swagger documentation
6. Write tests (no mocks!)
7. Run tests: `bun test`

## Git Workflow

- Create feature branch from `main`
- Make commits with descriptive messages
- Run tests before pushing
- Create PR with description and test plan
- Merge after approval and CI pass

## Common Commands

```bash
# Development
bun run dev                  # Start dev server
bun run dev:frontend         # Frontend only
bun run dev:backend          # Backend only

# Building
bun run build                # Production build

# Testing
bun test                     # All tests
bun test --watch             # Watch mode
bun test --coverage          # With coverage

# Database
bun run db:generate          # Generate migration
bun run db:migrate           # Apply migrations
bun run db:studio            # Drizzle Studio

# Type Checking
bun run typecheck            # Check types
```

## Environment Variables

Required in `packages/core/.env`:

- `DATABASE_URL` - PostgreSQL connection
- `PRIVY_APP_ID` / `PRIVY_APP_SECRET` - Authentication
- `AI_GATEWAY_API_KEY` - Vercel AI Gateway (recommended)
- `MESHY_API_KEY` - 3D generation

## Code Style

- Use 2-space indentation
- Use TypeScript strict mode
- No `any` or `unknown` types
- Use `const` over `let`, never `var`
- Template literals for strings
- Explicit return types on public methods

## Key Files

- `packages/core/server/api-elysia.ts` - Main API server
- `packages/core/server/db/schema/` - Database schemas
- `packages/core/src/components/shared/ThreeViewer.tsx` - 3D viewer
- `packages/core/dev-book/` - Comprehensive documentation

## Research-First Protocol

Before ANY code changes:

1. **USE DEEPWIKI** - Mandatory for external libraries
2. **Read existing code** - Use Read, Grep, Glob tools
3. **Check for reuse** - Triple-check existing implementations
4. **Ask user** - Verify assumptions before coding
5. **Keep simple** - Avoid over-engineering
6. **Write code** - Only after steps 1-5

## Remember

- I don't know anything current - use Deepwiki
- My knowledge is outdated (cutoff January 2025)
- Stop assuming I'm smart - verify with current docs
- Code last, research first, always

For more details, see:

- `packages/core/dev-book/` - Full documentation
- `packages/core/CLAUDE.md` - Package-specific instructions
- `SEPARATION_PLAN.md` - Migration documentation
