import { useState, useEffect } from 'react';
import api from './api';

export const DEFAULT_SETTINGS = {
  shopName: 'Shop',
  tagline: 'Xerox, Print & Stationery Store',
  timezone: 'Asia/Kolkata (IST)',
  headerNote: 'Welcome to our Xerox & Print Center',
  footerNote: 'Thank you for visiting! Please come again.',
  billPrefix: 'BILL',
  billCounter: '0'
};

export const SETTINGS_EVENT = 'shop_settings_updated';

// Read from localStorage with fallback to default
export function getStoredSettings() {
  try {
    const raw = localStorage.getItem('shop_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.shopName) {
        document.title = `${parsed.shopName} Management`;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Error reading stored settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

// Fetch from backend API and update localStorage
export async function loadSettingsFromServer() {
  try {
    const res = await api.get('/settings');
    if (res.data) {
      const merged = { ...DEFAULT_SETTINGS, ...res.data };
      localStorage.setItem('shop_settings', JSON.stringify(merged));
      if (merged.shopName) {
        document.title = `${merged.shopName} Management`;
      }
      window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: merged }));
      return merged;
    }
  } catch (e) {
    console.error('Failed to load settings from server, using local storage:', e);
  }
  return getStoredSettings();
}

// Save settings to backend and localStorage, and notify all components
export async function saveSettingsToServer(updates) {
  const current = getStoredSettings();
  const merged = { ...current, ...updates };

  // Update localStorage immediately
  try {
    localStorage.setItem('shop_settings', JSON.stringify(merged));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }

  // Update document title if shopName changed
  if (merged.shopName) {
    document.title = `${merged.shopName} Management`;
  }

  // Dispatch update event immediately so UI reacts instantly across the app
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: merged }));

  // Post to backend API
  try {
    const res = await api.post('/settings', updates);
    if (res.data) {
      const finalSettings = { ...DEFAULT_SETTINGS, ...res.data };
      localStorage.setItem('shop_settings', JSON.stringify(finalSettings));
      window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: finalSettings }));
      return finalSettings;
    }
  } catch (e) {
    console.error('Failed to save settings to server:', e);
  }

  return merged;
}

// React hook for any component to access live reactive settings
export function useStoreSettings() {
  const [settings, setSettings] = useState(getStoredSettings);

  useEffect(() => {
    // Sync with server on initial mount
    loadSettingsFromServer().then(s => {
      if (s) setSettings(s);
    });

    const handleUpdate = (e) => {
      if (e.detail) {
        setSettings(e.detail);
      } else {
        setSettings(getStoredSettings());
      }
    };

    window.addEventListener(SETTINGS_EVENT, handleUpdate);
    return () => window.removeEventListener(SETTINGS_EVENT, handleUpdate);
  }, []);

  return settings;
}

