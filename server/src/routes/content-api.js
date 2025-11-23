'use strict';

/**
 * Content API routes
 */

module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/login',
      handler: 'auth.login',
      config: {
        auth: false,
        policies: ['plugin::magic-link.license-check']
      }
    },
    {
      method: 'POST',
      path: '/send-link',
      handler: 'auth.sendLink',
      config: {
        auth: false,
        policies: ['plugin::magic-link.license-check']
      }
    },
    // OTP Routes
    {
      method: 'POST',
      path: '/otp/send',
      handler: 'otp.send',
      config: {
        auth: false,
        policies: ['plugin::magic-link.license-check']
      }
    },
    {
      method: 'POST',
      path: '/otp/verify',
      handler: 'otp.verify',
      config: {
        auth: false,
        policies: ['plugin::magic-link.license-check']
      }
    },
    {
      method: 'POST',
      path: '/otp/resend',
      handler: 'otp.resend',
      config: {
        auth: false,
        policies: ['plugin::magic-link.license-check']
      }
    },
    // MFA Routes
    {
      method: 'POST',
      path: '/verify-mfa-totp',
      handler: 'auth.verifyMFATOTP',
      config: {
        auth: false,
        policies: ['plugin::magic-link.license-check']
      }
    },
    {
      method: 'POST',
      path: '/login-totp',
      handler: 'auth.loginWithTOTP',
      config: {
        auth: false,
        policies: ['plugin::magic-link.license-check']
      }
    }
  ],
};
