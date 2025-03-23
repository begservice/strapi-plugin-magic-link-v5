'use strict';

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 */

const magicLinkActions = {
  actions: [
    {
      // Settings
      section: 'plugins',
      displayName: 'Read',
      uid: 'settings.read',
      subCategory: 'Settings',
      pluginName: 'magic-link',
    },
    {
      // Settings Update
      section: 'plugins',
      displayName: 'Edit',
      uid: 'settings.update',
      subCategory: 'Settings',
      pluginName: 'magic-link',
    },
  ],
};

module.exports = async ({ strapi }) => {
  const pluginStore = strapi.store({
    environment: '',
    type: 'plugin',
    name: 'magic-link',
  });
  const settings = await pluginStore.get({ key: 'settings' });

  if (!settings) {
    // Get server URL in Strapi v5 way
    const serverUrl = strapi.config.get('server.url', 'http://localhost:1337');
    
    const value = {
      enabled: true,
      createUserIfNotExists: true,
      expire_period: 3600,
      confirmationUrl: serverUrl,
      from_name: 'Administration Panel',
      from_email: 'no-reply@strapi.io',
      response_email: '',
      token_length: 20,
      stays_valid: false,
      store_login_info: true,
      object: 'Magic Link Login',
      message_html: `<p>Hi!</p>
<p>Please click on the link below to login.</p>
<p><%= URL %>?loginToken=<%= CODE %></p>
<p>Thanks.</p>`,
      message_text: `Hi!
Please click on the link below to login.
<%= URL %>?loginToken=<%= CODE %>
Thanks.`,
      // Additional settings from passwordless-plugin
      max_login_attempts: 3,
      login_path: '/magic-link/login',
      user_creation_strategy: 'email',
      verify_email: false,
      welcome_email: false,
      use_jwt_token: true,
      jwt_token_expires_in: '30d',
      callback_url: serverUrl,
      allow_magic_links_on_public_registration: false,
    };

    await pluginStore.set({ key: 'settings', value });
  } else if (settings && settings.store_login_info === undefined) {
    // If store_login_info is undefined, set it to true
    settings.store_login_info = true;
    await pluginStore.set({ key: 'settings', value: settings });
  }

  await strapi.admin.services.permission.actionProvider.registerMany(
    magicLinkActions.actions
  );

  // JWT-Blacklist-Middleware hinzufügen
  strapi.server.use(async (ctx, next) => {
    // Nur fortfahren, wenn es eine Authentifizierung gibt
    const token = ctx.request.header.authorization;
    if (token && token.startsWith('Bearer ')) {
      try {
        const jwtToken = token.substring(7);
        const { magicLink } = strapi.plugins['magic-link'].services;
        
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
