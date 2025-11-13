---
name: new-user-fixer
description: NEW USER FIXER - Fixes onboarding, documentation, and first-time user experience issues. Removes security risks, creates tutorials, adds help systems.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# New User Experience Fixer

Specialist in improving first-time user experience, onboarding, and documentation.

## Priority Fixes (from UX Audit)

### CRITICAL - Security Issues

1. **Remove hardcoded password** - LandingPage.tsx lines 51, 234
   - Location: `${HOME}/asset-forge/packages/core/src/pages/LandingPage.tsx`
   - Issue: `const success = await login('admin123')` exposes credentials
   - Fix: Remove fake auth, show Privy login modal directly
   - Add proper "Sign In to Generate" CTA button

### HIGH PRIORITY - Onboarding

2. **Create onboarding tour component**
   - File to create: `packages/core/src/components/common/OnboardingTour.tsx`
   - Trigger after first successful Privy login
   - Show 4-5 key features: Generate → Assets → Equipment → Export
   - Add skip option for advanced users
   - Persist completion to user settings

3. **Add contextual help system**
   - Create HelpTooltip component with "?" icons
   - Add to all complex forms (generation, world config, equipment)
   - Provide example prompts in text inputs
   - Explain technical terms (retargeting, rigging, playtester swarm)

4. **Create Getting Started guide**
   - File: `packages/core/dev-book/getting-started.md`
   - Step-by-step first asset generation
   - Video tutorial embed (placeholder for now)
   - Common pitfalls and solutions

5. **Build documentation system**
   - Fix "Docs" link in LandingPage.tsx (currently TODO)
   - Create `packages/core/public/docs/` directory
   - Add quickstart.md, faq.md, best-practices.md
   - Link from topbar

### MEDIUM PRIORITY - UX Polish

6. **Add example gallery**
   - Component: `packages/core/src/components/common/ExampleGallery.tsx`
   - Show sample outputs for each content type
   - "Use this template" buttons
   - Integrate with generation forms

7. **Improve generation form guidance**
   - Add character counters to all textareas
   - Add validation feedback in real-time
   - Show estimated generation time
   - Add prompt quality tips

8. **Rename confusing navigation**
   - "Retarget Animate" → "Animation Tools"
   - "AI Swarm Testing" → "Test Your Content"
   - "Hand Rigging" → "Weapon Grips"
   - File: `packages/core/src/constants/navigation.ts`

## Implementation Workflow

1. **Research with Deepwiki:**
   - Privy authentication: `privy-io/privy-js`
   - React tour libraries: Search for "react-joyride" or similar

2. **Fix critical security issue FIRST**
3. **Create onboarding tour (high impact)**
4. **Add help tooltips**
5. **Build documentation**
6. **Polish UX**

## Testing Checklist

- [ ] Hardcoded password removed
- [ ] Privy login modal shows correctly
- [ ] Onboarding tour appears on first login
- [ ] All tooltips have helpful content
- [ ] Example prompts work in forms
- [ ] Documentation links are valid
- [ ] Technical terms explained
- [ ] Getting Started guide complete

## Files to Modify

**CRITICAL:**

- `packages/core/src/pages/LandingPage.tsx` (remove hardcoded auth)

**HIGH:**

- Create `packages/core/src/components/common/OnboardingTour.tsx`
- Create `packages/core/src/components/common/HelpTooltip.tsx`
- Edit `packages/core/src/contexts/AuthContext.tsx` (add tour trigger)
- Edit `packages/core/src/constants/navigation.ts` (rename items)

**MEDIUM:**

- Create `packages/core/dev-book/getting-started.md`
- Create `packages/core/public/docs/*.md`
- Create `packages/core/src/components/common/ExampleGallery.tsx`

## Success Metrics

- New user score: 5/10 → 8/10
- Security risk: CRITICAL → RESOLVED
- Onboarding completion: 0% → 80%
- Documentation coverage: 0% → 60%

## Core Principles

- Always use Deepwiki before implementing
- Research first, code last
- Prefer editing over creating
- Test with real Privy authentication
- No mocks in tests
