'use strict';

const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const emailHelpers = require('../utils/email-helpers');
const cryptoUtils = require('../utils/crypto');

/**
 * OTP Service
 * Handles One-Time Password generation, validation, and delivery
 * Using Document Service API (strapi.documents) for Strapi v5
 * 
 * Security:
 * - OTP codes are hashed before storage (SHA256 + pepper)
 * - TOTP secrets are encrypted at rest (AES-256-GCM)
 * - Backup codes are hashed (SHA256)
 */
module.exports = ({ strapi }) => {
  // Store the strapi instance reference from module initialization
  const strapiInstance = strapi;

  // Helper to get strapi instance - prefers stored instance (more reliable in bundled plugins)
  const getStrapi = () => {
    // Primary: Use stored instance from module initialization (reliable in bundled plugins)
    if (strapiInstance) {
      return strapiInstance;
    }
    // Fallback: Try global.strapi
    if (global.strapi) {
      return global.strapi;
    }
    throw new Error('Strapi instance not available');
  };

  // Helper for safe logging (works in intervals/timeouts)
  const log = {
    info: (...args) => {
      try {
        getStrapi().log.info(...args);
      } catch (e) {
        console.log('[OTP Info]', ...args);
      }
    },
    error: (...args) => {
      try {
        getStrapi().log.error(...args);
      } catch (e) {
        console.error('[OTP Error]', ...args);
      }
    },
    warn: (...args) => {
      try {
        getStrapi().log.warn(...args);
      } catch (e) {
        console.warn('[OTP Warn]', ...args);
      }
    },
    debug: (...args) => {
      try {
        getStrapi().log.debug(...args);
      } catch (e) {
        console.debug('[OTP Debug]', ...args);
      }
    }
  };

  return {
  /**
   * Generate a random OTP code
   * @param {number} length - Length of the OTP code (default: 6)
   * @returns {string} The generated OTP code
   */
  generateCode(length = 6) {
    const digits = '0123456789';
    let code = '';
    
    // Use crypto for secure random generation
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      code += digits[randomBytes[i] % digits.length];
    }
    
    return code;
  },

  /**
   * Create and store an OTP code
   * @param {string} email - User email
   * @param {string} type - OTP type ('email', 'sms', 'totp')
   * @param {Object} options - Additional options
   * @returns {Object} The created OTP code entry
   */
  async createOTP(email, type = 'email', options = {}) {
    const {
      magicLinkToken = null,
      phoneNumber = null,
      expirySeconds = 300, // 5 minutes default
      codeLength = 6
    } = options;

    // Generate OTP code
    const code = this.generateCode(codeLength);
    
    // Hash the OTP code before storage for security
    const hashedCode = cryptoUtils.hashOTP(code);

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + (expirySeconds * 1000));

    // Create OTP entry using Document Service API
    // Store HASHED code, not plaintext!
    const activeStrapi = getStrapi();
    const otpEntry = await activeStrapi.documents('plugin::magic-link.otp-code').create({
      data: {
        code: hashedCode, // Store hashed, not plaintext
        email: email.toLowerCase(),
        type,
        used: false,
        attempts: 0,
        expiresAt,
        magicLinkToken,
        phoneNumber,
        metadata: {
          createdAt: new Date().toISOString(),
          ipAddress: options.ipAddress || null,
          userAgent: options.userAgent || null
        }
      }
    });

    log.info(`OTP code created for ${email} (type: ${type}, expires in ${expirySeconds}s)`);
    
    // Return entry with plaintext code for sending (not stored in DB)
    return { ...otpEntry, code };
  },

  /**
   * Verify an OTP code
   * @param {string} email - User email
   * @param {string} code - OTP code to verify
   * @param {string} type - OTP type
   * @returns {Object} Verification result
   */
  async verifyOTP(email, code, type = 'email') {
    const activeStrapi = getStrapi();
    const pluginStore = activeStrapi.store({
      type: 'plugin',
      name: 'magic-link',
    });
    const settings = await pluginStore.get({ key: 'settings' }) || {};
    const maxAttempts = settings.otp_max_attempts || 3;

    try {
      // Hash the provided code for comparison
      const hashedCode = cryptoUtils.hashOTP(code);
      
      // Find the OTP code using Document Service API
      // We search by hashed code now
      const otpEntries = await activeStrapi.documents('plugin::magic-link.otp-code').findMany({
        filters: {
          email: email.toLowerCase(),
          type,
          used: false
        },
        sort: [{ createdAt: 'desc' }],
        limit: 10 // Get recent entries to find matching hash
      });

      if (!otpEntries || otpEntries.length === 0) {
        return {
          valid: false,
          error: 'invalid_code',
          message: 'Invalid or expired OTP code'
        };
      }

      // Find entry with matching hash (timing-safe comparison)
      const otpEntry = otpEntries.find(entry => 
        cryptoUtils.verifyOTP(code, entry.code)
      );
      
      if (!otpEntry) {
        return {
          valid: false,
          error: 'invalid_code',
          message: 'Invalid or expired OTP code'
        };
      }

      // Check if expired
      const now = new Date();
      const expiresAt = new Date(otpEntry.expiresAt);
      
      if (now > expiresAt) {
        // Mark as used to prevent reuse
        await activeStrapi.documents('plugin::magic-link.otp-code').update({
          documentId: otpEntry.documentId,
          data: { used: true }
        });
        
        return {
          valid: false,
          error: 'expired',
          message: 'OTP code has expired'
        };
      }

      // Check attempts
      if (otpEntry.attempts >= maxAttempts) {
        // Mark as used after max attempts
        await activeStrapi.documents('plugin::magic-link.otp-code').update({
          documentId: otpEntry.documentId,
          data: { used: true }
        });
        
        return {
          valid: false,
          error: 'max_attempts',
          message: 'Maximum verification attempts exceeded'
        };
      }

      // Code is valid!
      // Mark as used
      await activeStrapi.documents('plugin::magic-link.otp-code').update({
        documentId: otpEntry.documentId,
        data: { 
          used: true,
          attempts: otpEntry.attempts + 1
        }
      });

      log.info(`OTP verified successfully for ${email}`);

      return {
        valid: true,
        otpEntry
      };
    } catch (error) {
      log.error('Error verifying OTP:', error);
      return {
        valid: false,
        error: 'server_error',
        message: 'Error verifying OTP code'
      };
    }
  },

  /**
   * Send OTP via email
   * @param {string} email - Recipient email
   * @param {string} code - OTP code
   * @param {Object} options - Email options
   */
  async sendOTPEmail(email, code, options = {}) {
    const activeStrapi = getStrapi();
    const pluginStore = activeStrapi.store({
      type: 'plugin',
      name: 'magic-link',
    });
    const settings = await pluginStore.get({ key: 'settings' }) || {};

    const {
      subject = 'Your One-Time Password',
      expiryMinutes = 5
    } = options;

    // Create HTML email content
    const htmlContent = `
      <div style="text-align: center; padding: 20px;">
        <h1 style="color: #4F46E5; margin-bottom: 20px;">Your Verification Code</h1>
        <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
          Enter this code to complete your login:
        </p>
        <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); 
                    color: white; 
                    font-size: 32px; 
                    font-weight: bold; 
                    letter-spacing: 8px; 
                    padding: 20px 40px; 
                    border-radius: 12px; 
                    display: inline-block;
                    margin-bottom: 30px;
                    font-family: 'Courier New', monospace;">
          ${code}
        </div>
        <p style="font-size: 14px; color: #6B7280; margin-top: 20px;">
          This code will expire in <strong>${expiryMinutes} minutes</strong>.
        </p>
        <p style="font-size: 14px; color: #6B7280; margin-top: 10px;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    `;

    // Create plain text version
    const textContent = `
Your Verification Code

Enter this code to complete your login:

${code}

This code will expire in ${expiryMinutes} minutes.

If you didn't request this code, you can safely ignore this email.
    `.trim();

    // Wrap in email template
    const html = emailHelpers.wrapEmailTemplate(htmlContent, {
      title: subject,
      preheader: `Your verification code: ${code}`
    });

    // Get headers
    const headers = emailHelpers.getEmailHeaders({
      replyTo: settings.response_email
    });

    // Check if MagicMail should be used
    if (settings.use_magic_mail && activeStrapi.plugin('magic-mail')) {
      try {
        await activeStrapi.plugin('magic-mail').service('email-router').sendEmail({
          to: email,
          from: settings.from_email ? `${settings.from_name} <${settings.from_email}>` : undefined,
          replyTo: settings.response_email || undefined,
          subject,
          html,
          text: textContent,
          headers
        });
        
        log.info(`OTP email sent via MagicMail to ${email}`);
        return true;
      } catch (error) {
        log.error('MagicMail send failed, falling back to default provider:', error);
      }
    }

    // Send via default email provider
    await activeStrapi.plugin('email').service('email').send({
      to: email,
      from: settings.from_email ? `${settings.from_name} <${settings.from_email}>` : undefined,
      replyTo: settings.response_email || undefined,
      subject,
      html,
      text: textContent,
      headers
    });

    log.info(`OTP email sent to ${email}`);
    return true;
  },

  /**
   * Send OTP via SMS (requires SMS provider like Twilio)
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} code - OTP code
   * @returns {boolean} Success status
   */
  async sendOTPSMS(phoneNumber, code) {
    const activeStrapi = getStrapi();
    const pluginStore = activeStrapi.store({
      type: 'plugin',
      name: 'magic-link',
    });
    const settings = await pluginStore.get({ key: 'settings' }) || {};

    // TODO: Implement SMS sending with Twilio/Vonage
    // For now, log that this is a premium feature
    log.info(`SMS OTP to ${phoneNumber}: ${code} (SMS provider not yet implemented)`);
    
    return true;
  },

  /**
   * Clean up expired OTP codes
   * Uses strapiInstance from module closure for reliability in bundled plugins
   */
  async cleanupExpiredCodes() {
    try {
      // Use strapiInstance directly (more reliable than getStrapi() in intervals)
      if (!strapiInstance) {
        // Silently skip if strapi not available yet
        return;
      }
      
      const now = new Date();
      
      const expiredCodes = await strapiInstance.documents('plugin::magic-link.otp-code').findMany({
        filters: {
          expiresAt: { $lt: now }
        }
      });

      for (const code of expiredCodes) {
        await strapiInstance.documents('plugin::magic-link.otp-code').delete({
          documentId: code.documentId
        });
      }

      if (expiredCodes.length > 0) {
        strapiInstance.log.info(`[CLEANUP] Cleaned up ${expiredCodes.length} expired OTP codes`);
      }
    } catch (error) {
      // Silent fail with debug log - don't spam error logs
      if (strapiInstance && strapiInstance.log) {
        strapiInstance.log.debug('[CLEANUP] OTP cleanup skipped:', error.message);
      }
    }
  },

  /**
   * Get OTP settings
   */
  async getOTPSettings() {
    const activeStrapi = getStrapi();
    const pluginStore = activeStrapi.store({
      type: 'plugin',
      name: 'magic-link',
    });
    const settings = await pluginStore.get({ key: 'settings' }) || {};

    return {
      enabled: settings.otp_enabled || false,
      type: settings.otp_type || 'email',
      length: settings.otp_length || 6,
      expiry: settings.otp_expiry || 300,
      maxAttempts: settings.otp_max_attempts || 3,
      resendCooldown: settings.otp_resend_cooldown || 60
    };
  },

  /**
   * Setup TOTP for a user
   * @param {number} userId - User ID
   * @param {string} email - User email
   * @returns {Object} TOTP setup data with QR code
   */
  async setupTOTP(userId, email) {
    const activeStrapi = getStrapi();
    try {
      const pluginStore = activeStrapi.store({
        type: 'plugin',
        name: 'magic-link',
      });
      const settings = await pluginStore.get({ key: 'settings' }) || {};
      
      const issuer = settings.totp_issuer || 'Magic Link';
      
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${issuer} (${email})`,
        issuer: issuer,
        length: 32
      });

      // Encrypt the TOTP secret before storage
      const encryptedSecret = cryptoUtils.encrypt(secret.base32);

      // Check if user already has TOTP config
      const existing = await activeStrapi.documents('plugin::magic-link.totp-config').findMany({
        filters: { userId },
        limit: 1
      });

      if (existing && existing.length > 0) {
        // Update existing config
        await activeStrapi.documents('plugin::magic-link.totp-config').update({
          documentId: existing[0].documentId,
          data: {
            secret: encryptedSecret, // Store encrypted
            enabled: false, // Not enabled until first verification
            email
          }
        });
      } else {
        // Create new config
        await activeStrapi.documents('plugin::magic-link.totp-config').create({
          data: {
            userId,
            email,
            secret: encryptedSecret, // Store encrypted
            enabled: false
          }
        });
      }

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

      log.info(`TOTP setup initiated for user ${userId} (${email})`);

      return {
        secret: secret.base32,
        qrCode: qrCodeDataURL,
        otpauthUrl: secret.otpauth_url,
        manualEntryKey: secret.base32
      };
    } catch (error) {
      log.error('Error setting up TOTP:', error);
      throw error;
    }
  },

  /**
   * Verify TOTP code and enable TOTP if valid
   * @param {number} userId - User ID
   * @param {string} token - 6-digit TOTP code
   * @param {boolean} enableAfterVerify - Enable TOTP after successful verification
   * @returns {Object} Verification result
   */
  async verifyTOTP(userId, token, enableAfterVerify = true) {
    const activeStrapi = getStrapi();
    try {
      const configs = await activeStrapi.documents('plugin::magic-link.totp-config').findMany({
        filters: { userId },
        limit: 1
      });

      if (!configs || configs.length === 0) {
        return {
          valid: false,
          error: 'totp_not_setup',
          message: 'TOTP is not set up for this user'
        };
      }

      const config = configs[0];
      
      // Decrypt the secret before verification
      const decryptedSecret = cryptoUtils.decrypt(config.secret);

      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: decryptedSecret,
        encoding: 'base32',
        token: token,
        window: 1 // Allow 1 step before/after for time sync issues
      });

      if (!verified) {
        return {
          valid: false,
          error: 'invalid_token',
          message: 'Invalid TOTP code'
        };
      }

      // Update config
      const updateData = {
        lastUsed: new Date()
      };

      if (enableAfterVerify && !config.enabled) {
        updateData.enabled = true;
        log.info(`TOTP enabled for user ${userId}`);
      }

      await activeStrapi.documents('plugin::magic-link.totp-config').update({
        documentId: config.documentId,
        data: updateData
      });

      return {
        valid: true,
        enabled: updateData.enabled || config.enabled
      };
    } catch (error) {
      log.error('Error verifying TOTP:', error);
      return {
        valid: false,
        error: 'server_error',
        message: 'Error verifying TOTP code'
      };
    }
  },

  /**
   * Disable TOTP for a user
   * @param {number} userId - User ID
   * @returns {boolean} Success status
   */
  async disableTOTP(userId) {
    const activeStrapi = getStrapi();
    try {
      const configs = await activeStrapi.documents('plugin::magic-link.totp-config').findMany({
        filters: { userId },
        limit: 1
      });

      if (!configs || configs.length === 0) {
        return false;
      }

      await activeStrapi.documents('plugin::magic-link.totp-config').delete({
        documentId: configs[0].documentId
      });
      
      log.info(`TOTP disabled for user ${userId}`);
      return true;
    } catch (error) {
      log.error('Error disabling TOTP:', error);
      return false;
    }
  },

  /**
   * Check if TOTP is enabled for a user
   * @param {number} userId - User ID
   * @returns {Object} TOTP status
   */
  async getTOTPStatus(userId) {
    const activeStrapi = getStrapi();
    try {
      const configs = await activeStrapi.documents('plugin::magic-link.totp-config').findMany({
        filters: { userId },
        limit: 1
      });

      if (!configs || configs.length === 0) {
        return {
          enabled: false,
          configured: false
        };
      }

      return {
        enabled: configs[0].enabled,
        configured: true,
        lastUsed: configs[0].lastUsed
      };
    } catch (error) {
      log.error('Error getting TOTP status:', error);
      return {
        enabled: false,
        configured: false
      };
    }
  },

  /**
   * Generate backup codes for TOTP (Enterprise feature)
   * @param {number} userId - User ID
   * @returns {Array} Backup codes
   */
  async generateBackupCodes(userId) {
    const activeStrapi = getStrapi();
    try {
      const configs = await activeStrapi.documents('plugin::magic-link.totp-config').findMany({
        filters: { userId },
        limit: 1
      });

      if (!configs || configs.length === 0) {
        throw new Error('TOTP not configured for this user');
      }

      // Generate 10 backup codes (8 characters each)
      const backupCodes = [];
      for (let i = 0; i < 10; i++) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        backupCodes.push(code);
      }

      // Store hashed backup codes
      const hashedCodes = backupCodes.map(code => 
        crypto.createHash('sha256').update(code).digest('hex')
      );

      await activeStrapi.documents('plugin::magic-link.totp-config').update({
        documentId: configs[0].documentId,
        data: {
          backupCodes: hashedCodes
        }
      });

      log.info(`Backup codes generated for user ${userId}`);

      return backupCodes;
    } catch (error) {
      log.error('Error generating backup codes:', error);
      throw error;
    }
  }
};
};
