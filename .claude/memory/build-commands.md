# Asset-Forge Build Commands

## Important: Always Use Bun

Asset-forge uses **Bun** as the JavaScript runtime and package manager. Never use npm, pnpm, or node.

## Development

```bash
# Start full-stack development (frontend + backend)
bun run dev                  # Runs both client and server

# Start frontend only (React + Vite)
bun run dev:frontend         # Port 3333 by default
bun run dev:client           # Alternative command

# Start backend only (Elysia)
bun run dev:backend          # Port 5555 by default
bun run dev:server           # Alternative command
```

## Building

```bash
# Build for production
bun run build                # Build both frontend and backend

# Build frontend only
bun run build:frontend       # Outputs to apps/core/dist/

# Build backend only
bun run build:backend        # Outputs to apps/core/server/dist/
```

## Database (Drizzle ORM)

```bash
# Generate migration from schema changes
bun run db:generate          # Creates SQL in server/db/migrations/

# Apply migrations to database
bun run db:migrate           # Runs pending migrations

# Launch Drizzle Studio (visual DB editor)
bun run db:studio            # Opens at http://test-db-studio:4983

# Push schema directly (dev only, no migrations)
bun run db:push              # Dangerous: use only in development

# Reset database (DANGER: deletes all data)
bun run db:reset             # Drops and recreates all tables
```

## Testing

```bash
# Run all tests
bun test                     # Runs all *.test.ts files

# Run tests in watch mode
bun test --watch             # Auto-runs on file changes

# Run tests with coverage
bun test --coverage          # Generates coverage report

# Run specific test file
bun test path/to/file.test.ts

# Run tests matching pattern
bun test --test-name-pattern="API"
```

## Type Checking

```bash
# Check TypeScript types
bun run typecheck            # Runs tsc --noEmit

# Check types in watch mode
bun run typecheck --watch    # Continuous type checking
```

## Linting & Formatting

```bash
# Run ESLint
bun run lint                 # Check code quality

# Run ESLint with auto-fix
bun run lint --fix           # Fix auto-fixable issues

# Format code with Prettier
bun run format               # Format all files

# Check formatting without changes
bun run format:check         # Verify formatting
```

## Package Management

```bash
# Install dependencies
bun install                  # Install all workspace dependencies

# Add a dependency
bun add <package>            # Add to current package

# Add dev dependency
bun add -d <package>         # Add as devDependency

# Remove dependency
bun remove <package>

# Update dependencies
bun update                   # Update all packages
bun update <package>         # Update specific package

# List installed packages
bun pm ls                    # List all installed packages
```

## Production

```bash
# Start production server
bun run start                # Run built backend

# Preview production build
bun run preview              # Serve built frontend locally
```

## Monorepo Workspace Commands

```bash
# Run command in specific workspace
bun run --filter @asset-forge/core <command>

# Install dependencies for all workspaces
bun install

# Build all packages
bun run build:all
```

## Environment Setup

```bash
# Copy example environment file
cp apps/core/.env.example apps/core/.env

# Edit environment variables
# Required:
# - DATABASE_URL
# - PRIVY_APP_ID
# - PRIVY_APP_SECRET
# - AI_GATEWAY_API_KEY (or individual API keys)
# - MESHY_API_KEY
```

## Helpful Debugging Commands

```bash
# Check Bun version
bun --version

# Clear Bun cache
bun pm cache rm

# Check running processes
lsof -i :3333                # Frontend port
lsof -i :5555                # Backend port

# View logs (if using PM2 or similar)
pm2 logs                     # View all logs
pm2 logs asset-forge         # View specific app logs
```

## Railway Deployment

```bash
# Login to Railway (if using CLI)
railway login

# Link to project
railway link

# View logs
railway logs

# Run migration in production
railway run bun run db:migrate
```

## Git Commands (Common)

```bash
# Create feature branch
git checkout -b feature/your-feature

# Stage changes
git add .

# Commit with message
git commit -m "feat: your feature description"

# Push to remote
git push -u origin feature/your-feature

# Pull latest changes
git pull origin main
```
