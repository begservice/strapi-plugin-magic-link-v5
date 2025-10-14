'use strict';

/**
 * License Check Policy
 * Verifies that a valid license exists before allowing API access
 */

module.exports = async (policyContext, config, { strapi }) => {
  try {
    // Get the license guard service
    const licenseGuard = strapi.plugin('magic-link').service('license-guard');
    
    // Get the stored license key
    const pluginStore = strapi.store({ type: 'plugin', name: 'magic-link' });
    const licenseKey = await pluginStore.get({ key: 'licenseKey' });

    // If no license key exists, deny access
    if (!licenseKey) {
      strapi.log.warn('⚠️ API access denied: No license key found');
      return policyContext.unauthorized('No license found. Please activate the plugin first.');
    }

    // Verify the license
    const verification = await licenseGuard.verifyLicense(licenseKey);
    
    if (!verification.valid) {
      strapi.log.warn('⚠️ API access denied: Invalid license');
      return policyContext.unauthorized('Invalid or expired license. Please check your license status.');
    }

    // Get license details
    const license = await licenseGuard.getLicenseByKey(licenseKey);
    
    if (!license) {
      strapi.log.warn('⚠️ API access denied: License not found in database');
      return policyContext.unauthorized('License not found. Please contact support.');
    }

    if (!license.isActive) {
      strapi.log.warn('⚠️ API access denied: License is inactive');
      return policyContext.unauthorized('License is inactive. Please activate your license.');
    }

    if (license.isExpired) {
      strapi.log.warn('⚠️ API access denied: License has expired');
      return policyContext.unauthorized('License has expired. Please renew your license.');
    }

    // License is valid - allow access
    return true;
  } catch (error) {
    strapi.log.error('Error checking license:', error);
    // In case of error, deny access for security
    return policyContext.unauthorized('Error verifying license. Please try again.');
  }
};

