/**
 * Test Setup - DOM Environment
 *
 * Sets up happy-dom for React component testing in Bun.
 * Manual setup required for Bun 1.3.1 (environment config not supported).
 */

import { Window } from "happy-dom";

// Create happy-dom window
const window = new Window({
  url: "http://localhost:3000",
  width: 1920,
  height: 1080,
});

// Install DOM globals
global.window = window as any;
global.document = window.document as any;
global.navigator = window.navigator as any;
global.HTMLElement = window.HTMLElement as any;
global.Element = window.Element as any;
global.Node = window.Node as any;
