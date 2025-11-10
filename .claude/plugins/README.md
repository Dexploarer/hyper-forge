# Hyperscape-5 Team Plugins

Comprehensive plugin system aligned with ADRs and architectural standards.

## 🎯 Plugin Overview

This plugin system provides specialized tools, agents, and autonomous Skills that enforce project standards and accelerate development.

### Core Philosophy

- **ADR-Driven**: Every plugin aligns with documented Architecture Decision Records
- **Standards Enforcement**: Automated enforcement of TypeScript strict typing (ADR-0006) and real testing (ADR-0007)
- **Deepwiki Integration**: All commands use Deepwiki for research and best practices
- **No Exceptions**: Strict standards with zero tolerance for violations

## 📦 Installed Plugins

### 1. core-dev

**Core development tools - ADRs, builds, testing, TypeScript standards**

**Commands:**

- `/adr-create` - Create new Architecture Decision Record
- `/strict-typing-check` - Enforce TypeScript strict typing (ADR-0006)
- `/real-testing` - Real gameplay testing with Playwright (ADR-0007)
- `/turbo-build` - Turbo monorepo build orchestration (ADR-0002)

**Agents:**

- `strict-typescript-enforcer` - NO `any` types enforcer (ADR-0006)
- `real-testing-specialist` - Playwright real testing expert (ADR-0007)

**Skills:**

- `adr-assistant` - Autonomous ADR creation and analysis
- `type-safety-guardian` - Autonomous TypeScript strict typing enforcement

**ADRs:** 0002, 0006, 0007

---

### 2. elizaos-dev

**ElizaOS integration tools for AI agents and NPCs**

**Commands:**

- `/create-agent` - Create ElizaOS agent character for NPCs

**Agents:**

- `elizaos-integration-expert` - ElizaOS AI agent specialist (ADR-0005)

**ADRs:** 0005

---

### 3. deployment-tools

**Railway deployment with RAILPACK**

**Commands:**

- `/railway-deploy` - Deploy to Railway with pre-deployment checklist

**ADRs:** 0003

---

## 🤖 Specialized Agents

Agents are experts you can invoke with `/agents` for specific domains:

| Agent                        | Expertise                | Key Focus                                    |
| ---------------------------- | ------------------------ | -------------------------------------------- |
| `strict-typescript-enforcer` | TypeScript strict typing | Zero `any` types, proper type inference      |
| `real-testing-specialist`    | Playwright testing       | No mocks, real gameplay, visual verification |
| `elizaos-integration-expert` | ElizaOS AI agents        | NPC creation, actions, providers, memory     |

## 🎨 Autonomous Skills

Skills activate automatically based on context to provide proactive assistance:

| Skill                  | Triggers                | What It Does                                            |
| ---------------------- | ----------------------- | ------------------------------------------------------- |
| `adr-assistant`        | Architectural decisions | Creates ADRs, analyzes alternatives, uses Deepwiki      |
| `type-safety-guardian` | TypeScript code         | Enforces strict typing, catches `any` types immediately |

## 🚀 Quick Start

### After Plugin Installation

1. **View available commands:**

   ```
   /help
   ```

2. **See installed plugins:**

   ```
   /plugin
   ```

3. **Access specialized agents:**
   ```
   /agents
   ```

### Common Workflows

#### Starting New Feature

```
/adr-create [Feature Decision]  # Document architectural decision
/strict-typing-check            # Ensure no type violations
/real-testing                   # Create Playwright tests
/turbo-build                    # Verify builds pass
```

#### Creating AI NPCs

```
/create-agent                   # Create ElizaOS character
# Use elizaos-integration-expert agent for advanced integration
```

#### Pre-Deployment

```
/railway-deploy                 # Run full pre-deployment checklist
```

## 📋 Architecture Decision Records Reference

Plugins enforce standards from these ADRs:

