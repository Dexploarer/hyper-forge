/**
 * Z-Index Layering System
 *
 * Scale: Increments of 10 to allow future additions
 * Range: 0-100 (keep low to avoid accessibility conflicts)
 *
 * Usage: Import and use via Tailwind classes (z-overlay, z-modal, etc.)
 * These values are extended into Tailwind's theme in tailwind.config.cjs
 *
 * @see https://www.smashingmagazine.com/2021/02/css-z-index-large-projects/
 */
export const Z_INDEX = {
  // Base layers
  base: 0,
  raised: 10,

  // Navigation (same level - don't overlap)
  header: 20,
  sidebar: 20,
  bottomNav: 20,

  // Interactive elements
  dropdown: 30,
  tooltip: 40,

  // Overlays (modals, drawers, panels)
  overlay: 50, // Backdrop for modals/drawers
  modal: 60, // Modals, Drawers, Panels
  commandPalette: 70, // Command palette (top priority)

  // Notifications (always on top)
  notification: 80,
  toast: 90,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;
