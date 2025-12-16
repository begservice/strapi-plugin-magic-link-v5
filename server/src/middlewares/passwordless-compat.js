'use strict';

/**
 * Passwordless Compatibility Middleware
 * 
 * Redirects /api/passwordless/* requests to /api/magic-link/* when compatibility mode is enabled.
 * This allows seamless migration from strapi-plugin-passwordless.
 * 
 * Supported routes:
 * - POST /api/passwordless/send-link → POST /api/magic-link/send-link
 * - GET /api/passwordless/login → GET /api/magic-link/login
 */

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const { url, method } = ctx.request;
    
    // Only intercept /api/passwordless/* routes
    if (!url.startsWith('/api/passwordless/')) {
      return next();
    }

    // Check if compatibility mode is enabled
    const pluginStore = strapi.store({
      type: 'plugin',
      name: 'magic-link',
    });

    const settings = await pluginStore.get({ key: 'settings' });
    
    if (!settings?.passwordlessCompatibility) {
      // Compatibility mode disabled - return 404
      ctx.status = 404;
      ctx.body = {
        data: null,
        error: {
          status: 404,
          name: 'NotFoundError',
          message: 'Not Found',
          details: {}
        }
      };
      return;
    }

    // Map passwordless routes to magic-link routes
    const routeMap = {
      '/api/passwordless/send-link': '/api/magic-link/send-link',
      '/api/passwordless/login': '/api/magic-link/login',
    };

    // Extract base path (without query string)
    const basePath = url.split('?')[0];
    const queryString = url.includes('?') ? url.substring(url.indexOf('?')) : '';

    if (routeMap[basePath]) {
      // Rewrite the URL to the magic-link endpoint
      const newUrl = routeMap[basePath] + queryString;
      
      strapi.log.debug(`[Magic-Link Compat] Redirecting ${method} ${url} → ${newUrl}`);
      
      // Update request URL
      ctx.request.url = newUrl;
      ctx.url = newUrl;
      ctx.path = routeMap[basePath];
      
      // Continue to next middleware (will now hit magic-link routes)
      return next();
    }

    // Unknown passwordless route - return 404
    ctx.status = 404;
    ctx.body = {
      data: null,
      error: {
        status: 404,
        name: 'NotFoundError',
        message: 'Not Found',
        details: {}
      }
    };
  };
};

