'use strict';

/**
 * Content API routes
 */

module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/login',
      handler: 'auth.login',
      config: {
        auth: false,
        policies: ['plugin::magic-link.license-check']
      }
    },
    {
      method: 'POST',
      path: '/send-link',
      handler: 'auth.sendLink',
      config: {
        auth: false,
        policies: ['plugin::magic-link.license-check']
      }
    }
  ],
};
