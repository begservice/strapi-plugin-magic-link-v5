'use strict';

/**
 * Get plugin service (Strapi v5 pattern)
 * @param {string} name - Service name
 * @returns {object} service
 */
const getService = (name) => {
  return strapi.plugin('magic-link').service(name);
};

module.exports = {
  getService,
}; 