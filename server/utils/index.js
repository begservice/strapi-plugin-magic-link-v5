'use strict';

/**
 * Get plugin service
 * @param {string} name - Service name
 * @returns {object} service
 */
const getService = (name) => {
  return strapi.plugin('magic-link').services[name];
};

module.exports = {
  getService,
}; 