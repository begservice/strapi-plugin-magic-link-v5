'use strict';

/**
 * Policy to check if passwordless compatibility mode is enabled
 * 
 * This policy blocks requests to /api/passwordless/* routes
 * unless the compatibility mode is explicitly enabled in settings.
 */

module.exports = async (policyContext, config, { strapi }) => {
  const pluginStore = strapi.store({
    type: 'plugin',
    name: 'magic-link',
  });

  const settings = await pluginStore.get({ key: 'settings' });
  
  // Check if passwordless compatibility mode is enabled
  if (!settings?.passwordlessCompatibility) {
    strapi.log.warn('[Magic-Link] Passwordless compatibility route accessed but mode is disabled');
    
    // Return 404 to make it look like the route doesn't exist
    policyContext.response.status = 404;
    policyContext.response.body = {
      error: {
        status: 404,
        name: 'NotFoundError',
        message: 'Not Found',
        details: {}
      }
    };
    return false;
  }

  return true;
};

