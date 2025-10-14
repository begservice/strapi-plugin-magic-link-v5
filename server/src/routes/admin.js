'use strict';

/**
 * Admin routes
 */

module.exports = {
  type: 'admin',
  routes: [
    // Settings
    {
      method: 'GET',
      path: '/settings',
      handler: 'controller.getSettings',
      config: {
        policies: [],
      },
    },
    {
      method: 'PUT',
      path: '/settings',
      handler: 'controller.updateSettings',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/reset-data',
      handler: 'controller.resetData',
      config: {
        policies: [],
      },
    },
    
    // Token Management
    {
      method: 'GET',
      path: '/tokens',
      handler: 'tokens.find',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/security-score',
      handler: 'tokens.getSecurityScore',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/validate-email',
      handler: 'tokens.validateEmail',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/tokens/:id/block',
      handler: 'tokens.block',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/tokens/:id/activate',
      handler: 'tokens.activate',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/tokens/:id/extend',
      handler: 'tokens.extend',
      config: {
        policies: [],
      },
    },
    {
      method: 'DELETE',
      path: '/tokens/:id',
      handler: 'tokens.delete',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/ban-ip',
      handler: 'tokens.banIP',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/banned-ips',
      handler: 'tokens.getBannedIPs',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/unban-ip',
      handler: 'tokens.unbanIP',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/user-by-email',
      handler: 'tokens.findUserByEmail',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/tokens',
      handler: 'tokens.create',
      config: {
        policies: [],
      },
    },

    // JWT Token Management
    {
      method: 'GET',
      path: '/jwt-sessions',
      handler: 'jwt.getSessions',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/revoke-jwt',
      handler: 'jwt.revokeToken',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/unrevoke-jwt',
      handler: 'jwt.unrevokeToken',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/cleanup-sessions',
      handler: 'jwt.cleanupSessions',
      config: {
        policies: [],
      },
    },

    // License Management
    {
      method: 'GET',
      path: '/license/status',
      handler: 'license.getStatus',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/license/create',
      handler: 'license.createAndActivate',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/license/ping',
      handler: 'license.ping',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/license/stats',
      handler: 'license.getStats',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/license/deactivate',
      handler: 'license.deactivate',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/license/store-key',
      handler: 'license.storeKey',
      config: {
        policies: [],
      },
    },
  ],
}; 