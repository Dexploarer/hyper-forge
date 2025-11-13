# Asset-Forge Development Book

Comprehensive documentation for Asset-Forge AI-powered 3D asset generation platform.

## Table of Contents

- [User Guides](#user-guides)
- [Developer Documentation](#developer-documentation)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Video Scripts](#video-scripts)
- [Migration Guides](#migration-guides)

---

## User Guides

Documentation for end-users of the Asset-Forge platform.

### Core Features

- **[Projects Management](user-guide/projects.md)** - Organize assets into projects, archive completed work, and manage project settings
- **[Admin Dashboard](user-guide/admin-dashboard.md)** - User management, role assignment, activity logs, and system monitoring
- **[World Configuration (Advanced)](user-guide/world-configuration-advanced.md)** - Define rich game worlds with races, factions, skills, and AI context

### Getting Started

- **Asset Generation** - Create 3D models from text descriptions using AI (coming soon)
- **Asset Library** - Browse, filter, and manage your generated assets (coming soon)
- **Authentication** - Privy wallet-based authentication setup (coming soon)

---

## Developer Documentation

Technical documentation for developers working on Asset-Forge.

### Core Guides

- **[World Config Integration](developer/world-config-integration.md)** - Integrate world configuration data into your AI pipelines
- **[Testing Philosophy](developer/testing-philosophy.md)** ⭐ **NEW** - Smart mocking strategy explained
  - Zero mocks for internal code (database, HTTP, business logic)
  - Strategic mocks for external APIs (OpenAI, Meshy, Privy)
  - Test isolation and mini-world pattern
  - Helper usage and best practices
- **Database Schema** - Drizzle ORM schema and relationships (coming soon)
- **Architecture Overview** - System design and component interactions (coming soon)

### API Integration

- **Type-Safe API Client** - Eden Treaty usage and examples (See main README)
- **Authentication** - Privy JWT token handling (See main README)
- **Error Handling** - Structured error responses and retry strategies (coming soon)

---

## API Documentation

Complete API reference and versioning strategy.

### API Reference

- **[API Versioning Strategy](api/versioning-strategy.md)** ⭐ **NEW**
  - Current versioning approach (V1 implicit)
  - URL path versioning strategy
  - Breaking changes definition
  - Deprecation policy (6-month timeline)
  - Migration guides and examples
  - Backwards compatibility rules

- **[Swagger/OpenAPI Documentation](/swagger)** - Interactive API documentation (available when server is running)
  - Health Check Endpoints (`/api/health`, `/api/health/live`, `/api/health/ready`)
  - Asset Management (`/api/assets`)
  - Generation Pipeline (`/api/generation/pipeline`)
  - Projects (`/api/projects`)
  - Users & Authentication (`/api/users`)
  - Admin Endpoints (`/api/admin`)
  - And 15+ more endpoint categories

### Endpoint-Specific Docs

- **[Projects API](../server/routes/docs/README-projects.md)** - Project management endpoints
- **[Admin API](../server/routes/docs/README-admin.md)** - Admin-only endpoints

---

## Deployment

Production deployment guides and checklists.

### Production Deployment

- **[Production Checklist](deployment/production-checklist.md)** ⭐ **NEW**
  - Environment variables (required & recommended)
  - Database setup and migrations
  - Security configuration (CORS, rate limiting, secrets)
  - Performance tuning (Bun flags, connection pooling)
  - Monitoring setup (Prometheus, health checks, logging)
  - Infrastructure (load balancer, CDN, replicas)
  - Pre-deployment tests
  - Deployment steps (Railway & manual)
  - Post-deployment verification
  - Rollback procedure
  - Common issues and solutions

### Platform-Specific Guides

- **Railway Deployment** - Detailed Railway setup (See Production Checklist)
- **Docker Deployment** - Containerization guide (coming soon)
- **Kubernetes** - K8s manifests and configuration (coming soon)

---

## Troubleshooting

Common issues and solutions.

### By Category

- **Database Issues** - Connection failures, migration problems (See Production Checklist, Common Issues)
- **Asset Storage** - File not found, volume mounting (See Production Checklist, Common Issues)
- **API Errors** - Rate limiting, CORS, authentication (See Production Checklist, Common Issues)
- **Performance** - Memory usage, slow response times (See Production Checklist, Common Issues)
- **Generation Pipeline** - AI service failures, job stuck (See Production Checklist, Common Issues)

### Debug Tools

- **Health Check Endpoints** - `/api/health`, `/api/health/ready`, `/api/health/deep`
- **Metrics Endpoint** - `/metrics` (Prometheus format)
- **Debug Headers** - `/api/debug/headers`
- **Drizzle Studio** - `bun run db:studio` (Visual database inspector)

---

## Video Scripts

Scripts for tutorial and demo videos.

- **Video Scripts** - Coming soon

---

## Migration Guides

Guides for migrating between major versions.

### API Migrations

- **[V1 → V2 Migration](api/versioning-strategy.md#version-migration)** - When V2 is released (planned 2026-Q1)
  - Pagination changes
  - Field renaming (camelCase → snake_case)
  - Breaking changes overview
  - Step-by-step migration instructions

### Database Migrations

- **Drizzle Kit Migrations** - Schema changes and migration workflow (See main README)
- **Data Migrations** - Large-scale data transformations (coming soon)

---

## Quick Links

### For Users

- [Projects Management](user-guide/projects.md) - Organize your assets
- [Admin Dashboard](user-guide/admin-dashboard.md) - User and system management
- [World Configuration](user-guide/world-configuration-advanced.md) - Create game worlds

### For Developers

- [Testing Philosophy](developer/testing-philosophy.md) - Smart mocking strategy
- [World Config Integration](developer/world-config-integration.md) - AI context integration
- [API Versioning Strategy](api/versioning-strategy.md) - Version management
- [Production Checklist](deployment/production-checklist.md) - Deployment guide

### For DevOps

- [Production Checklist](deployment/production-checklist.md) - Complete deployment guide
- [API Versioning](api/versioning-strategy.md) - Version lifecycle management
- [Health Check Endpoints](deployment/production-checklist.md#monitoring-setup) - Monitoring configuration

---

## Documentation Standards

### File Organization

```
dev-book/
├── README.md                    # This file
├── user-guide/                  # End-user documentation
│   ├── projects.md
│   ├── admin-dashboard.md
│   └── world-configuration-advanced.md
├── developer/                   # Technical guides
│   └── world-config-integration.md
├── api/                         # API documentation
│   └── versioning-strategy.md
├── deployment/                  # Deployment guides
│   └── production-checklist.md
├── troubleshooting/             # Problem solving
├── migration/                   # Migration guides
└── video-scripts/               # Tutorial scripts
```

### Writing Guidelines

1. **Clear Headings** - Use descriptive, hierarchical headings
2. **Code Examples** - Include working code snippets with syntax highlighting
3. **Cross-References** - Link to related documentation
4. **Screenshots** - Add visuals for UI-related docs (optional but helpful)
5. **Keep Updated** - Document changes as they happen
6. **Versioning** - Note which version documentation applies to

### Contributing to Documentation

1. **Check Existing Docs** - Avoid duplication
2. **Follow Structure** - Use established patterns
3. **Test Examples** - Ensure code examples work
4. **Link Liberally** - Create connections between related docs
5. **Update TOC** - Keep this README current

---

## External Resources

### Official Documentation

- **[Elysia](https://elysiajs.com/)** - Bun-native web framework
- **[Bun Runtime](https://bun.sh/docs)** - JavaScript runtime
- **[Drizzle ORM](https://orm.drizzle.team/)** - TypeScript ORM
- **[Privy](https://docs.privy.io/)** - Authentication platform
- **[Three.js](https://threejs.org/docs/)** - 3D graphics library
- **[React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)** - React Three.js renderer

### Related Projects

- **[Hyperscape RPG](#)** - The game this tool powers
- **[Meshy AI](https://www.meshy.ai/)** - 3D model generation
- **[OpenAI](https://platform.openai.com/docs)** - AI content generation

---

## Need Help?

### Support Channels

- **GitHub Issues** - Bug reports and feature requests
- **Documentation** - Start here (you're in the right place!)
- **API Reference** - Check `/swagger` when server is running
- **Health Check** - Use `/api/health/deep` to diagnose issues

### Common Questions

**Q: Where's the Swagger UI?**
A: Start the server (`bun run dev`) and visit `http://localhost:3004/swagger`

**Q: How do I add a new API endpoint?**
A: See the [API Versioning Strategy](api/versioning-strategy.md) for breaking changes policy

**Q: Database migration failed, what do I do?**
A: Check [Production Checklist - Common Issues](deployment/production-checklist.md#common-issues)

**Q: Where are environment variables documented?**
A: See [Production Checklist - Environment Variables](deployment/production-checklist.md#environment-variables)

**Q: How do I test the API?**
A: Use the Eden Treaty client (type-safe) or Swagger UI (interactive) - see main README

---

**Last Updated:** 2025-11-12

**Maintained By:** Asset-Forge Development Team

**Contributing:** Pull requests welcome! Please follow the documentation standards above.
