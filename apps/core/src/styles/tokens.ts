// Design Tokens - Single Source of Truth for Design System
// These tokens ensure consistency across all components and replace scattered CSS variables

export const colors = {
  // Primary colors - Hex-inspired palette
  primary: {
    DEFAULT: "#6366f1", // Indigo - keeping for brand consistency
    light: "#818cf8",
    dark: "#4f46e5",
    rgb: "99, 102, 241",
  },
  secondary: {
    DEFAULT: "#8b5cf6", // Violet - keeping for brand consistency
    light: "#a78bfa",
    dark: "#7c3aed",
    rgb: "139, 92, 246",
  },

  // Accent color - Asset-Forge signature soft pink/rose
  accent: {
    DEFAULT: "#F5C0C0", // Asset-Forge signature soft pink/rose
    light: "#f9d5d5",
    dark: "#e6a8a8",
    rgb: "245, 192, 192",
  },

  // Dark Theme Colors - Hex-inspired deep blue-tinted blacks
  dark: {
    "bg-primary": "#14141C", // Deeper, blue-tinted black (Hex style)
    "bg-secondary": "#1a1a24", // Subtle blue undertone
    "bg-tertiary": "#22222e", // Slightly lighter blue-black
    "bg-card": "#1f1f29", // Card backgrounds
    "bg-hover": "#292936", // Hover states
    "bg-elevated": "#2a2a38", // Elevated surfaces
    "bg-disabled": "#1a1a24", // Disabled state backgrounds

    "text-primary": "#ffffff", // Pure white for maximum contrast
    "text-secondary": "#b4b4c0", // Soft gray with blue undertone
    "text-tertiary": "#8484a0", // Medium gray-blue
    "text-muted": "#787890", // Muted text - improved contrast (was #64647a, now ~4.2:1)
    "text-disabled": "#4a4a5a", // Disabled text
    "text-link": "#818cf8", // Link color (primary light)
    "text-link-hover": "#a5b4fc", // Link hover

    "border-primary": "#3a3a48", // Borders - improved contrast (was #2a2a36)
    "border-secondary": "#4a4a5a", // Slightly more visible (was #3a3a48)
    "border-hover": "#5a5a6a", // Hover state borders (was #4a4a5a)
    "border-disabled": "#2a2a36", // Disabled borders
    "border-focus": "#6366f1", // Focus ring color

    "focus-ring": "rgba(99, 102, 241, 0.5)", // Focus ring with opacity
    "focus-outline": "#6366f1", // Focus outline color
  },

  // Light Theme Colors - Clean, bright Hex-inspired
  light: {
    "bg-primary": "#ffffff", // Pure white background
    "bg-secondary": "#fafafa", // Very subtle off-white
    "bg-tertiary": "#f5f5f5", // Light gray
    "bg-card": "#fafafa", // Card backgrounds - subtle elevation (was #ffffff)
    "bg-hover": "#f5f5f5", // Hover states
    "bg-elevated": "#f0f0f0", // Elevated surfaces - visible depth (was #ffffff)
    "bg-disabled": "#f5f5f5", // Disabled state backgrounds

    "text-primary": "#0a0a0a", // Near-black for excellent contrast
    "text-secondary": "#52525b", // Dark gray
    "text-tertiary": "#71717a", // Medium gray
    "text-muted": "#71717a", // Muted text - improved contrast (was #a1a1aa, now ~4.8:1)
    "text-disabled": "#d4d4d8", // Disabled text
    "text-link": "#4f46e5", // Link color (primary dark for better contrast on white)
    "text-link-hover": "#6366f1", // Link hover

    "border-primary": "#e5e5e5", // Light borders
    "border-secondary": "#d4d4d8", // Slightly darker
    "border-hover": "#a1a1aa", // Hover state borders
    "border-disabled": "#f0f0f0", // Disabled borders
    "border-focus": "#6366f1", // Focus ring color

    "focus-ring": "rgba(99, 102, 241, 0.3)", // Focus ring with opacity (lighter for light theme)
    "focus-outline": "#6366f1", // Focus outline color
  },

  // Semantic Colors - Theme-aware for accessibility
  semantic: {
    // Success
    // base: main text/icon color (auto-adjusts by theme via CSS variable)
    "success-base-dark": "#10b981", // Dark theme text/icon
    "success-base-light": "#059669", // Light theme text/icon (darker for contrast)
    // strong: darker variant, always safe on light backgrounds
    "success-strong": "#059669",
    // soft: lighter variant, used for chips/badges on dark theme
    "success-soft": "#34d399",
    // backgrounds: theme-aware opacity
    "success-bg-dark": "rgba(16, 185, 129, 0.16)", // Higher opacity for dark theme visibility
    "success-bg-light": "rgba(16, 185, 129, 0.1)", // Standard opacity for light theme

    // Warning
    "warning-base-dark": "#f59e0b",
    "warning-base-light": "#d97706",
    "warning-strong": "#d97706",
    "warning-soft": "#fbbf24",
    "warning-bg-dark": "rgba(245, 158, 11, 0.16)",
    "warning-bg-light": "rgba(245, 158, 11, 0.1)",

    // Error
    "error-base-dark": "#ef4444",
    "error-base-light": "#dc2626",
    "error-strong": "#dc2626",
    "error-soft": "#f87171",
    "error-bg-dark": "rgba(239, 68, 68, 0.16)",
    "error-bg-light": "rgba(239, 68, 68, 0.1)",

    // Info
    "info-base-dark": "#3b82f6",
    "info-base-light": "#2563eb",
    "info-strong": "#2563eb",
    "info-soft": "#60a5fa",
    "info-bg-dark": "rgba(59, 130, 246, 0.16)",
    "info-bg-light": "rgba(59, 130, 246, 0.1)",
  },

  // Utility Colors
  utility: {
    white: "#ffffff",
    black: "#000000",
    transparent: "transparent",
    "overlay-dark": "rgba(0, 0, 0, 0.5)",
    "overlay-light": "rgba(255, 255, 255, 0.5)",
  },

  // UI Colors (alias for semantic colors for compatibility)
  ui: {
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },
} as const;

