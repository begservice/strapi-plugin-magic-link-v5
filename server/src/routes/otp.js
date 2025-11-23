'use strict';

/**
 * OTP Routes - Content API Routes for OTP functionality
 * These routes are accessible from the frontend
 */

module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'POST',
      path: '/otp/send',
      handler: 'otp.send',
      config: {
        auth: false, // Public endpoint
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/otp/verify',
      handler: 'otp.verify',
      config: {
        auth: false, // Public endpoint
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/otp/resend',
      handler: 'otp.resend',
      config: {
        auth: false, // Public endpoint
        policies: [],
        middlewares: [],
      },
    },
  ],
};