| ADR  | Title                       | Enforced By                               |
| ---- | --------------------------- | ----------------------------------------- |
| 0001 | Bun Package Manager         | All plugins (use `bun` commands)          |
| 0002 | Turbo Build Orchestration   | `core-dev` - `/turbo-build`               |
| 0003 | Railway RAILPACK Deployment | `deployment-tools` - `/railway-deploy`    |
| 0004 | PostgreSQL Database         | Server package database configuration     |
| 0005 | ElizaOS AI Framework        | `elizaos-dev` - all commands/agents       |
| 0006 | TypeScript Strict Typing    | `core-dev` - `strict-typescript-enforcer` |
| 0007 | Real Gameplay Testing       | `core-dev` - `real-testing-specialist`    |

## 🔧 Development Standards Enforcement

### TypeScript Strict Typing (ADR-0006)

**Forbidden:**

- `any` types - **NEVER**
- `as any` casts - **NEVER**
- `unknown` types (except external APIs)
- Property existence checks
- Optional chaining for type narrowing

**Required:**

- Explicit return types on public methods
- Strong type assumptions
- Non-null assertions when safe
- Discriminated unions
- Shared types from `types/core.ts`

**Enforcement:**

- `strict-typescript-enforcer` agent
- `type-safety-guardian` skill
- `/strict-typing-check` command

### Real Testing (ADR-0007)

**Philosophy:**

- NO mocks, spies, or test framework abstractions
- Build mini-worlds for tests
- Use real Hyperscape instances with Playwright
- Test multimodal (data + visual + behavior)

**Visual Proxy Colors:**

- 🔴 Red - Players
- 🟢 Green - Goblins
- 🔵 Blue - Items
- 🟡 Yellow - Trees
- 🟣 Purple - Banks
- 🟨 Beige - Stores

**Enforcement:**

- `real-testing-specialist` agent
- `/real-testing` command

## 🎓 Best Practices

### Always Use Deepwiki

All commands and agents are configured to use Deepwiki for:

- Researching implementation patterns
- Understanding frameworks (Drizzle, ElizaOS, Elysia)
- Troubleshooting errors
- Learning best practices

### Follow ADR Guidelines

Before implementing features:

1. Check relevant ADRs for standards
2. Use appropriate plugin commands
3. Invoke specialized agents for expertise
4. Let autonomous Skills assist proactively

### Maintain Quality Standards

Per CLAUDE.md compliance checklist:

- [ ] All tests pass (no failing tests)
- [ ] No `any` types in code
- [ ] Features have comprehensive tests
- [ ] Error logs properly handled
- [ ] API keys in environment variables
- [ ] No hardcoded data
- [ ] Documentation current

## 📁 Plugin Structure

```
.claude/plugins/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace manifest
├── core-dev/                      # Core development tools
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── commands/                  # /adr-create, /strict-typing-check, etc.
│   ├── agents/                    # strict-typescript-enforcer, real-testing-specialist
│   └── skills/                    # adr-assistant, type-safety-guardian
├── elizaos-dev/                   # ElizaOS integration
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── commands/                  # /create-agent
│   └── agents/                    # elizaos-integration-expert
├── deployment-tools/              # Railway deployment
│   ├── .claude-plugin/
│   │   └── plugin.json
│   └── commands/                  # /railway-deploy
└── README.md                      # This file
```

## 🔄 Auto-Installation

When team members trust this repository:

1. Claude Code adds `hyperscape-5` marketplace from `./.claude/plugins`
2. Automatically installs all 3 plugins
3. Enables all commands, agents, and skills
4. Enforces project standards immediately

## 🛠️ Customization

Individual developers can override in `.claude/settings.local.json` (not committed to git).

## 📚 Related Documentation

- [ADR Directory](/Users/home/hyperscape-5/adr/) - Architecture Decision Records
- [CLAUDE.md](/Users/home/hyperscape-5/CLAUDE.md) - Project development guidelines
- [README.md](/Users/home/hyperscape-5/README.md) - Main project documentation

## 🤝 Contributing

To add new plugins:

1. Create plugin directory: `.claude/plugins/your-plugin/`
2. Add manifest: `.claude/plugins/your-plugin/.claude-plugin/plugin.json`
3. Create components (commands, agents, skills)
4. Update marketplace.json
5. Update settings.json to auto-install
6. Document in this README

---

**Last Updated**: 2025-11-09
**Plugin Count**: 3
**Commands**: 5
**Agents**: 3
**Skills**: 2
**ADRs Covered**: 7