export const spacing = {
  0: "0",
  px: "1px",
  0.5: "0.125rem", // 2px
  1: "0.25rem", // 4px
  1.5: "0.375rem", // 6px
  2: "0.5rem", // 8px
  2.5: "0.625rem", // 10px
  3: "0.75rem", // 12px
  3.5: "0.875rem", // 14px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  7: "1.75rem", // 28px
  8: "2rem", // 32px
  9: "2.25rem", // 36px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  14: "3.5rem", // 56px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  32: "8rem", // 128px
  40: "10rem", // 160px
  48: "12rem", // 192px
  56: "14rem", // 224px
  64: "16rem", // 256px
  72: "18rem", // 288px
  80: "20rem", // 320px
  96: "24rem", // 384px
} as const;

export const borderRadius = {
  none: "0",
  sm: "0.375rem", // 6px
  md: "0.5rem", // 8px
  lg: "0.75rem", // 12px
  xl: "1rem", // 16px
  "2xl": "1.5rem", // 24px
  "3xl": "2rem", // 32px
  full: "9999px",
  pill: "9999px",
} as const;

export const typography = {
  fontFamily: {
    // Hex-inspired: Inter for clean, modern geometric sans-serif
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    // Display font for large headings (using Inter with tighter spacing)
    display:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    // Monospace for code
    mono: '"JetBrains Mono", "SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace',
  },

  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
    "6xl": "3.75rem", // 60px
    "7xl": "4.5rem", // 72px - for hero text
    "8xl": "6rem", // 96px - for massive headlines
  },

  fontWeight: {
    thin: "100",
    light: "300", // Hex uses 300
    normal: "400", // Hex uses 400
    medium: "500",
    semibold: "600", // Hex uses 600
    bold: "700", // Hex uses 700
    extrabold: "800", // Hex uses 800
    black: "900",
  },

  lineHeight: {
    none: "1",
    tight: "1.25", // Tighter for headlines (Hex style)
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
    loose: "2",
  },

  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em", // Hex uses -0.025em for headings
    normal: "0em",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },
} as const;

