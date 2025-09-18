/*
  Project: SubTracker Pro
  Author: N H Padma Priya
  Year: 2025
*/
// High-level initializer that attaches event listeners and imports feature modules.
import { setupTheme } from './theme.js';
import { setupShare } from './share.js';

export function initializeApp() {
  setupTheme();
  setupShare();
}
