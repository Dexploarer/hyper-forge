---
description: Start Hyperscape development servers
allowed-tools: [Bash]
argument-hint: [client|server|shared|all]
---

# Development Server

Start development servers for Hyperscape packages with hot module replacement (HMR).

## Usage

- `/dev` or `/dev all` - Start all packages in dev mode [RECOMMENDED]
- `/dev client` - Client only (Vite dev server)
- `/dev server` - Server only (game server)
- `/dev shared` - Shared package watch mode

## Start All Packages (Default)

```bash
!`cd /Users/home/hyperscape-5 && echo "=== Starting Hyperscape Development ===" && echo "Client: http://localhost:3333" && echo "Server: http://localhost:5555" && echo && bun run dev`
```

## Client Only (Vite)

```bash
!`cd /Users/home/hyperscape-5/packages/client && echo "=== Starting Client Dev Server ===" && echo "URL: http://localhost:3333" && echo "Hot reload enabled" && echo && bun run dev`
```

## Server Only (Game Server)

```bash
!`cd /Users/home/hyperscape-5/packages/server && echo "=== Starting Game Server ===" && echo "Server: http://localhost:5555" && echo "WebSocket: ws://localhost:5555/ws" && echo && bun run dev`
```

## Shared Package (Watch Mode)

```bash
!`cd /Users/home/hyperscape-5/packages/shared && echo "=== Starting Shared Package (Watch Mode) ===" && echo "Building Hyperscape engine..." && echo && bun run dev`
```

## Server Endpoints

- **Client**: http://localhost:3333
- **Game Server**: http://localhost:5555
- **WebSocket**: ws://localhost:5555/ws

## Prerequisites

Before starting:

1. **Dependencies**: Installed (run `bun install`)
2. **Build shared**: Run `bun run build:shared` first
3. **Database**: Optional for basic dev

## Troubleshooting

**Port already in use:**

```bash
!`lsof -ti:3333 | xargs kill -9 2>/dev/null && echo "✓ Killed process on port 3333" || echo "Port 3333 is free"`
```

```bash
!`lsof -ti:5555 | xargs kill -9 2>/dev/null && echo "✓ Killed process on port 5555" || echo "Port 5555 is free"`
```

**Shared package not built:**

```bash
!`cd /Users/home/hyperscape-5 && bun run build:shared && echo "✓ Shared package built"`
```

## See Also

- `/dev:typecheck` - Run TypeScript type checking
- `/test` - Run tests
