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
      // Rate Limiting Settings
      rate_limit_enabled: true,
      rate_limit_max_attempts: 5,
      rate_limit_window_minutes: 15,
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
        
        // Sicherer Service-Zugriff mit Null-Check
        const magicLinkPlugin = strapi.plugin('magic-link');
        if (!magicLinkPlugin || !magicLinkPlugin.service) {
          // Plugin noch nicht vollständig geladen, überspringe Check
          return next();
        }
        
        const magicLink = magicLinkPlugin.service('magic-link');
        if (!magicLink || !magicLink.isJwtTokenBlocked) {
          // Service noch nicht vollständig geladen, überspringe Check
          return next();
        }
        
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

  // Initialize Rate Limiter Cleanup Job
  const rateLimiter = strapi.plugin('magic-link').service('rate-limiter');
  
  // Initial cleanup
  setTimeout(() => {
    rateLimiter.cleanupExpired();
  }, 5000);
  
  // Cleanup every 30 minutes
  setInterval(() => {
    rateLimiter.cleanupExpired();
  }, 30 * 60 * 1000);

  // Initialize License Guard
  try {
    const licenseGuardService = strapi.plugin('magic-link').service('license-guard');
    
    // Wait a bit for all services to be ready
    setTimeout(async () => {
      const licenseStatus = await licenseGuardService.initialize();
      
      if (!licenseStatus.valid && licenseStatus.demo) {
        strapi.log.warn('╔════════════════════════════════════════════════════════════════╗');
        strapi.log.warn('║  ⚠️  MAGIC LINK PLUGIN RUNNING IN DEMO MODE                   ║');
        strapi.log.warn('║                                                                ║');
        strapi.log.warn('║  To activate, create a license via Admin UI:                  ║');
        strapi.log.warn('║  Go to Settings → Magic Link → License                        ║');
        strapi.log.warn('╚════════════════════════════════════════════════════════════════╝');
      } else if (licenseStatus.valid) {
        // Get license key from store if data is not available (grace period)
        const pluginStore = strapi.store({
          type: 'plugin',
          name: 'magic-link',
        });
        const storedKey = await pluginStore.get({ key: 'licenseKey' });
        
        strapi.log.info('╔════════════════════════════════════════════════════════════════╗');
        strapi.log.info('║  ✅ MAGIC LINK PLUGIN LICENSE ACTIVE                           ║');
        strapi.log.info('║                                                                ║');
        
        if (licenseStatus.data) {
          // Full license data available (online validation)
          strapi.log.info(`║  License: ${licenseStatus.data.licenseKey}                    ║`);
          strapi.log.info(`║  User: ${licenseStatus.data.firstName} ${licenseStatus.data.lastName}`.padEnd(66) + '║');
          strapi.log.info(`║  Email: ${licenseStatus.data.email}`.padEnd(66) + '║');
        } else if (storedKey) {
          // Grace period / offline mode
          strapi.log.info(`║  License: ${storedKey} (Offline Mode)                         ║`);
          strapi.log.info(`║  Status: Grace Period Active                                  ║`);
        }
        
        strapi.log.info('║                                                                ║');
        strapi.log.info('║  🔄 Auto-pinging every 15 minutes                              ║');
        strapi.log.info('╚════════════════════════════════════════════════════════════════╝');
      }
    }, 3000); // Wait 3 seconds for API to be ready
  } catch (error) {
    strapi.log.error('❌ Error initializing License Guard:', error);
  }
};
