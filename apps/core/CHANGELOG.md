# Changelog

All notable changes to Asset-Forge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Projects Feature**: Complete project management system
  - Create, edit, archive, and restore projects
  - Assign assets to projects for better organization
  - Project statistics dashboard showing asset counts and types
  - Admin project management with full CRUD operations
  - Filter assets by project in the Assets page
  - Project-based asset organization

- **Admin Dashboard Enhancements**:
  - Activity log viewer with filtering by user, action, and date range
  - User search and advanced filters (role, status, profile completion)
  - Last login column in user management table
  - Pending profiles stat card for incomplete user profiles
  - User deletion with confirmation modal and safety measures
  - Column sorting for name, email, join date, and last login
  - CSV export for activity logs
  - System statistics dashboard

  - User role management (promote/demote)

- **World Configuration UI**:
  - Template browsing and creation from pre-built templates
    - Fantasy Medieval template
    - Sci-Fi Space template
    - Post-Apocalyptic template
    - Modern Urban Fantasy template
    - Cyberpunk template
  - JSON import with validation and preview
  - Configuration history viewer with version tracking
  - Validation display with error linking and real-time feedback
  - Export configurations as JSON
  - Configuration comparison between versions

- **World Config Integration**:
  - Automatic AI context injection for content generation
  - Enhanced NPC generation with race and faction awareness
  - Enhanced quest generation with faction relationships
  - Enhanced dialogue generation with cultural context
  - Enhanced item generation matching world parameters
  - Context caching for performance optimization
  - Token management and optimization strategies

- **Documentation**:
  - Comprehensive user guides for projects, admin dashboard, and world configuration
  - Developer API documentation for projects and admin endpoints
  - World configuration integration guide for developers
  - Updated README with feature highlights and documentation links

### Changed

- Improved user filtering performance in admin dashboard
- Enhanced asset filtering to support project-based organization
- Optimized world configuration context building for faster AI generation
- Updated navigation with clearer labels for admin features

### Fixed

- Admin dashboard test failures resolved
- World config optional loading edge cases
- Asset filtering when no project is selected
- User deletion cascade behavior with assets and projects

## [1.4.0] - 2025-11-11

### Added

- Voice generation system with multiple voice actors
- Audio asset management and playback
- Music generation capabilities
- Sound effects generation

### Changed

- Improved 3D viewer performance
- Enhanced asset library UI

### Fixed

- Asset deletion cascade issues
- Authentication token refresh

## [1.3.0] - 2025-11-08

### Added

- Playtester swarm simulation for content testing
- Advanced retargeting and animation system
- Hand rigging with AI-powered grip detection

### Changed

- Updated to Elysia 1.4.15
- Improved Meshy API integration
- Enhanced error handling across all routes

### Fixed

- Material preset loading issues
- Sprite generation edge cases

## [1.2.0] - 2025-11-05

### Added

- Content generation system (NPCs, quests, dialogues)
- Vector search for semantic asset discovery
- Seed data for testing

### Changed

- Migrated to Drizzle ORM from Prisma
- Updated database schema with better relationships
- Improved API type safety with TypeBox

### Fixed

- Database connection pooling issues
- Asset metadata inconsistencies

## [1.1.0] - 2025-11-01

### Added

- User authentication with Privy
- User profiles and management
- Admin whitelist system
- Activity logging for admin actions

### Changed

- Switched from Node.js to Bun runtime
- Migrated from Express to Elysia
- Improved API performance significantly

### Fixed

- Memory leaks in 3D viewer
- Asset upload validation

## [1.0.0] - 2025-10-28

### Added

- Initial release
- AI-powered 3D asset generation
- Asset library with 3D viewer
- Armor fitting system
- Hand rigging system
- Material variant generation
- Sprite generation from 3D models

[Unreleased]: https://github.com/yourusername/asset-forge/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/yourusername/asset-forge/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/yourusername/asset-forge/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/yourusername/asset-forge/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/yourusername/asset-forge/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/yourusername/asset-forge/releases/tag/v1.0.0
