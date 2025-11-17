---
sidebar_position: 1
slug: /
---

# Welcome to Asset-Forge

**Asset-Forge** is an AI-powered 3D asset generation platform designed for game developers. Transform text descriptions into production-ready 3D models, characters, and game content using cutting-edge AI technology.

## Quick Start

Get up and running with Asset-Forge in minutes:

1. **[Set up your development environment](/docs/developer/getting-started)** - Install dependencies and configure services
2. **[Explore the API](/docs/api-reference)** - Comprehensive API documentation
3. **[Try the interactive Swagger UI](http://localhost:3004/swagger)** - Test endpoints in your browser

## Key Features

### 3D Asset Generation

- Generate 3D models from text descriptions
- Multiple art styles (realistic, stylized, low-poly)
- Automatic rigging and animation support
- Material and texture variations

### Content Creation

- NPC character generation with portraits and dialogue
- Quest and storyline creation
- Lore and world-building tools
- AI-powered music and sound effects

### Project Management

- Organize assets into projects
- Version control and variants
- Collaborative workflows
- Public profile sharing

## Documentation Sections

### User Guides

Learn how to use Asset-Forge effectively:

- **[Projects Management](/docs/user-guide/projects)** - Organize and manage your assets
- **[Admin Dashboard](/docs/user-guide/admin-dashboard)** - User and system administration
- **[World Configuration](/docs/user-guide/world-configuration-advanced)** - Define rich game worlds

### Developer Documentation

Technical guides for integrating and extending Asset-Forge:

- **[Testing Philosophy](/docs/developer/testing-philosophy)** - Our testing strategy
- **[World Config Integration](/docs/developer/world-config-integration)** - AI context integration

### API Reference

Complete API documentation:

- **[API Reference](/docs/api-reference)** - Auto-generated from OpenAPI spec
- **[Swagger UI](http://localhost:3004/swagger)** - Interactive API testing
- **[API Versioning Strategy](/docs/api/versioning-strategy)** - Version management

### Deployment

Production deployment guides:

- **[Production Checklist](/docs/deployment/production-checklist)** - Complete deployment guide
- **[CI/CD](/docs/deployment/ci-cd)** - Continuous integration and deployment
- **[Observability](/docs/deployment/observability)** - Monitoring and logging

## Technology Stack

Asset-Forge is built with modern, performant technologies:

- **Frontend**: React 19 + Vite + Three.js
- **Backend**: Elysia (Bun) + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **AI Services**: Vercel AI SDK + Meshy AI + OpenAI/Anthropic
- **Authentication**: Privy (wallet-based)
- **3D Rendering**: Three.js + React Three Fiber

## Getting Help

### Support Channels

- **[GitHub Issues](https://github.com/yourorg/asset-forge/issues)** - Bug reports and feature requests
- **[API Reference](/docs/api-reference)** - Comprehensive API documentation
- **[Health Check](http://localhost:3004/api/health/deep)** - System diagnostics

### Common Questions

**Q: Where's the Swagger UI?**
A: Start the server (`bun run dev`) and visit `http://localhost:3004/swagger`

**Q: How do I add a new API endpoint?**
A: See the [API Versioning Strategy](/docs/api/versioning-strategy) for our development process

**Q: Database migration failed, what do I do?**
A: Check [Production Checklist - Common Issues](/docs/deployment/production-checklist#common-issues)

## Contributing

We welcome contributions! Please see our development documentation for:

- Code style guidelines
- Testing requirements
- Pull request process
- Documentation standards

## License

MIT License - see LICENSE file for details.

---

**Ready to get started?** Head over to the [User Guides](/docs/user-guide/projects) or dive into the [API Reference](/docs/api-reference).
