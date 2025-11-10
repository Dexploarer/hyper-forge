import React, { useEffect, useRef, useState } from 'react';

interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  preset?: 'dock' | 'pill' | 'bubble' | 'modal' | 'panel';
  intensity?: number;
  blur?: number;
  saturation?: number;
  frost?: number;
}

export const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = '',
  preset = 'modal',
  intensity = 0.2,
  blur = 11,
  saturation = 1,
  frost = 0.05,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const filterId = useRef(`glass-filter-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const presetConfig = {
    dock: { radius: 16, border: 0.07 },
    pill: { radius: 40, border: 0.05 },
    bubble: { radius: 70, border: 0.1 },
    modal: { radius: 12, border: 0.08 },
    panel: { radius: 8, border: 0.06 },
  };

  const config = presetConfig[preset];
  const border = Math.min(dimensions.width, dimensions.height) * (config.border * 0.5);
  const scale = -180;

  return (
    <div
      ref={containerRef}
      className={`glass-effect ${className}`}
      style={{
        position: 'relative',
        backdropFilter: `url(#${filterId.current}) brightness(1.1) saturate(${saturation})`,
        background: `hsl(0 0% 100% / ${frost})`,
        boxShadow: `
          0 0 2px 1px color-mix(in oklch, currentColor, #0000 85%) inset,
          0 0 10px 4px color-mix(in oklch, currentColor, #0000 90%) inset,
          0px 4px 16px rgba(17, 17, 26, 0.05),
          0px 8px 24px rgba(17, 17, 26, 0.05),
          0px 16px 56px rgba(17, 17, 26, 0.05)
        `,
      }}
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <svg
          className="glass-filter"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            inset: 0,
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id={filterId.current} colorInterpolationFilters="sRGB">
              {/* Displacement map image */}
              <feImage
                x="0"
                y="0"
                width="100%"
                height="100%"
                result="map"
                href={generateDisplacementMap(dimensions, config, border)}
              />

              {/* RED channel with strongest displacement */}
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                xChannelSelector="R"
                yChannelSelector="G"
                scale={scale}
                result="dispRed"
              />
              <feColorMatrix
                in="dispRed"
                type="matrix"
                values="1 0 0 0 0
                        0 0 0 0 0
                        0 0 0 0 0
                        0 0 0 1 0"
                result="red"
              />

              {/* GREEN channel (reference / least displaced) */}
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                xChannelSelector="R"
                yChannelSelector="G"
                scale={scale + 10}
                result="dispGreen"
              />
              <feColorMatrix
                in="dispGreen"
                type="matrix"
                values="0 0 0 0 0
                        0 1 0 0 0
                        0 0 0 0 0
                        0 0 0 1 0"
                result="green"
              />

              {/* BLUE channel with medium displacement */}
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                xChannelSelector="R"
                yChannelSelector="G"
                scale={scale + 20}
                result="dispBlue"
              />
              <feColorMatrix
                in="dispBlue"
                type="matrix"
                values="0 0 0 0 0
                        0 0 0 0 0
                        0 0 1 0 0
                        0 0 0 1 0"
                result="blue"
              />

              {/* Blend channels back together */}
              <feBlend in="red" in2="green" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="output" />

              {/* Final blur */}
              <feGaussianBlur in="output" stdDeviation={blur * intensity} />
            </filter>
          </defs>
        </svg>
      )}
      {children}
    </div>
  );
};

// Generate displacement map as data URI
function generateDisplacementMap(
  dimensions: { width: number; height: number },
  config: { radius: number; border: number },
  border: number
): string {
  const { width, height } = dimensions;
  const lightness = 50;
  const alpha = 0.93;
  const blur = 11;

  const svg = `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#000"/>
          <stop offset="100%" stop-color="red"/>
        </linearGradient>
        <linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#000"/>
          <stop offset="100%" stop-color="blue"/>
        </linearGradient>
      </defs>
      <!-- backdrop -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="black"></rect>
      <!-- red linear -->
      <rect x="0" y="0" width="${width}" height="${height}" rx="${config.radius}" fill="url(#red)" />
      <!-- blue linear -->
      <rect x="0" y="0" width="${width}" height="${height}" rx="${config.radius}" fill="url(#blue)" style="mix-blend-mode: difference" />
      <!-- block out distortion -->
      <rect x="${border}" y="${border}" width="${width - border * 2}" height="${height - border * 2}" rx="${config.radius}" fill="hsl(0 0% ${lightness}% / ${alpha})" style="filter:blur(${blur}px)" />
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default GlassEffect;
