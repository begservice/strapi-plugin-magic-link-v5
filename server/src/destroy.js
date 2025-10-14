'use strict';

module.exports = ({ strapi }) => {
  // Cleanup License Guard ping interval
  try {
    const licenseGuardService = strapi.plugin('magic-link')?.service('license-guard');
    if (licenseGuardService) {
      licenseGuardService.cleanup();
      strapi.log.info('✅ License Guard cleanup completed');
    }
  } catch (error) {
    strapi.log.error('❌ Error during License Guard cleanup:', error);
  }
};
