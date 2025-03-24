/**
 * Adds plugin prefix to translation keys
 * @param {Object} translations - The translations object
 * @param {string} pluginId - The plugin identifier
 * @returns {Object} Prefixed translations
 */
const prefixPluginTranslations = (translations, pluginId) => {
  if (!pluginId) {
    throw new TypeError("pluginId can't be empty");
  }
  
  return Object.keys(translations).reduce((acc, current) => {
    acc[`${pluginId}.${current}`] = translations[current];
    return acc;
  }, {});
};

export default prefixPluginTranslations; 