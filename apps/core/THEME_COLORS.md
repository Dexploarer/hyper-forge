# Theme Colors Reference

Complete color palette for Asset-Forge's light and dark themes.

## Brand Colors (Theme-Independent)

### Primary
- **Default**: `#6366f1` (Indigo)
- **Light**: `#818cf8`
- **Dark**: `#4f46e5`
- **RGB**: `99, 102, 241`

### Secondary
- **Default**: `#8b5cf6` (Violet)
- **Light**: `#a78bfa`
- **Dark**: `#7c3aed`
- **RGB**: `139, 92, 246`

### Accent
- **Default**: `#F5C0C0` (Asset-Forge signature soft pink/rose)
- **Light**: `#f9d5d5`
- **Dark**: `#e6a8a8`
- **RGB**: `245, 192, 192`

---

## Dark Theme Colors

### Backgrounds
- **bg-primary**: `#14141C` - Deeper, blue-tinted black
- **bg-secondary**: `#1a1a24` - Subtle blue undertone
- **bg-tertiary**: `#22222e` - Slightly lighter blue-black
- **bg-card**: `#1f1f29` - Card backgrounds
- **bg-hover**: `#292936` - Hover states
- **bg-elevated**: `#2a2a38` - Elevated surfaces
- **bg-disabled**: `#1a1a24` - Disabled state backgrounds (same as bg-secondary; always pair with text-disabled and border-disabled for visibility)

### Text
- **text-primary**: `#ffffff` - Pure white for maximum contrast
- **text-secondary**: `#b4b4c0` - Soft gray with blue undertone
- **text-tertiary**: `#8484a0` - Medium gray-blue
- **text-muted**: `#787890` - Muted text (~4.26:1). Suitable for large or deemphasized text; does not meet AA for small body text (requires ≥4.5:1)
- **text-disabled**: `#4a4a5a` - Disabled text
- **text-link**: `#818cf8` - Link color (primary light)
- **text-link-hover**: `#a5b4fc` - Link hover state

### Borders
- **border-primary**: `#3a3a48` - Borders (improved contrast)
- **border-secondary**: `#4a4a5a` - Slightly more visible
- **border-hover**: `#5a5a6a` - Hover state borders
- **border-disabled**: `#2a2a36` - Disabled borders
- **border-focus**: `#6366f1` - Input border color on focus

### Focus States
- **focus-ring**: `rgba(99, 102, 241, 0.5)` - Focus ring with opacity
- **focus-outline**: `#6366f1` - Focus outline color

---

## Light Theme Colors

### Backgrounds
- **bg-primary**: `#ffffff` - Pure white background
- **bg-secondary**: `#fafafa` - Very subtle off-white
- **bg-tertiary**: `#f5f5f5` - Light gray
- **bg-card**: `#fafafa` - Card backgrounds (subtle elevation)
- **bg-hover**: `#f5f5f5` - Hover states
- **bg-elevated**: `#f0f0f0` - Elevated surfaces (visible depth)
- **bg-disabled**: `#f5f5f5` - Disabled state backgrounds (same as bg-tertiary; always pair with text-disabled and border-disabled for visibility)

### Text
- **text-primary**: `#0a0a0a` - Near-black for excellent contrast
- **text-secondary**: `#52525b` - Dark gray
- **text-tertiary**: `#71717a` - Medium gray
- **text-muted**: `#71717a` - Muted text (WCAG AA compliant: ~4.8:1)
- **text-disabled**: `#d4d4d8` - Disabled text
- **text-link**: `#4f46e5` - Link color (primary dark for better contrast)
- **text-link-hover**: `#6366f1` - Link hover state

### Borders
- **border-primary**: `#e5e5e5` - Light borders
- **border-secondary**: `#d4d4d8` - Slightly darker
- **border-hover**: `#a1a1aa` - Hover state borders
- **border-disabled**: `#f0f0f0` - Disabled borders
- **border-focus**: `#6366f1` - Input border color on focus

### Focus States
- **focus-ring**: `rgba(99, 102, 241, 0.3)` - Focus ring with opacity (lighter for light theme)
- **focus-outline**: `#6366f1` - Focus outline color

---

## Semantic Colors (Theme-Aware for Accessibility)

Semantic colors are tuned to improve contrast in both themes (darker in light theme, lighter in dark theme). Each semantic color has four variants:

- **base**: Main text/icon color (auto-adjusts by theme via CSS variable `--color-{semantic}`)
- **strong**: Darker variant, always safe on light backgrounds (`--color-{semantic}-strong`)
- **soft**: Lighter variant, used for chips/badges on dark theme (`--color-{semantic}-soft`)
- **bg**: Background color with theme-aware opacity (`--color-{semantic}-bg`)

### Success

**CSS Variable Mapping:**
- `--color-success` = **base** (auto-adjusts)
  - Dark theme: `#10b981`
  - Light theme: `#059669`
