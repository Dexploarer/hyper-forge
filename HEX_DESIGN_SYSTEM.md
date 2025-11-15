# Hex-Inspired Design System Implementation

This document outlines the new Hex-inspired design system that has been implemented in Asset Forge. The design follows the aesthetic and principles of Hex.tech, featuring clean typography, refined color palettes, and elegant visual design.

## Overview

The design system has been updated with:

- **Typography**: Inter font family (replacing system fonts)
- **Dark Theme**: Deep blue-tinted blacks (#14141C base)
- **Light Theme**: Clean, bright whites (#ffffff base)
- **Accent Color**: Soft pink/rose (#F5C0C0)
- **Refined Shadows**: Subtle, elegant shadows
- **Negative Letter Spacing**: -0.025em for headlines

## Typography

### Font Families

```css
/* Sans-serif (body text, UI) */
font-family:
  "Inter",
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;

/* Display (large headings) */
font-family:
  "Inter",
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;

/* Monospace (code) */
font-family: "JetBrains Mono", "SF Mono", "Monaco", monospace;
```

### Tailwind Classes

```tsx
// Regular body text
<p className="font-sans">Body text using Inter</p>

// Large display headings (with tight letter spacing)
<h1 className="font-display text-6xl font-extrabold tracking-tight">
  Bring everyone together
</h1>

// Code blocks
<code className="font-mono">const hello = "world"</code>
```

### Typography Scale

```tsx
text-xs   // 12px
text-sm   // 14px
text-base // 16px
text-lg   // 18px
text-xl   // 20px
text-2xl  // 24px
text-3xl  // 30px
text-4xl  // 36px
text-5xl  // 48px
text-6xl  // 60px
text-7xl  // 72px (hero text)
text-8xl  // 96px (massive headlines)
```

### Font Weights

```tsx
font - light; // 300 (Hex uses this)
font - normal; // 400
font - medium; // 500
font - semibold; // 600 (Hex uses this)
font - bold; // 700 (Hex uses this)
font - extrabold; // 800 (Hex uses this for large headings)
```

### Hex-Style Headings

```tsx
// Example: Hex-style hero heading
<h1 className="font-display text-7xl md:text-8xl font-extrabold tracking-tight leading-tight text-text-primary">
  Bring everyone together with data
</h1>

// Example: Section heading
<h2 className="font-display text-4xl font-bold tracking-tight leading-tight text-text-primary">
  Features
</h2>

// Example: Subheading
<h3 className="font-sans text-xl font-semibold text-text-secondary">
  Powerful analytics
</h3>
```

## Color Palette

### Dark Theme (Default)

```typescript
// Backgrounds
--bg-primary: #14141C    // Deep blue-tinted black
--bg-secondary: #1a1a24  // Subtle blue undertone
--bg-tertiary: #22222e   // Slightly lighter
--bg-card: #1f1f29       // Card backgrounds
--bg-hover: #292936      // Hover states
--bg-elevated: #2a2a38   // Elevated surfaces

// Text
--text-primary: #ffffff   // Pure white
--text-secondary: #b4b4c0 // Soft gray with blue
--text-tertiary: #8484a0  // Medium gray-blue
--text-muted: #64647a     // Muted text

// Borders
--border-primary: #2a2a36
--border-secondary: #3a3a48
--border-hover: #4a4a5a
```

### Light Theme

```typescript
// Backgrounds
--bg-primary: #ffffff   // Pure white
--bg-secondary: #fafafa // Very subtle off-white
--bg-tertiary: #f5f5f5  // Light gray
--bg-card: #ffffff      // Card backgrounds
--bg-hover: #f8f8f8     // Hover states
--bg-elevated: #ffffff  // Elevated surfaces

// Text
--text-primary: #0a0a0a   // Near-black
--text-secondary: #52525b // Dark gray
--text-tertiary: #71717a  // Medium gray
--text-muted: #a1a1aa     // Lighter gray

// Borders
--border-primary: #e5e5e5
--border-secondary: #d4d4d8
--border-hover: #a1a1aa
```

### Brand Colors

```tsx
// Primary (Indigo) - keeping for brand consistency
bg - primary; // #6366f1
text - primary; // Uses CSS variable

// Secondary (Violet)
bg - secondary; // #8b5cf6
text - secondary; // Uses CSS variable

// Accent (Hex's pink/rose) - NEW!
bg - accent; // #F5C0C0
text - accent; // #F5C0C0
border - accent; // #F5C0C0
```

### Using the Accent Color

```tsx
// Badge with accent color
<span className="px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-full">
  New Feature
</span>

// Button with accent hover
<button className="bg-primary hover:bg-accent transition-colors">
  Get Started
</button>

// Accent text
<p className="text-accent font-semibold">
  Special announcement
</p>
```

## Tailwind Usage Examples

### Cards (Hex-style)

```tsx
<div className="bg-bg-card border border-border-primary rounded-lg p-6 hover:border-border-hover transition-all">
  <h3 className="text-xl font-semibold text-text-primary mb-2">Card Title</h3>
  <p className="text-text-secondary">Card description goes here.</p>
</div>
```

### Buttons (Hex-style)

```tsx
// Primary button
<button className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-all shadow-md hover:shadow-lg">
  Get Started
</button>

// Accent button
<button className="px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent-dark transition-all">
  Special Action
</button>

// Ghost button
<button className="px-6 py-3 bg-transparent text-text-secondary border border-border-primary rounded-lg hover:bg-bg-hover hover:text-text-primary transition-all">
  Learn More
</button>
```

### Hero Section (Hex-style)

```tsx
<section className="min-h-screen flex items-center justify-center bg-bg-primary">
  <div className="max-w-6xl mx-auto px-6 text-center">
    <h1 className="font-display text-7xl md:text-8xl font-extrabold tracking-tight leading-tight text-text-primary mb-6">
      Bring everyone
      <br />
      together with data
    </h1>
    <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8">
      Go end-to-end from quick queries to deep-dive analyses to beautiful
      interactive data apps – all in one collaborative, AI-powered workspace.
    </p>
    <div className="flex gap-4 justify-center">
      <button className="px-6 py-3 bg-primary text-white font-semibold rounded-lg">
        Get started for free
      </button>
      <button className="px-6 py-3 bg-transparent text-text-primary border border-border-primary rounded-lg">
        Request a demo
      </button>
    </div>
  </div>
</section>
```

## Shadows

Refined, subtle shadows for Hex aesthetic:

```tsx
shadow - sm; // Very subtle
shadow - md; // Default
shadow - lg; // Elevated
shadow - xl; // Highly elevated
```

## Layout Tips

### Spacing

- Use generous whitespace between sections
- Keep content centered with max-width containers
- Use the 8px grid system (spacing scale)

### Typography Hierarchy

1. **Hero**: text-7xl/8xl, font-extrabold, tracking-tight
2. **H1**: text-5xl/6xl, font-bold, tracking-tight
3. **H2**: text-3xl/4xl, font-bold, tracking-tight
4. **H3**: text-2xl, font-semibold
5. **Body**: text-base, font-normal
6. **Small**: text-sm, font-normal

### Color Usage

- **Dark mode default**: Blue-tinted blacks (#14141C)
- **Light mode**: Pure whites (#ffffff)
- **Accent sparingly**: Use pink/rose for CTAs and highlights
- **High contrast text**: Always ensure readability

## Migration Guide

### Before

```tsx
<h1 className="text-4xl font-bold">Title</h1>
```

### After (Hex-style)

```tsx
<h1 className="font-display text-6xl font-extrabold tracking-tight leading-tight">
  Title
</h1>
```

## Theme Switching

The theme switcher component should toggle the `light-theme` class on the root element:

```tsx
// Dark mode (default)
<html>

// Light mode
<html class="light-theme">
```

## Best Practices

1. **Use Inter for all text**: Consistent, modern, readable
2. **Tight letter spacing on headings**: tracking-tight (-0.025em)
3. **Heavy weights for impact**: font-extrabold (800) for headlines
4. **Subtle shadows**: Less is more, Hex uses refined shadows
5. **High contrast**: Ensure text is always readable
6. **Accent color sparingly**: Use for CTAs and special highlights
7. **Generous spacing**: Don't crowd elements
8. **Clean borders**: Subtle, minimal border colors

## Resources

- **Inter Font**: [https://rsms.me/inter/](https://rsms.me/inter/)
- **JetBrains Mono**: [https://www.jetbrains.com/lp/mono/](https://www.jetbrains.com/lp/mono/)
- **Hex Website**: [https://hex.tech](https://hex.tech) (for inspiration)

## Quick Reference

```tsx
// Hex-style component example
const HexCard = () => (
  <div
    className="bg-bg-card border border-border-primary rounded-lg p-6
                  hover:border-border-hover transition-all shadow-md"
  >
    <h3 className="font-display text-2xl font-bold tracking-tight text-text-primary mb-2">
      Feature Title
    </h3>
    <p className="text-text-secondary leading-relaxed">
      Clean, modern description of the feature using Inter font.
    </p>
    <button
      className="mt-4 px-4 py-2 bg-primary text-white font-semibold rounded-lg
                       hover:bg-primary-dark transition-all"
    >
      Learn More
    </button>
  </div>
);
```

---

**Next Steps:**

1. Review your existing components
2. Update headings to use `font-display` with `tracking-tight`
3. Apply new color variables where needed
4. Test both dark and light themes
5. Ensure all text maintains high contrast

The new design system is fully backward compatible - all existing Tailwind classes will continue to work, but now with Hex-inspired aesthetics!
