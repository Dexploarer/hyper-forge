/**
 * Performance Monitoring Utilities
 * Track and measure performance metrics in development
 */

interface PerformanceMark {
  name: string;
  startTime: number;
  duration?: number;
}

class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map();
  private enabled: boolean;

  constructor() {
    this.enabled = import.meta.env.DEV === "true";
  }

  /**
   * Mark the start of a performance measurement
   */
  mark(name: string): void {
    if (!this.enabled) return;

    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark(`${name}-start`);
    }

    this.marks.set(name, {
      name,
      startTime: performance.now(),
    });
  }

  /**
   * Measure the duration since the last mark
   */
  measure(name: string): number | null {
    if (!this.enabled) return null;

    const mark = this.marks.get(name);
    if (!mark) {
      console.warn(`Performance mark "${name}" not found`);
      return null;
    }

    const duration = performance.now() - mark.startTime;

    if (typeof performance !== "undefined" && performance.measure) {
      performance.measure(name, `${name}-start`);
      const measure = performance.getEntriesByName(name)[0];
      if (measure) {
        console.log(`⚡ ${name}: ${measure.duration.toFixed(2)}ms`);
      }
    } else {
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
    }

    this.marks.delete(name);
    return duration;
  }

  /**
   * Measure async function execution time
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.mark(name);
    try {
      const result = await fn();
      this.measure(name);
      return result;
    } catch (error) {
      this.measure(name);
      throw error;
    }
  }

  /**
   * Measure sync function execution time
   */
  measureSync<T>(name: string, fn: () => T): T {
    this.mark(name);
    try {
      const result = fn();
      this.measure(name);
      return result;
    } catch (error) {
      this.measure(name);
      throw error;
    }
  }

  /**
   * Get all performance entries
   */
  getEntries(): PerformanceEntry[] {
    if (typeof performance !== "undefined" && performance.getEntriesByType) {
      return performance.getEntriesByType("measure");
    }
    return [];
  }

  /**
   * Clear all performance marks and measures
   */
  clear(): void {
    if (
      typeof performance !== "undefined" &&
      performance.clearMarks &&
      performance.clearMeasures
    ) {
      performance.clearMarks();
      performance.clearMeasures();
    }
    this.marks.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for measuring component render time
 */
export function usePerformanceMeasure(componentName: string) {
  if (import.meta.env.DEV !== "true") {
    return { markRender: () => {}, measureRender: () => {} };
  }

  const markRender = () => {
    performanceMonitor.mark(`${componentName}-render`);
  };

  const measureRender = () => {
    performanceMonitor.measure(`${componentName}-render`);
  };

  return { markRender, measureRender };
}

/**
 * Measure React component render performance
 */
export function measureComponentRender<T>(
  componentName: string,
  renderFn: () => T,
): T {
  return performanceMonitor.measureSync(`${componentName}-render`, renderFn);
}
