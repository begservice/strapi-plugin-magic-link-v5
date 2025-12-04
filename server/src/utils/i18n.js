const fs = require('fs');
const path = require('path');

class I18n {
  constructor() {
    this.translations = {};
    this.defaultLocale = 'en';
    this.loadTranslations();
  }

  loadTranslations() {
    // Try multiple possible paths for i18n files
    const possiblePaths = [
      path.join(__dirname, '../i18n'),           // Development: server/src/utils -> server/src/i18n
      path.join(__dirname, 'i18n'),              // Built: dist/server/utils -> dist/server/i18n
      path.join(__dirname, '../../i18n'),        // Alternative: go up two levels
    ];
    
    let localesDir = null;
    for (const tryPath of possiblePaths) {
      if (fs.existsSync(tryPath)) {
        localesDir = tryPath;
        break;
      }
    }
    
    if (!localesDir) {
      console.warn('[WARNING] [Magic-Link i18n] No i18n directory found, using fallback messages');
      // Set default English translations as fallback
      this.translations.en = {
        errors: {
          'plugin.disabled': 'Magic Link plugin is disabled',
          'token.invalid': 'Invalid or expired token',
          'wrong.email': 'Invalid email address',
          'wrong.user': 'User not found',
          'blocked.user': 'User account is blocked',
        }
      };
      return;
    }
    
    try {
      const files = fs.readdirSync(localesDir);
      
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const locale = file.replace('.json', '');
          const filePath = path.join(localesDir, file);
          this.translations[locale] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
      });
      
      console.log(`[SUCCESS] [Magic-Link i18n] Loaded translations for: ${Object.keys(this.translations).join(', ')}`);
    } catch (error) {
      console.error('[ERROR] [Magic-Link i18n] Error loading translations:', error);
    }
  }

  /**
   * Get translated message
   * @param {string} key - Translation key (e.g. 'errors.wrong.email')
   * @param {string} locale - Language code (e.g. 'en', 'de')
   * @param {object} params - Optional parameters for interpolation
   * @returns {string} Translated message
   */
  t(key, locale = null, params = {}) {
    const lang = locale || this.defaultLocale;
    const translation = this.translations[lang];
    
    if (!translation) {
      return key;
    }
    
    // Support nested keys like 'errors.wrong.email'
    const keys = key.split('.');
    let value = translation;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    
    if (typeof value !== 'string') {
      return key;
    }
    
    // Simple parameter interpolation
    let result = value;
    Object.keys(params).forEach(param => {
      result = result.replace(new RegExp(`{${param}}`, 'g'), params[param]);
    });
    
    return result;
  }

  /**
   * Get locale from request context
   * @param {object} ctx - Koa context
   * @returns {string} Locale code
   */
  getLocaleFromContext(ctx) {
    // Try to get locale from query params
    if (ctx.query && ctx.query.locale) {
      return ctx.query.locale;
    }
    
    // Try to get locale from headers
    const acceptLanguage = ctx.request.header['accept-language'];
    if (acceptLanguage) {
      const primaryLang = acceptLanguage.split(',')[0].split('-')[0];
      if (this.translations[primaryLang]) {
        return primaryLang;
      }
    }
    
    // Try to get from user settings if available
    if (ctx.state && ctx.state.user && ctx.state.user.preferedLanguage) {
      return ctx.state.user.preferedLanguage;
    }
    
    return this.defaultLocale;
  }

  /**
   * Send translated error response
   * @param {object} ctx - Koa context
   * @param {string} errorKey - Error key (e.g. 'wrong.email')
   * @param {number} statusCode - HTTP status code
   * @param {object} params - Optional parameters
   */
  sendError(ctx, errorKey, statusCode = 400, params = {}) {
    const locale = this.getLocaleFromContext(ctx);
    const fullKey = errorKey.startsWith('errors.') ? errorKey : `errors.${errorKey}`;
    const message = this.t(fullKey, locale, params);
    
    ctx.status = statusCode;
    ctx.body = {
      error: {
        message,
        key: errorKey,
        status: statusCode
      }
    };
  }

  /**
   * Send translated success response
   * @param {object} ctx - Koa context
   * @param {string} successKey - Success key (e.g. 'token.created')
   * @param {object} data - Response data
   * @param {object} params - Optional parameters
   */
  sendSuccess(ctx, successKey, data = {}, params = {}) {
    const locale = this.getLocaleFromContext(ctx);
    const fullKey = successKey.startsWith('success.') ? successKey : `success.${successKey}`;
    const message = this.t(fullKey, locale, params);
    
    ctx.body = {
      ...data,
      message
    };
  }
}

// Create singleton instance
const i18n = new I18n();

module.exports = i18n;
