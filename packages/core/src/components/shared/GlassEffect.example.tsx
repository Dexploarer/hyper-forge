/**
 * Glass Effect Usage Examples
 *
 * This file demonstrates how to use the liquid glass displacement effect
 * in your components. The effect creates a sophisticated frosted glass
 * appearance with chromatic aberration and subtle distortion.
 */

import React from 'react';
import { GlassEffect } from './GlassEffect';
import { GlassModal } from './GlassModal';

// Example 1: Simple glass panel
export const GlassPanelExample = () => {
  return (
    <GlassEffect
      preset="panel"
      className="p-6 rounded-xl"
      intensity={0.2}
      blur={10}
    >
      <h3 className="text-xl font-semibold mb-2">Glass Panel</h3>
      <p className="text-text-secondary">
        This panel has a liquid glass effect with subtle displacement.
      </p>
    </GlassEffect>
  );
};

// Example 2: Dock-style glass effect (like macOS Dock)
export const DockStyleExample = () => {
  return (
    <div className="flex gap-4 p-8">
      <GlassEffect
        preset="dock"
        className="p-4 rounded-2xl"
        intensity={0.3}
        saturation={1.5}
        frost={0.08}
      >
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/20" />
          <div className="w-12 h-12 rounded-lg bg-secondary/20" />
          <div className="w-12 h-12 rounded-lg bg-success/20" />
        </div>
      </GlassEffect>
    </div>
  );
};

// Example 3: Modal with glass effect
export const GlassModalExample = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary"
      >
        Open Glass Modal
      </button>

      <GlassModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Glass Modal Example"
        size="md"
        preset="modal"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            This modal uses the liquid glass displacement effect for a
            sophisticated, modern appearance.
          </p>

          <div className="flex gap-2">
            <button className="btn-primary">Confirm</button>
            <button className="btn-secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      </GlassModal>
    </>
  );
};

// Example 4: Pill-shaped glass button
export const PillGlassExample = () => {
  return (
    <GlassEffect
      preset="pill"
      className="px-8 py-4 rounded-full cursor-pointer hover:scale-105 transition-transform"
      intensity={0.15}
    >
      <span className="font-medium">Glass Button</span>
    </GlassEffect>
  );
};

// Example 5: Circular glass avatar
export const BubbleGlassExample = () => {
  return (
    <GlassEffect
      preset="bubble"
      className="w-32 h-32 rounded-full flex items-center justify-center"
      intensity={0.2}
    >
      <div className="text-4xl">👤</div>
    </GlassEffect>
  );
};

// Example 6: Sidebar with glass effect
export const GlassSidebarExample = () => {
  return (
    <GlassEffect
      preset="panel"
      className="w-64 h-screen p-6 rounded-r-2xl"
      intensity={0.25}
      blur={12}
      saturation={1.1}
    >
      <nav className="space-y-4">
        <h2 className="text-xl font-bold mb-6">Navigation</h2>

        <a href="#" className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
          Dashboard
        </a>
        <a href="#" className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
          Assets
        </a>
        <a href="#" className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
          Settings
        </a>
      </nav>
    </GlassEffect>
  );
};

/**
 * PROP REFERENCE:
 *
 * GlassEffect Props:
 * - preset: 'dock' | 'pill' | 'bubble' | 'modal' | 'panel'
 *   Controls the overall shape and border radius
 *
 * - intensity: number (0-1)
 *   Controls the strength of the glass displacement effect
 *   Default: 0.2
 *
 * - blur: number
 *   Controls the blur strength of the glass effect
 *   Default: 11
 *
 * - saturation: number
 *   Controls color saturation through the glass
 *   Default: 1 (1.2-1.5 for more vibrant)
 *
 * - frost: number (0-1)
 *   Controls the opacity/frost level
 *   Default: 0.05
 *
 * GlassModal Props:
 * - All GlassEffect props, plus:
 * - isOpen: boolean
 * - onClose: () => void
 * - title: string
 * - size: 'sm' | 'md' | 'lg' | 'xl'
 *
 * TIPS:
 * 1. Use lower intensity (0.1-0.2) for subtle effects
 * 2. Use higher saturation (1.3-1.5) for colorful backgrounds
 * 3. Combine with backdrop-blur for enhanced depth
 * 4. Works best over complex/colorful backgrounds
 * 5. Light mode and dark mode are automatically handled
 */
