// Breakpoints for responsive design
export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// Animation durations (in ms)
export const ANIMATION_DURATION = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
} as const;

// Common spacing values (matching Tailwind)
export const SPACING = {
  xs: "0.5rem", // 8px
  sm: "1rem", // 16px
  md: "1.5rem", // 24px
  lg: "2rem", // 32px
  xl: "3rem", // 48px
  "2xl": "4rem", // 64px
} as const;

// Max content widths
export const MAX_WIDTH = {
  content: "1200px",
  narrow: "800px",
  wide: "1600px",
} as const;
