/*
  Project: SubTracker Pro
  Author: N H Padma Priya
  Year: 2025
*/
// Entry point. Wire DOMContentLoaded and import app code progressively.
import './styles.css';
import { initializeApp } from './modules/app.js';

window.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});
