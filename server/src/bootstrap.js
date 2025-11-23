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
  let settings = await pluginStore.get({ key: 'settings' });

  if (!settings) {
    // Get server URL in Strapi v5 way
    const serverUrl = strapi.config.get('server.url', 'http://localhost:1337');
    
    const value = {
      enabled: true,
      createUserIfNotExists: true,
      expire_period: 3600,
      confirmationUrl: serverUrl,
      from_name: 'Administration Panel',
      from_email: '', // Empty by default - will use Strapi email config
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
      // OTP Settings (Premium Feature)
      otp_enabled: false,
      otp_type: 'email',
      otp_length: 6,
      otp_expiry: 300,
      otp_max_attempts: 3,
      otp_resend_cooldown: 60,
      // SMS Provider Settings (Advanced Feature)
      sms_provider: null,
      sms_api_key: '',
      sms_api_secret: '',
      sms_from_number: '',
      // TOTP Settings (Advanced Feature)
      totp_issuer: 'Magic Link',
      totp_algorithm: 'SHA1',
      totp_digits: 6,
      totp_period: 30,
      // MFA Settings (Premium/Advanced Feature)
      mfa_mode: 'disabled', // 'disabled', 'optional', 'required'
      mfa_require_totp: false, // Require TOTP after Magic Link (2FA)
      totp_as_primary_auth: false, // Allow login with Email + TOTP only (Advanced)
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
  
  // Initial cleanup - wait longer for DB to be ready
  setTimeout(() => {
    try {
      rateLimiter.cleanupExpired();
    } catch (error) {
      // Silently ignore on first cleanup if DB not ready yet
      strapi.log.debug('Rate limit cleanup skipped - DB not ready');
    }
  }, 10000);
  
  // Cleanup every 30 minutes
  setInterval(() => {
    try {
      rateLimiter.cleanupExpired();
    } catch (error) {
      strapi.log.debug('Rate limit cleanup failed:', error.message);
    }
  }, 30 * 60 * 1000);

  // Initialize OTP Cleanup Job
  // Note: Get service reference dynamically to preserve strapi context
  
  // Initial cleanup for OTP codes
  setTimeout(() => {
    try {
      const otpService = strapi.plugin('magic-link').service('otp');
      otpService.cleanupExpiredCodes();
    } catch (error) {
      strapi.log.debug('OTP cleanup skipped - DB not ready');
    }
  }, 10000);
  
  // Cleanup expired OTP codes every 5 minutes
  setInterval(() => {
    try {
      const otpService = strapi.plugin('magic-link').service('otp');
      otpService.cleanupExpiredCodes();
    } catch (error) {
      strapi.log.error('OTP cleanup failed:', error.message);
    }
  }, 5 * 60 * 1000);

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

  // 🔄 Auto-Migration: Update old 'magic-link' provider to 'local'
  // This ensures users can login with both Magic-Link AND Email/Password
  try {
    setTimeout(async () => {
      const usersToUpdate = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { provider: 'magic-link' },
        fields: ['id', 'email'],
      });

      if (usersToUpdate && usersToUpdate.length > 0) {
        strapi.log.info('🔄 [Magic-Link Migration] Found %d user(s) with old provider "magic-link"', usersToUpdate.length);
        
        // Update all users in bulk (using Query Engine for bulk operation)
        await strapi.db.query('plugin::users-permissions.user').updateMany({
          where: { provider: 'magic-link' },
          data: { provider: 'local' },
        });

        strapi.log.info('✅ [Magic-Link Migration] Updated %d user(s) to provider "local"', usersToUpdate.length);
        strapi.log.info('   Users can now login with both Magic-Link AND Email/Password! 🎉');
      } else {
        strapi.log.info('✅ [Magic-Link Migration] All users already using provider "local" - no migration needed');
      }
    }, 5000); // Wait 5 seconds to ensure DB is ready
  } catch (error) {
    strapi.log.error('❌ [Magic-Link Migration] Error updating providers:', error);
  }
};
