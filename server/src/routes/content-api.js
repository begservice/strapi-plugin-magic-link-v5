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
        auth: false
      }
    },
    {
      method: 'POST',
      path: '/send-link',
      handler: 'auth.sendLink',
      config: {
        auth: false
      }
    }
  ],
};
