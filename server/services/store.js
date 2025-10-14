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
    const pluginStore = strapi.store({
      type: 'plugin',
      name: 'magic-link',
    });
    
    return pluginStore.get({ key: 'settings' });
  },

  /**
   * Set the settings in the plugin store
   * @param {Object} settings - The settings to store
   * @returns {Object} The stored settings
   */
  async set(settings) {
    const pluginStore = strapi.store({
      type: 'plugin',
      name: 'magic-link',
    });
    
    return pluginStore.set({ key: 'settings', value: settings });
  }
}); 