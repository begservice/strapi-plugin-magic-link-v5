'use strict';

/**
 * Get plugin service
 * @param {string} name - Service name
 * @returns {object} service
 */
const getService = (name) => {
  return strapi.plugin('magic-link').services[name];
};

/**
 * Get a service from the plugin services
 */
const getPluginService = (name) => {
  return strapi.plugin('strapi-plugin-magic-link-v5').services[name];
};

module.exports = {
  getService,
  getPluginService,
}; 