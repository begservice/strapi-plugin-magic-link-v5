'use strict';

const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const emailHelpers = require('../utils/email-helpers');

/**
 * OTP Service
 * Handles One-Time Password generation, validation, and delivery
 */
module.exports = ({ strapi }) => ({
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

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + (expirySeconds * 1000));

    // Create OTP entry using Entity Service
    const otpEntry = await strapi.entityService.create('plugin::magic-link.otp-code', {
      data: {
        code,
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

    strapi.log.info(`OTP code created for ${email} (type: ${type}, expires in ${expirySeconds}s)`);
    
    return otpEntry;
  },

  /**
   * Verify an OTP code
   * @param {string} email - User email
   * @param {string} code - OTP code to verify
   * @param {string} type - OTP type
   * @returns {Object} Verification result
   */
  async verifyOTP(email, code, type = 'email') {
    const pluginStore = strapi.store({
      type: 'plugin',
      name: 'magic-link',
    });
    const settings = await pluginStore.get({ key: 'settings' }) || {};
    const maxAttempts = settings.otp_max_attempts || 3;

    try {
      // Find the OTP code
      const otpEntries = await strapi.entityService.findMany('plugin::magic-link.otp-code', {
        filters: {
          email: email.toLowerCase(),
          code,
          type,
          used: false
        },
        sort: { createdAt: 'desc' },
        limit: 1
      });

      if (!otpEntries || otpEntries.length === 0) {
        return {
          valid: false,
          error: 'invalid_code',
          message: 'Invalid or expired OTP code'
        };
      }

      const otpEntry = otpEntries[0];

      // Check if expired
      const now = new Date();
      const expiresAt = new Date(otpEntry.expiresAt);
      
      if (now > expiresAt) {
        // Mark as used to prevent reuse
        await strapi.entityService.update('plugin::magic-link.otp-code', otpEntry.id, {
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
        await strapi.entityService.update('plugin::magic-link.otp-code', otpEntry.id, {
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
      await strapi.entityService.update('plugin::magic-link.otp-code', otpEntry.id, {
        data: { 
          used: true,
          attempts: otpEntry.attempts + 1
        }
      });

      strapi.log.info(`OTP verified successfully for ${email}`);

      return {
        valid: true,
        otpEntry
      };
    } catch (error) {
      strapi.log.error('Error verifying OTP:', error);
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
    const pluginStore = strapi.store({
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
        <h1 style="color: #4F46E5; margin-bottom: 20px;">🔐 Your Verification Code</h1>
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
    if (settings.use_magic_mail && strapi.plugin('magic-mail')) {
      try {
        await strapi.plugin('magic-mail').service('email-router').sendEmail({
          to: email,
          from: settings.from_email ? `${settings.from_name} <${settings.from_email}>` : undefined,
          replyTo: settings.response_email || undefined,
          subject,
          html,
          text: textContent,
          headers
        });
        
        strapi.log.info(`OTP email sent via MagicMail to ${email}`);
        return true;
      } catch (error) {
        strapi.log.error('MagicMail send failed, falling back to default provider:', error);
      }
    }

    // Send via default email provider
    await strapi.plugin('email').service('email').send({
      to: email,
      from: settings.from_email ? `${settings.from_name} <${settings.from_email}>` : undefined,
      replyTo: settings.response_email || undefined,
      subject,
      html,
      text: textContent,
      headers
    });

    strapi.log.info(`OTP email sent to ${email}`);
    return true;
  },

  /**
   * Send OTP via SMS (requires SMS provider like Twilio)
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} code - OTP code
   * @returns {boolean} Success status
   */
  async sendOTPSMS(phoneNumber, code) {
    const pluginStore = strapi.store({
      type: 'plugin',
      name: 'magic-link',
    });
    const settings = await pluginStore.get({ key: 'settings' }) || {};

    // TODO: Implement SMS sending with Twilio/Vonage
    // For now, log that this is a premium feature
    strapi.log.info(`SMS OTP to ${phoneNumber}: ${code} (SMS provider not yet implemented)`);
    
    return true;
  },

  /**
   * Clean up expired OTP codes
   */
  async cleanupExpiredCodes() {
    const now = new Date();
    
    try {
      // Use global strapi to avoid context loss in setInterval
      if (!global.strapi) {
        throw new Error('Strapi instance not available');
      }
      
      const expiredCodes = await global.strapi.entityService.findMany('plugin::magic-link.otp-code', {
        filters: {
          expiresAt: { $lt: now }
        }
      });

      for (const code of expiredCodes) {
        await global.strapi.entityService.delete('plugin::magic-link.otp-code', code.id);
      }

      if (expiredCodes.length > 0) {
        global.strapi.log.info(`Cleaned up ${expiredCodes.length} expired OTP codes`);
      }
    } catch (error) {
      if (global.strapi && global.strapi.log) {
        global.strapi.log.error('Error cleaning up expired OTP codes:', error);
      } else {
        console.error('Error cleaning up expired OTP codes:', error);
      }
    }
  },

  /**
   * Get OTP settings
   */
  async getOTPSettings() {
    const pluginStore = strapi.store({
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
    try {
      const pluginStore = strapi.store({
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

      // Check if user already has TOTP config
      const existing = await strapi.entityService.findMany('plugin::magic-link.totp-config', {
        filters: { userId },
        limit: 1
      });

      if (existing && existing.length > 0) {
        // Update existing config
        await strapi.entityService.update('plugin::magic-link.totp-config', existing[0].id, {
          data: {
            secret: secret.base32,
            enabled: false, // Not enabled until first verification
            email
          }
        });
      } else {
        // Create new config
        await strapi.entityService.create('plugin::magic-link.totp-config', {
          data: {
            userId,
            email,
            secret: secret.base32,
            enabled: false
          }
        });
      }

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

      strapi.log.info(`TOTP setup initiated for user ${userId} (${email})`);

      return {
        secret: secret.base32,
        qrCode: qrCodeDataURL,
        otpauthUrl: secret.otpauth_url,
        manualEntryKey: secret.base32
      };
    } catch (error) {
      strapi.log.error('Error setting up TOTP:', error);
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
    try {
      const configs = await strapi.entityService.findMany('plugin::magic-link.totp-config', {
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

      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: config.secret,
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
        strapi.log.info(`TOTP enabled for user ${userId}`);
      }

      await strapi.entityService.update('plugin::magic-link.totp-config', config.id, {
        data: updateData
      });

      return {
        valid: true,
        enabled: updateData.enabled || config.enabled
      };
    } catch (error) {
      strapi.log.error('Error verifying TOTP:', error);
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
    try {
      const configs = await strapi.entityService.findMany('plugin::magic-link.totp-config', {
        filters: { userId },
        limit: 1
      });

      if (!configs || configs.length === 0) {
        return false;
      }

      await strapi.entityService.delete('plugin::magic-link.totp-config', configs[0].id);
      
      strapi.log.info(`TOTP disabled for user ${userId}`);
      return true;
    } catch (error) {
      strapi.log.error('Error disabling TOTP:', error);
      return false;
    }
  },

  /**
   * Check if TOTP is enabled for a user
   * @param {number} userId - User ID
   * @returns {Object} TOTP status
   */
  async getTOTPStatus(userId) {
    try {
      const configs = await strapi.entityService.findMany('plugin::magic-link.totp-config', {
        filters: { userId },
        fields: ['enabled', 'lastUsed'],
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
      strapi.log.error('Error getting TOTP status:', error);
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
    try {
      const configs = await strapi.entityService.findMany('plugin::magic-link.totp-config', {
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

      await strapi.entityService.update('plugin::magic-link.totp-config', configs[0].id, {
        data: {
          backupCodes: hashedCodes
        }
      });

      strapi.log.info(`Backup codes generated for user ${userId}`);

      return backupCodes;
    } catch (error) {
      strapi.log.error('Error generating backup codes:', error);
      throw error;
    }
  }
});
