'use strict';

/**
 * Hilfsfunktionen für das Plugin
 */

/**
 * Holt einen Service vom Plugin
 */
function getService(name) {
  return strapi.plugin('strapi-plugin-magic-link-v5').services[name];
}

module.exports = {
  getService,
}; 