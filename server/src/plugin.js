'use strict';

/**
 * Plugin name mapping helper
 */

// Der Name des Plugins ist jetzt überall einheitlich
const PLUGIN_NAME = 'strapi-plugin-magic-link-v5';

// Export für die Kompatibilität mit bestehendem Code
module.exports = {
  INTERNAL_PLUGIN_NAME: PLUGIN_NAME,
  PACKAGE_NAME: PLUGIN_NAME,
  
  // Helper-Methode, um den Pluginnamen basierend auf dem Kontext zu erhalten
  getPluginName: () => PLUGIN_NAME
}; 