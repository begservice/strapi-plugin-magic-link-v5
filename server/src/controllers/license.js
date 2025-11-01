'use strict';

/**
 * License Controller für Magic Link Plugin
 * Verwaltet Lizenzen direkt aus dem Admin-Panel
 */

module.exports = {
  /**
   * Get current license status
   */
  async getStatus(ctx) {
    try {
      const licenseGuard = strapi.plugin('magic-link').service('license-guard');
      const pluginStore = strapi.store({ 
        type: 'plugin', 
        name: 'magic-link' 
      });
      const licenseKey = await pluginStore.get({ key: 'licenseKey' });

      if (!licenseKey) {
        return ctx.send({
          success: false,
          demo: true,
          valid: false,
          message: 'No license found. Running in demo mode.',
        });
      }

      const verification = await licenseGuard.verifyLicense(licenseKey);
      const license = await licenseGuard.getLicenseByKey(licenseKey);

      return ctx.send({
        success: true,
        valid: verification.valid,
        demo: false,
        data: {
          licenseKey,
          email: license?.email || null,
          firstName: license?.firstName || null,
          lastName: license?.lastName || null,
          isActive: license?.isActive || false,
          isExpired: license?.isExpired || false,
          isOnline: license?.isOnline || false,
          expiresAt: license?.expiresAt,
          lastPingAt: license?.lastPingAt,
          deviceName: license?.deviceName,
          deviceId: license?.deviceId,
          ipAddress: license?.ipAddress,
          features: {
            premium: license?.featurePremium || false,
            advanced: license?.featureAdvanced || false,
            enterprise: license?.featureEnterprise || false,
            custom: license?.featureCustom || false,
          },
          maxDevices: license?.maxDevices || 1,
          currentDevices: license?.currentDevices || 0,
        },
      });
    } catch (error) {
      strapi.log.error('Error getting license status:', error);
      return ctx.badRequest('Error getting license status');
    }
  },

  /**
   * Auto-create license with logged-in admin user data
   */
  async autoCreate(ctx) {
    try {
      // Get the logged-in admin user
      const adminUser = ctx.state.user;
      
      if (!adminUser) {
        return ctx.unauthorized('No admin user logged in');
      }

      const licenseGuard = strapi.plugin('magic-link').service('license-guard');
      
      // Use admin user data for license creation
      const license = await licenseGuard.createLicense({ 
        email: adminUser.email,
        firstName: adminUser.firstname || 'Admin',
        lastName: adminUser.lastname || 'User',
      });

      if (!license) {
        return ctx.badRequest('Failed to create license');
      }

      // Store the license key
      await licenseGuard.storeLicenseKey(license.licenseKey);

      // Start pinging
      const pingInterval = licenseGuard.startPinging(license.licenseKey, 15);

      // Update global license guard
      strapi.licenseGuard = {
        licenseKey: license.licenseKey,
        pingInterval,
        data: license,
      };

      return ctx.send({
        success: true,
        message: 'License automatically created and activated',
        data: license,
      });
    } catch (error) {
      strapi.log.error('Error auto-creating license:', error);
      return ctx.badRequest('Error creating license');
    }
  },

  /**
   * Create and activate a new license
   */
  async createAndActivate(ctx) {
    try {
      const { email, firstName, lastName } = ctx.request.body;

      if (!email || !firstName || !lastName) {
        return ctx.badRequest('Email, firstName, and lastName are required');
      }

      const licenseGuard = strapi.plugin('magic-link').service('license-guard');
      const license = await licenseGuard.createLicense({ email, firstName, lastName });

      if (!license) {
        return ctx.badRequest('Failed to create license');
      }

      // Store the license key
      await licenseGuard.storeLicenseKey(license.licenseKey);

      // Start pinging
      const pingInterval = licenseGuard.startPinging(license.licenseKey, 15);

      // Update global license guard
      strapi.licenseGuard = {
        licenseKey: license.licenseKey,
        pingInterval,
        data: license,
      };

      return ctx.send({
        success: true,
        message: 'License created and activated successfully',
        data: license,
      });
    } catch (error) {
      strapi.log.error('Error creating license:', error);
      return ctx.badRequest('Error creating license');
    }
  },

  /**
   * Manually ping the current license
   */
  async ping(ctx) {
    try {
      const pluginStore = strapi.store({ 
        type: 'plugin', 
        name: 'magic-link' 
      });
      const licenseKey = await pluginStore.get({ key: 'licenseKey' });

      if (!licenseKey) {
        return ctx.badRequest('No license key found');
      }

      const licenseGuard = strapi.plugin('magic-link').service('license-guard');
      const pingResult = await licenseGuard.pingLicense(licenseKey);

      if (!pingResult) {
        return ctx.badRequest('Ping failed');
      }

      return ctx.send({
        success: true,
        message: 'License pinged successfully',
        data: pingResult,
      });
    } catch (error) {
      strapi.log.error('Error pinging license:', error);
      return ctx.badRequest('Error pinging license');
    }
  },
   /**
   * Store and validate an existing license key
   */
  async storeKey(ctx) {
    try {
      const { licenseKey, email } = ctx.request.body;

      if (!licenseKey || !licenseKey.trim()) {
        return ctx.badRequest('License key is required');
      }

      if (!email || !email.trim()) {
        return ctx.badRequest('Email address is required');
      }

      const trimmedKey = licenseKey.trim();
      const trimmedEmail = email.trim().toLowerCase();
      const licenseGuard = strapi.plugin('magic-link').service('license-guard');

      // Verify the license key first
      const verification = await licenseGuard.verifyLicense(trimmedKey);

      if (!verification.valid) {
        strapi.log.warn(`⚠️ Invalid license key attempted: ${trimmedKey.substring(0, 8)}...`);
        return ctx.badRequest('Invalid or expired license key');
      }

      // Get license details to verify email
      const license = await licenseGuard.getLicenseByKey(trimmedKey);
      
      if (!license) {
        strapi.log.warn(`⚠️ License not found in database: ${trimmedKey.substring(0, 8)}...`);
        return ctx.badRequest('License not found');
      }

      // Verify email matches
      if (license.email.toLowerCase() !== trimmedEmail) {
        strapi.log.warn(`⚠️ Email mismatch for license key: ${trimmedKey.substring(0, 8)}... (Attempted: ${trimmedEmail})`);
        return ctx.badRequest('Email address does not match this license key');
      }

      // Store the license key
      await licenseGuard.storeLicenseKey(trimmedKey);

      // Start pinging
      const pingInterval = licenseGuard.startPinging(trimmedKey, 15);

      // Update global license guard
      strapi.licenseGuard = {
        licenseKey: trimmedKey,
        pingInterval,
        data: verification.data,
      };

      strapi.log.info(`✅ Existing license key validated and stored: ${trimmedKey.substring(0, 8)}... (Email: ${trimmedEmail})`);

      return ctx.send({
        success: true,
        message: 'License key validated and activated successfully',
        data: verification.data,
      });
    } catch (error) {
      strapi.log.error('Error storing license key:', error);
      return ctx.badRequest('Error validating license key');
    }
  },
};