- `--color-success-strong` = `#059669` (darker, safe on light bg)
- `--color-success-soft` = `#34d399` (lighter, for dark theme badges)
- `--color-success-bg` = Background (auto-adjusts opacity)
  - Dark theme: `rgba(16, 185, 129, 0.16)` (higher opacity for visibility)
  - Light theme: `rgba(16, 185, 129, 0.1)` (standard opacity)

### Warning

**CSS Variable Mapping:**
- `--color-warning` = **base** (auto-adjusts)
  - Dark theme: `#f59e0b`
  - Light theme: `#d97706`
- `--color-warning-strong` = `#d97706`
- `--color-warning-soft` = `#fbbf24`
- `--color-warning-bg` = Background (auto-adjusts opacity)
  - Dark theme: `rgba(245, 158, 11, 0.16)`
  - Light theme: `rgba(245, 158, 11, 0.1)`

### Error

**CSS Variable Mapping:**
- `--color-error` = **base** (auto-adjusts)
  - Dark theme: `#ef4444`
  - Light theme: `#dc2626`
- `--color-error-strong` = `#dc2626`
- `--color-error-soft` = `#f87171`
- `--color-error-bg` = Background (auto-adjusts opacity)
  - Dark theme: `rgba(239, 68, 68, 0.16)`
  - Light theme: `rgba(239, 68, 68, 0.1)`

### Info

**CSS Variable Mapping:**
- `--color-info` = **base** (auto-adjusts)
  - Dark theme: `#3b82f6`
  - Light theme: `#2563eb`
- `--color-info-strong` = `#2563eb`
- `--color-info-soft` = `#60a5fa`
- `--color-info-bg` = Background (auto-adjusts opacity)
  - Dark theme: `rgba(59, 130, 246, 0.16)`
  - Light theme: `rgba(59, 130, 246, 0.1)`

---

## Utility Colors

- **white**: `#ffffff`
- **black**: `#000000`
- **transparent**: `transparent`
- **overlay-dark**: `rgba(0, 0, 0, 0.5)` - For dimming modals/dialogs (use in both themes)
- **overlay-light**: `rgba(255, 255, 255, 0.5)` - For frosted/glassy highlight effects (not for modal dimming)

---

## CSS Variable Names

### Brand Colors
- `--color-primary`
- `--color-primary-dark`
- `--color-primary-light`
- `--color-primary-rgb`
- `--color-secondary`
- `--color-secondary-dark`
- `--color-secondary-light`
- `--color-secondary-rgb`
- `--color-accent`
- `--color-accent-dark`
- `--color-accent-light`
- `--color-accent-rgb`

### Theme Colors (Dynamic)
- `--bg-primary`
- `--bg-secondary`
- `--bg-tertiary`
- `--bg-card`
- `--bg-hover`
- `--bg-elevated`
- `--bg-disabled`
- `--text-primary`
- `--text-secondary`
- `--text-tertiary`
- `--text-muted`
- `--text-disabled`
- `--text-link`
- `--text-link-hover`
- `--border-primary`
- `--border-secondary`
- `--border-hover`
- `--border-disabled`
- `--border-focus` (for input borders on focus state)
- `--focus-ring` (for focus-visible ring shadow)
- `--focus-outline` (for focus-visible outline)

### Semantic Colors (Theme-Aware)
- `--color-success` (base - auto-adjusts by theme)
- `--color-success-strong` (darker, safe on light bg)
- `--color-success-soft` (lighter, for dark theme badges)
- `--color-success-bg` (background - auto-adjusts opacity by theme)
- `--color-warning` (base - auto-adjusts by theme)
- `--color-warning-strong`
- `--color-warning-soft`
- `--color-warning-bg` (background - auto-adjusts opacity by theme)
- `--color-error` (base - auto-adjusts by theme)
- `--color-error-strong`
- `--color-error-soft`
- `--color-error-bg` (background - auto-adjusts opacity by theme)
- `--color-info` (base - auto-adjusts by theme)
- `--color-info-strong`
- `--color-info-soft`
- `--color-info-bg` (background - auto-adjusts opacity by theme)

### Utility Colors
- `--overlay-dark`
- `--overlay-light`

---

## Usage in Code

### TypeScript/JavaScript
```typescript
import { colors } from '@/styles/tokens';

// Access colors - structure matches exactly:
// colors.primary.DEFAULT, colors.primary.light, colors.primary.dark
// colors.dark['bg-primary'], colors.light['text-primary']
// colors.accent.DEFAULT

const primaryColor = colors.primary.DEFAULT;
const darkBg = colors.dark['bg-primary'];
const lightText = colors.light['text-primary'];
const accentColor = colors.accent.DEFAULT;

// Semantic colors - internal keys map to CSS variables:
// Each semantic (success, warning, error, info) follows this pattern:
// {semantic}-base-dark/light → --color-{semantic} (auto-selected by theme)
// {semantic}-strong → --color-{semantic}-strong
// {semantic}-soft → --color-{semantic}-soft
// {semantic}-bg-dark/light → --color-{semantic}-bg (auto-selected by theme)

// Internal semantic keys (tokens.ts):
// - success-base-dark / success-base-light
// - success-strong
// - success-soft
// - success-bg-dark / success-bg-light
// (Same pattern for warning, error, info)

const successBaseDark = colors.semantic['success-base-dark']; // Maps to --color-success in dark theme
const successBaseLight = colors.semantic['success-base-light']; // Maps to --color-success in light theme
const successStrong = colors.semantic['success-strong']; // Maps to --color-success-strong
const successSoft = colors.semantic['success-soft']; // Maps to --color-success-soft

// Same pattern for other semantics:
const warningBaseDark = colors.semantic['warning-base-dark'];
const errorStrong = colors.semantic['error-strong'];
const infoSoft = colors.semantic['info-soft'];
```

