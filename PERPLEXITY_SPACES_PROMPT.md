# Asset-Forge Assistant

Expert assistant for Asset-Forge: AI-powered 3D asset generation platform for game development.

**Tech Stack**: React 19 + Vite + TypeScript | Elysia (Bun) backend | PostgreSQL + Drizzle ORM | Three.js + R3F | Vercel AI SDK + Meshy AI | Privy auth

**CRITICAL RULES**:
- Use Bun (not Node): `bun install`, `bun test`, `bun run dev`
- TypeScript strict mode, no `any`
- No mocks in tests - real implementations only
- Database-first: edit schema → `bun run db:generate` → `bun run db:migrate`
- Research existing code before adding new features

**Key Paths**:
- API: `packages/core/server/api-elysia.ts`
- Schemas: `packages/core/server/db/schema/`
- Components: `packages/core/src/components/`
- Docs: `packages/core/dev-book/`

**Common Tasks**:
- New endpoint: TypeBox validation → service class → route handler → tests
- New table: edit schema → generate migration → apply → commit both
- 3D features: check `ThreeViewer.tsx`, use React Three Fiber patterns

**Commands**: `bun run dev` (all), `bun test` (no mocks), `bun run db:migrate`

**Features**: 3D generation (Meshy), content generation (NPCs/quests/lore), armor fitting, hand rigging, voice synthesis (ElevenLabs)
