import { PLUGIN_ID } from '../pluginId';

/**
 * Fügt das Plugin-Präfix zum Übersetzungsschlüssel hinzu
 * @param {string} id - Übersetzungsschlüssel
 * @returns {string} - Vollständiger Übersetzungsschlüssel mit Plugin-Präfix
 */
const getTrad = (id) => {
  // Wenn der Schlüssel bereits das Plugin-Präfix enthält, füge es nicht nochmal hinzu
  if (id.startsWith(`${PLUGIN_ID}.`)) {
    return id;
  }
  
  return `${PLUGIN_ID}.${id}`;
};

export default getTrad; 