### CSS/Tailwind
```css
/* Using CSS variables */
.my-element {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

/* Focus states */
.focusable:focus-visible {
  outline: 2px solid var(--focus-outline);
  box-shadow: 0 0 0 4px var(--focus-ring);
}

/* Semantic backgrounds */
.success-bg {
  background-color: var(--color-success-bg);
  color: var(--color-success);
}

/* Input focus borders */
input:focus {
  border-color: var(--border-focus);
}
```

```tsx
// Using Tailwind with CSS variables
// CORRECT: Use border class + color variable
<div className="border border-[color:var(--border-primary)] bg-[var(--bg-card)] text-[color:var(--text-primary)]">
  Content
</div>

// OR: Define in tailwind.config.cjs and use semantic names
<div className="border border-border-primary bg-bg-card text-text-primary">
  Content
</div>

// Focus states - using focus-outline and focus-ring
<button className="focus-visible:outline-2 focus-visible:outline-[color:var(--focus-outline)] focus-visible:ring-4 focus-visible:ring-[color:var(--focus-ring)]">
  Click me
</button>

// Input borders on focus - using border-focus
<input className="border border-[color:var(--border-primary)] focus:border-[color:var(--border-focus)]" />

// Disabled states - CORRECT: include border class
<button
  disabled
  className="
    border
    border-[color:var(--border-disabled)]
    bg-[var(--bg-disabled)]
    text-[color:var(--text-disabled)]
  "
>
  Disabled
</button>

// Links
<a href="#" className="text-[color:var(--text-link)] hover:text-[color:var(--text-link-hover)]">
  Link
</a>
```

---

## Accessibility Notes

### Contrast Ratios
- **Dark Theme text-muted**: `#787890` on `#14141C` = ~4.26:1. Suitable for large text (≥18pt regular or ≥14pt bold) or deemphasized UI chrome; does not meet AA for normal body text (requires ≥4.5:1)
- **Light Theme text-muted**: `#71717a` on `#ffffff` = ~4.83:1 (WCAG AA compliant for normal text)
- **Semantic colors**: Tuned to improve contrast in both themes (darker in light theme, lighter in dark theme). WCAG AA compliance depends on usage (font size, weight, and background).
- **Focus states**: Visible focus rings with 2px outline + 4px ring shadow
- **Disabled states**: Intentionally low contrast (~1.36-1.99:1) - standard for non-interactive elements, WCAG exception applies

### Theme-Aware Semantic Colors
Semantic colors (success, warning, error, info) automatically adjust based on theme via CSS variable overrides:

```css
:root {
  --color-success: #10b981; /* Dark theme */
  /* ... */
}

.light-theme {
  --color-success: #059669; /* Light theme - darker for contrast */
  --color-success-bg: rgba(16, 185, 129, 0.1); /* Lower opacity for light theme */
  /* ... */
}
```

- **Dark theme**: Uses lighter base colors for visibility on dark backgrounds, higher background opacity (0.16)
- **Light theme**: Uses darker base colors for WCAG AA compliance on white backgrounds, standard background opacity (0.1)

---

## Source Files

- **Design Tokens**: `apps/core/src/styles/tokens.ts`
- **CSS Variables**: `apps/core/src/styles/index.css`

---

## Key Improvements

1. ✅ **All brand colors have CSS variables** (including accent)
2. ✅ **Semantic background colors** exposed as variables
3. ✅ **Utility overlays** exposed as variables
4. ✅ **Improved contrast** for muted text (AA for light theme body text; dark theme muted is AA for large text only)
5. ✅ **Theme-aware semantic colors** for accessibility
6. ✅ **Light theme elevation** with visible depth (bg-card, bg-elevated)
7. ✅ **Improved dark theme borders** for better visibility
8. ✅ **Focus state tokens** (focus-ring, focus-outline)
9. ✅ **Disabled state tokens** (bg-disabled, text-disabled, border-disabled)
10. ✅ **Link color tokens** (text-link, text-link-hover)

---

## Notes

- Dark theme is the default theme
- Light theme is applied via `.light-theme` class on the root element
- All colors are defined in `tokens.ts` as the single source of truth
- CSS variables are generated from tokens for runtime theme switching
- Semantic colors automatically adjust per theme to improve accessibility (darker in light theme, lighter in dark theme)
- Grid background pattern uses secondary color with opacity:
  - Dark: `rgba(139, 92, 246, 0.15)`
  - Light: `rgba(139, 92, 246, 0.08)`
