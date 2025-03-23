'use strict';

const { INTERNAL_PLUGIN_NAME } = require('./plugin');

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 */

module.exports = ({ strapi }) => {
  // Settings
  strapi.settings = {
    [INTERNAL_PLUGIN_NAME]: {
      enabled: true,
      createNewUsers: false,
      tokenExpiresIn: 3600, // 1 hour
      tokenLength: 64,
      tokenStaysValid: false,
      storeLoginInfo: true,
      defaultRole: null,
      jwtExpiresIn: '30d',
      enableRememberMe: true,
      rememberMeExpiresIn: '365d',
    },
  };

  // Register admin UI permissions
  if (strapi.admin) {
    const actions = [
      {
        section: 'plugins',
        displayName: 'Access Magic Link Dashboard',
        uid: 'dashboard.read',
        pluginName: INTERNAL_PLUGIN_NAME,
      },
      {
        section: 'plugins',
        displayName: 'Access Magic Link Settings',
        uid: 'settings.read',
        pluginName: INTERNAL_PLUGIN_NAME,
      },
    ];

    strapi.admin.services.permission.actionProvider.registerMany(actions);
  }

  // JWT-Blacklist-Middleware hinzufügen
  strapi.server.use(async (ctx, next) => {
    // Nur fortfahren, wenn es eine Authentifizierung gibt
    const token = ctx.request.header.authorization;
    if (token && token.startsWith('Bearer ')) {
      try {
        const jwtToken = token.substring(7);
        const { magicLink } = strapi.plugins[INTERNAL_PLUGIN_NAME].services;
        
        // Prüfen, ob der Token gesperrt ist
        const isBlocked = await magicLink.isJwtTokenBlocked(jwtToken);
        
        if (isBlocked) {
          return ctx.unauthorized('This token has been revoked');
        }
      } catch (error) {
        // Bei Fehlern lieber fortfahren als die Anfrage zu blockieren
        console.error('Error checking JWT token blacklist:', error);
      }
    }
    
    return next();
  });
};
