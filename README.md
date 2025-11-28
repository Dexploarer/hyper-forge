# Asset-Forge

AI-powered 3D asset generation platform for game development.

## Features

- 🎨 **AI-Powered Generation**: Create 3D models using Meshy AI from text prompts
- 🎮 **Game-Ready Assets**: Export rigged, textured models ready for game engines
- 🔄 **Material Variants**: Generate multiple texture variations from a single model
- 🎭 **Character System**: Create NPCs with personalities, dialogue, and behavior
- 📖 **Content Generation**: AI-powered quest and lore generation for world-building
- 🔊 **Voice Integration**: ElevenLabs voice synthesis for character dialogue
- 🎵 **Audio Generation**: Music and sound effects generation
- 🛡️ **Armor Fitting**: Advanced armor fitting system for character customization
- ✋ **Hand Rigging**: Automated hand rigging for VRM models
- 🎬 **Animation Retargeting**: Retarget animations between different skeletons

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **3D Rendering**: Three.js + React Three Fiber + Drei
- **Backend**: Elysia (Bun) + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Privy (wallet-based authentication)
- **AI Services**:
  - Vercel AI SDK (unified AI Gateway)
  - Meshy AI (3D generation)
  - OpenAI / Anthropic (content generation)
  - ElevenLabs (voice, music, sound effects)

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.1.38
- PostgreSQL database
- API keys:
  - Privy (authentication)
  - Meshy AI (3D generation)
  - Vercel AI Gateway (content generation)
  - ElevenLabs (optional - voice/audio)

### Installation

```bash
# Clone repository
git clone https://github.com/yourorg/asset-forge.git
cd asset-forge

# Install dependencies
bun install

# Set up environment variables
cp apps/core/.env.example apps/core/.env
# Edit .env with your API keys and database URL

# Run database migrations
bun run db:migrate

# Start development server
bun run dev
```

The application will be available at:

- **Frontend**: Port 3000 (configurable via VITE_PORT)
- **API**: Port 3004 (configurable via PORT)

## Development

### Available Scripts

```bash
# Development
bun run dev              # Start all dev servers
bun run dev:core         # Start core package only

# Building
bun run build            # Build all packages
bun run build:core       # Build core package only

# Testing
bun test                 # Run all tests
bun test:core            # Run core package tests

# Database
bun run db:generate      # Generate migration
bun run db:migrate       # Apply migrations
bun run db:push          # Push schema (dev only)
bun run db:studio        # Launch Drizzle Studio

# Code Quality
bun run lint             # Lint all packages
bun run typecheck        # Type check all packages
bun run clean            # Clean build artifacts
```

### Project Structure

```
asset-forge/
├── apps/
│   └── core/                    # Main application
│       ├── src/                 # React frontend
│       │   ├── components/      # UI components
│       │   ├── pages/           # Page components
│       │   ├── hooks/           # React hooks
│       │   ├── stores/          # Zustand state
│       │   └── lib/             # Utilities
│       ├── server/              # Elysia backend
│       │   ├── routes/          # API routes
│       │   ├── services/        # Business logic
│       │   ├── db/              # Database layer
│       │   └── middleware/      # Middleware
│       ├── public/              # Static assets
│       ├── scripts/             # Utility scripts
│       └── dev-book/            # Documentation
├── packages/                    # Shared packages
├── package.json                 # Workspace root
├── turbo.json                   # Build config
└── README.md                    # This file
```

## Documentation

Comprehensive documentation is available in [`apps/core/dev-book/`](./apps/core/dev-book/):

- [Getting Started](./apps/core/dev-book/02-getting-started/)
- [Architecture](./apps/core/dev-book/04-architecture/)
- [API Reference](./apps/core/dev-book/12-api-reference/)
- [Development Guide](./apps/core/dev-book/11-development/)
- [Deployment](./apps/core/dev-book/14-deployment/)

## Environment Variables

See [`apps/core/.env.example`](./apps/core/.env.example) for all required environment variables.

Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `PRIVY_APP_ID` - Privy application ID
- `PRIVY_APP_SECRET` - Privy secret key
- `AI_GATEWAY_API_KEY` - Vercel AI Gateway API key
- `MESHY_API_KEY` - Meshy AI API key

## Features Overview

### 3D Asset Generation

Generate game-ready 3D models from text descriptions using Meshy AI. Supports automatic rigging, material generation, and LOD optimization.

### Content Generation

AI-powered generation of:

- **Dialogue Trees**: Branching conversation systems for NPCs
- **NPCs**: Complete character profiles with personality, appearance, and behavior
- **Quests**: Full quest chains with objectives, rewards, and narrative
- **Lore**: World-building content and backstories

### Armor Fitting

Advanced mesh fitting system for attaching armor and equipment to character models with automatic scaling and positioning.

### Hand Rigging

Automated hand skeleton detection and rigging for VRM models, with support for custom hand poses.

### Animation Retargeting

Retarget animations between different character skeletons with automatic bone mapping.

## Testing

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

## Deployment

### Railway (Recommended)

1. Create Railway project
2. Add PostgreSQL database
3. Set environment variables
4. Connect GitHub repository
5. Deploy!

See [Deployment Guide](./apps/core/dev-book/14-deployment/) for detailed instructions.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT](./LICENSE) - See LICENSE file for details

## Support

- **Documentation**: [dev-book](./apps/core/dev-book/)
- **Issues**: [GitHub Issues](https://github.com/yourorg/asset-forge/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourorg/asset-forge/discussions)

## Acknowledgments

- [Meshy AI](https://www.meshy.ai/) - 3D generation
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI orchestration
- [Three.js](https://threejs.org/) - 3D rendering
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) - React Three.js
- [Elysia](https://elysiajs.com/) - Web framework
- [Drizzle ORM](https://orm.drizzle.team/) - Database ORM
- [Privy](https://www.privy.io/) - Authentication

---

Built with ❤️ by the Asset-Forge Team
