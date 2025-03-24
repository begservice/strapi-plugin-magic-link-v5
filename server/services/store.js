'use strict';

/**
 * Store service for the magic-link plugin
 */
module.exports = ({ strapi }) => ({
  /**
   * Get the settings from the plugin store
   * @returns {Object} The plugin settings
   */
  async get() {
    const { name } = strapi.plugin('strapi-plugin-magic-link-v5') || {};
    const pluginStore = strapi.store({
      environment: '',
      type: 'plugin',
      name: 'strapi-plugin-magic-link-v5',
    });
    
    return pluginStore.get({ key: 'settings' });
  },

  /**
   * Set the settings in the plugin store
   * @param {Object} settings - The settings to store
   * @returns {Object} The stored settings
   */
  async set(settings) {
    const { name } = strapi.plugin('strapi-plugin-magic-link-v5') || {};
    const pluginStore = strapi.store({
      environment: '',
      type: 'plugin',
      name: 'strapi-plugin-magic-link-v5',
    });
    
    return pluginStore.set({ key: 'settings', value: settings });
  }
}); 