export const effects = {
  boxShadow: {
    // Refined shadows for Hex-style (subtler, more elegant)
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
    none: "none",

    // Special shadows - Hex-inspired
    "glow-primary": `0 0 20px ${colors.primary.DEFAULT}40`,
    "glow-secondary": `0 0 20px ${colors.secondary.DEFAULT}40`,
    "glow-accent": `0 0 20px ${colors.accent.DEFAULT}40`,
    "elevation-1": "0 2px 4px rgba(0, 0, 0, 0.08)",
    "elevation-2": "0 4px 8px rgba(0, 0, 0, 0.12)",
    "elevation-3": "0 8px 16px rgba(0, 0, 0, 0.16)",
  },

  opacity: {
    0: "0",
    5: "0.05",
    10: "0.1",
    20: "0.2",
    25: "0.25",
    30: "0.3",
    40: "0.4",
    50: "0.5",
    60: "0.6",
    70: "0.7",
    75: "0.75",
    80: "0.8",
    90: "0.9",
    95: "0.95",
    100: "1",
  },
} as const;

export const animation = {
  duration: {
    instant: "0ms",
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
    slower: "500ms",
    slowest: "1000ms",
  },

  easing: {
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },

  // Predefined animations
  keyframes: {
    spin: "spin 1s linear infinite",
    pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    bounce: "bounce 1s infinite",
    fadeIn: "fadeIn 0.2s ease-out",
    fadeOut: "fadeOut 0.2s ease-in",
    slideUp: "slideUp 0.3s ease-out",
    slideDown: "slideDown 0.3s ease-out",
    scaleIn: "scaleIn 0.2s ease-out",
    shimmer: "shimmer 2s linear infinite",
  },
} as const;

export const layout = {
  breakpoints: {
    xs: "480px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  container: {
    xs: "100%",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  maxWidth: {
    content: "1200px",
    narrow: "800px",
    wide: "1600px",
  },

  zIndex: {
    0: "0",
    10: "10",
    20: "20",
    30: "30",
    40: "40",
    50: "50",
    auto: "auto",
  },
} as const;

// Export all tokens as a single theme object
export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  effects,
  animation,
  layout,
} as const;

