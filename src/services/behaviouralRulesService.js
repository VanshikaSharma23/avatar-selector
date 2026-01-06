/**
 * Behavioural Rules Service
 * 
 * Centralized service for managing and executing behavioural rules.
 * Handles persistence, state management, and rule execution.
 */

const STORAGE_KEY = 'behavioural_rules_config';

/**
 * Default configuration structure
 */
const DEFAULT_CONFIG = {
  teachingStyle: '',
  languageLevel: '',
  behaviourRules: [],
  responseStructure: '',
  avatarId: null,
  avatarName: null,
};

/**
 * Load configuration from localStorage
 */
export const loadConfig = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all required fields exist
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
      };
    }
  } catch (error) {
    console.error('Error loading behavioural rules config:', error);
  }
  return null;
};

/**
 * Save configuration to localStorage
 */
export const saveConfig = (config) => {
  try {
    const configToSave = {
      teachingStyle: config.teachingStyle || '',
      languageLevel: config.languageLevel || '',
      behaviourRules: config.behaviourRules || [],
      responseStructure: config.responseStructure || '',
      avatarId: config.avatarId || null,
      avatarName: config.avatarName || null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave));
    return true;
  } catch (error) {
    console.error('Error saving behavioural rules config:', error);
    return false;
  }
};

/**
 * Clear saved configuration
 */
export const clearConfig = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing behavioural rules config:', error);
    return false;
  }
};

/**
 * Get current configuration (from storage)
 */
export const getConfig = () => {
  return loadConfig() || DEFAULT_CONFIG;
};


