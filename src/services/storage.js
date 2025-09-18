/*
  Project: SubTracker Pro
  Author: N H Padma Priya
  Year: 2025
*/
// Centralized storage access and keys
export const storageKeys = {
  users: 'subtracker_users',
  prefs: (email) => `subtracker_prefs_${email}`,
  subscriptions: (email) => `subtracker_subscriptions_${email}`,
  budgets: (email) => `subtracker_budgets_${email}`,
  paymentMethods: (email) => `subtracker_payment_methods_${email}`,
  customCategories: (email) => `subtracker_custom_categories_${email}`,
  globalTheme: 'subtracker_global_theme',
};

export function loadJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load JSON for', key, e);
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Failed to save JSON for', key, e);
    return false;
  }
}
