'use strict';

/**
 * Rate Limiter Service
 * Prevents abuse by limiting token creation requests per IP and email
 */

module.exports = ({ strapi }) => ({
  /**
   * Check if request should be rate limited
   * @param {string} identifier - IP address or email
   * @param {string} type - 'ip' or 'email'
   * @returns {Promise<{allowed: boolean, retryAfter: number}>}
   */
  async checkRateLimit(identifier, type = 'ip') {
    try {
      const pluginStore = strapi.store({
        type: 'plugin',
        name: 'magic-link',
      });
      
      // Get settings for rate limit configuration
      const settings = await pluginStore.get({ key: 'settings' });
      
      // Check if rate limiting is enabled
      if (settings?.rate_limit_enabled === false) {
        return { allowed: true, retryAfter: 0 };
      }
      
      const maxAttempts = settings?.rate_limit_max_attempts || 5;
      const windowMinutes = settings?.rate_limit_window_minutes || 15;
      
      // Get current rate limit data
      const rateLimitData = (await pluginStore.get({ key: 'rate_limits' })) || { limits: {} };
      
      const key = `${type}_${identifier}`;
      const now = Date.now();
      const windowMs = windowMinutes * 60 * 1000;
      
      // Get or create limit entry
      let limitEntry = rateLimitData.limits[key];
      
      if (!limitEntry) {
        // First request
        limitEntry = {
          count: 1,
          firstRequest: now,
          lastRequest: now,
        };
        rateLimitData.limits[key] = limitEntry;
        await pluginStore.set({ key: 'rate_limits', value: rateLimitData });
        
        return { allowed: true, retryAfter: 0 };
      }
      
      // Check if window has expired
      const timeSinceFirst = now - limitEntry.firstRequest;
      
      if (timeSinceFirst > windowMs) {
        // Window expired, reset counter
        limitEntry = {
          count: 1,
          firstRequest: now,
          lastRequest: now,
        };
        rateLimitData.limits[key] = limitEntry;
        await pluginStore.set({ key: 'rate_limits', value: rateLimitData });
        
        return { allowed: true, retryAfter: 0 };
      }
      
      // Check if limit exceeded
      if (limitEntry.count >= maxAttempts) {
        const timeRemaining = windowMs - timeSinceFirst;
        const retryAfterSeconds = Math.ceil(timeRemaining / 1000);
        
        strapi.log.warn(`⚠️ Rate limit exceeded for ${type}: ${identifier} (${limitEntry.count}/${maxAttempts} requests)`);
        
        return {
          allowed: false,
          retryAfter: retryAfterSeconds,
        };
      }
      
      // Increment counter
      limitEntry.count++;
      limitEntry.lastRequest = now;
      rateLimitData.limits[key] = limitEntry;
      await pluginStore.set({ key: 'rate_limits', value: rateLimitData });
      
      return { allowed: true, retryAfter: 0 };
    } catch (error) {
      strapi.log.error('Error checking rate limit:', error);
      // On error, allow request (fail open for availability)
      return { allowed: true, retryAfter: 0 };
    }
  },
  
  /**
   * Clean up expired rate limit entries
   */
  async cleanupExpired() {
    try {
      const pluginStore = strapi.store({
        type: 'plugin',
        name: 'magic-link',
      });
      
      const settings = await pluginStore.get({ key: 'settings' });
      const windowMinutes = settings?.rate_limit_window_minutes || 15;
      const windowMs = windowMinutes * 60 * 1000;
      
      const rateLimitData = (await pluginStore.get({ key: 'rate_limits' })) || { limits: {} };
      const now = Date.now();
      
      let cleaned = 0;
      
      // Remove expired entries
      Object.keys(rateLimitData.limits).forEach(key => {
        const entry = rateLimitData.limits[key];
        const timeSinceFirst = now - entry.firstRequest;
        
        if (timeSinceFirst > windowMs) {
          delete rateLimitData.limits[key];
          cleaned++;
        }
      });
      
      if (cleaned > 0) {
        await pluginStore.set({ key: 'rate_limits', value: rateLimitData });
        strapi.log.info(`🧹 Cleaned up ${cleaned} expired rate limit entries`);
      }
      
      return { cleaned };
    } catch (error) {
      strapi.log.error('Error cleaning up rate limits:', error);
      return { cleaned: 0 };
    }
  },
  
  /**
   * Get rate limit stats
   */
  async getStats() {
    try {
      const pluginStore = strapi.store({
        type: 'plugin',
        name: 'magic-link',
      });
      
      const rateLimitData = (await pluginStore.get({ key: 'rate_limits' })) || { limits: {} };
      const settings = await pluginStore.get({ key: 'settings' });
      const maxAttempts = settings?.rate_limit_max_attempts || 5;
      const windowMinutes = settings?.rate_limit_window_minutes || 15;
      
      const stats = {
        totalEntries: Object.keys(rateLimitData.limits).length,
        maxAttempts,
        windowMinutes,
        ipLimits: 0,
        emailLimits: 0,
        blocked: 0,
      };
      
      Object.keys(rateLimitData.limits).forEach(key => {
        const entry = rateLimitData.limits[key];
        
        if (key.startsWith('ip_')) {
          stats.ipLimits++;
        } else if (key.startsWith('email_')) {
          stats.emailLimits++;
        }
        
        if (entry.count >= maxAttempts) {
          stats.blocked++;
        }
      });
      
      return stats;
    } catch (error) {
      strapi.log.error('Error getting rate limit stats:', error);
      return null;
    }
  },
});

