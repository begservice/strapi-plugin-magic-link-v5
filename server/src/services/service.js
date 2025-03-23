'use strict';

/**
 * service.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

module.exports = ({ strapi }) => ({
  getWelcomeMessage() {
    return 'Welcome to Magic Link Authentication!';
  },
});