// Helper function to generate CSS variables from tokens
export function generateCSSVariables(darkMode = true) {
  const themeColors = darkMode ? colors.dark : colors.light;
  const semanticBase = darkMode
    ? {
        success: colors.semantic["success-base-dark"],
        warning: colors.semantic["warning-base-dark"],
        error: colors.semantic["error-base-dark"],
        info: colors.semantic["info-base-dark"],
      }
    : {
        success: colors.semantic["success-base-light"],
        warning: colors.semantic["warning-base-light"],
        error: colors.semantic["error-base-light"],
        info: colors.semantic["info-base-light"],
      };
  const semanticBg = darkMode
    ? {
        success: colors.semantic["success-bg-dark"],
        warning: colors.semantic["warning-bg-dark"],
        error: colors.semantic["error-bg-dark"],
        info: colors.semantic["info-bg-dark"],
      }
    : {
        success: colors.semantic["success-bg-light"],
        warning: colors.semantic["warning-bg-light"],
        error: colors.semantic["error-bg-light"],
        info: colors.semantic["info-bg-light"],
      };

  return {
    // Brand colors
    "--color-primary": colors.primary.DEFAULT,
    "--color-primary-dark": colors.primary.dark,
    "--color-primary-light": colors.primary.light,
    "--color-primary-rgb": colors.primary.rgb,
    "--color-secondary": colors.secondary.DEFAULT,
    "--color-secondary-dark": colors.secondary.dark,
    "--color-secondary-light": colors.secondary.light,
    "--color-secondary-rgb": colors.secondary.rgb,
    "--color-accent": colors.accent.DEFAULT,
    "--color-accent-dark": colors.accent.dark,
    "--color-accent-light": colors.accent.light,
    "--color-accent-rgb": colors.accent.rgb,

    // Theme colors
    "--bg-primary": themeColors["bg-primary"],
    "--bg-secondary": themeColors["bg-secondary"],
    "--bg-tertiary": themeColors["bg-tertiary"],
    "--bg-card": themeColors["bg-card"],
    "--bg-hover": themeColors["bg-hover"],
    "--bg-elevated": themeColors["bg-elevated"],
    "--bg-disabled": themeColors["bg-disabled"],

    "--text-primary": themeColors["text-primary"],
    "--text-secondary": themeColors["text-secondary"],
    "--text-tertiary": themeColors["text-tertiary"],
    "--text-muted": themeColors["text-muted"],
    "--text-disabled": themeColors["text-disabled"],
    "--text-link": themeColors["text-link"],
    "--text-link-hover": themeColors["text-link-hover"],

    "--border-primary": themeColors["border-primary"],
    "--border-secondary": themeColors["border-secondary"],
    "--border-hover": themeColors["border-hover"],
    "--border-disabled": themeColors["border-disabled"],
    "--border-focus": themeColors["border-focus"], // For input borders on focus state

    "--focus-ring": themeColors["focus-ring"], // For focus-visible ring shadow
    "--focus-outline": themeColors["focus-outline"], // For focus-visible outline

    // Semantic colors - theme-aware base (main text/icon color)
    "--color-success": semanticBase.success,
    "--color-success-strong": colors.semantic["success-strong"], // Darker, safe on light bg
    "--color-success-soft": colors.semantic["success-soft"], // Lighter, for dark theme badges
    "--color-success-bg": semanticBg.success, // Theme-aware background opacity

    "--color-warning": semanticBase.warning,
    "--color-warning-strong": colors.semantic["warning-strong"],
    "--color-warning-soft": colors.semantic["warning-soft"],
    "--color-warning-bg": semanticBg.warning,

    "--color-error": semanticBase.error,
    "--color-error-strong": colors.semantic["error-strong"],
    "--color-error-soft": colors.semantic["error-soft"],
    "--color-error-bg": semanticBg.error,

    "--color-info": semanticBase.info,
    "--color-info-strong": colors.semantic["info-strong"],
    "--color-info-soft": colors.semantic["info-soft"],
    "--color-info-bg": semanticBg.info,

    // UI colors (for compatibility)
    "--color-ui-success": colors.ui.success,
    "--color-ui-warning": colors.ui.warning,
    "--color-ui-error": colors.ui.error,
    "--color-ui-info": colors.ui.info,

    // Utility colors
    "--overlay-dark": colors.utility["overlay-dark"], // For dimming modals/dialogs
    "--overlay-light": colors.utility["overlay-light"], // For frosted/glassy highlight effects

    // Typography
    "--font-sans": typography.fontFamily.sans,
    "--font-mono": typography.fontFamily.mono,

    // Effects
    "--shadow-sm": effects.boxShadow.sm,
    "--shadow-md": effects.boxShadow.md,
    "--shadow-lg": effects.boxShadow.lg,
    "--shadow-xl": effects.boxShadow.xl,

    // Animation
    "--duration-fast": animation.duration.fast,
    "--duration-base": animation.duration.base,
    "--duration-slow": animation.duration.slow,
    "--easing-out": animation.easing.out,
    "--easing-in-out": animation.easing.inOut,
  };
}
