/*
  Project: SubTracker Pro
  Author: N H Padma Priya
  Year: 2025
*/
// Minimal theme wiring for modular structure (progressively migrate full logic)
import { storageKeys, loadJSON, saveJSON } from '../services/storage.js';

export function applyTheme(theme) {
  const body = document.body;
  const toggle = document.getElementById('themeToggle');
  const icon = toggle ? toggle.querySelector('i') : null;
  if (theme === 'dark') {
    body.classList.add('dark-theme');
    if (icon) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    }
  } else {
    body.classList.remove('dark-theme');
    if (icon) {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }
  }
}

export function setupTheme() {
  const globalTheme = localStorage.getItem(storageKeys.globalTheme) || 'light';
  applyTheme(globalTheme);
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(storageKeys.globalTheme, next);
      // If a user is logged in, persist user preference (placeholder read of current user)
      try {
        const users = loadJSON(storageKeys.users, {});
        const currentEmail = window.currentUser && window.currentUser.email;
        if (currentEmail) {
          const prefsKey = storageKeys.prefs(currentEmail);
          const prefs = loadJSON(prefsKey, {});
          prefs.theme = next;
          saveJSON(prefsKey, prefs);
        }
      } catch (_) {}
    });
  }
}
