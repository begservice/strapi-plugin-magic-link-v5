/**
 * License Guard Service
 * Handles license creation, verification, and ping tracking
 */

const crypto = require('crypto');
const os = require('os');

// Fixed License Server URL - DO NOT MODIFY IN PRODUCTION
// For development/testing, you can override with LICENSE_SERVER_URL environment variable
const LICENSE_SERVER_URL = process.env.NODE_ENV === 'development' 
  ? (process.env.LICENSE_SERVER_URL || 'http://localhost:1337')
  : 'https://magicapi.fitlex.me';

module.exports = ({ strapi }) => ({
  /**
   * Get license server URL (hardcoded for security)
   */
  getLicenseServerUrl() {
    return LICENSE_SERVER_URL;
  },

  /**
   * Generate a unique device ID based on machine identifiers
   */
  generateDeviceId() {
    try {
      const networkInterfaces = os.networkInterfaces();
      const macAddresses = [];
      
      // Collect MAC addresses
      Object.values(networkInterfaces).forEach(interfaces => {
        interfaces.forEach(iface => {
          if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
            macAddresses.push(iface.mac);
          }
        });
      });
      
      // Create hash from MAC addresses and hostname
      const identifier = `${macAddresses.join('-')}-${os.hostname()}`;
      return crypto.createHash('sha256').update(identifier).digest('hex').substring(0, 32);
    } catch (error) {
      strapi.log.error('Error generating device ID:', error);
      // Fallback to random ID
      return crypto.randomBytes(16).digest('hex');
    }
  },

  /**
   * Get device name
   */
  getDeviceName() {
    try {
      return os.hostname() || 'Unknown Device';
    } catch (error) {
      return 'Unknown Device';
    }
  },

  /**
   * Get server IP address
   */
  getIpAddress() {
    try {
      const networkInterfaces = os.networkInterfaces();
      for (const name of Object.keys(networkInterfaces)) {
        for (const iface of networkInterfaces[name]) {
          // Skip internal and non-IPv4 addresses
          if (iface.family === 'IPv4' && !iface.internal) {
            return iface.address;
          }
        }
      }
      return '127.0.0.1';
    } catch (error) {
      return '127.0.0.1';
    }
  },

  /**
   * Get user agent (server context)
   */
  getUserAgent() {
    return `Strapi/${strapi.config.info.strapi} Node/${process.version} ${os.platform()}/${os.release()}`;
  },

  /**
   * Create a license
   */
  async createLicense({ email, firstName, lastName }) {
    try {
      const deviceId = this.generateDeviceId();
      const deviceName = this.getDeviceName();
      const ipAddress = this.getIpAddress();
      const userAgent = this.getUserAgent();

      const licenseServerUrl = this.getLicenseServerUrl();
      const response = await fetch(`${licenseServerUrl}/api/licenses/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          deviceName,
          deviceId,
          ipAddress,
          userAgent,
        }),
      });

      const data = await response.json();

      if (data.success) {
        strapi.log.info('✅ License created successfully:', data.data.licenseKey);
        return data.data;
      } else {
        strapi.log.error('❌ License creation failed:', data);
        return null;
      }
    } catch (error) {
      strapi.log.error('❌ Error creating license:', error);
      return null;
    }
  },

  /**
   * Verify a license (with grace period support)
   */
  async verifyLicense(licenseKey, allowGracePeriod = false) {
    try {
      // Create timeout for fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const licenseServerUrl = this.getLicenseServerUrl();
      const response = await fetch(`${licenseServerUrl}/api/licenses/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseKey }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.success) {
        const isValid = data.data.isActive && !data.data.isExpired;
        const statusInfo = data.data.isExpired ? 'EXPIRED' : (data.data.isActive ? 'ACTIVE' : 'INACTIVE');
        strapi.log.info(`✅ License verified online: ${statusInfo} (Key: ${licenseKey?.substring(0, 8)}...)`);
        
        // Store last validation timestamp
        if (isValid) {
          const pluginStore = strapi.store({ 
            type: 'plugin', 
            name: 'magic-link' 
          });
          await pluginStore.set({ key: 'lastValidated', value: new Date().toISOString() });
        }
        
        return {
          valid: isValid,
          data: data.data,
        };
      } else {
        strapi.log.warn(`⚠️ License verification failed: ${data.message || 'Unknown error'} (Key: ${licenseKey?.substring(0, 8)}...)`);
        return { valid: false, data: null };
      }
    } catch (error) {
      // If grace period is allowed, accept the key anyway
      if (allowGracePeriod) {
        strapi.log.warn(`⚠️ Cannot verify license online: ${error.message} (Key: ${licenseKey?.substring(0, 8)}...)`);
        strapi.log.info(`🕐 Grace period active - accepting stored license key`);
        return { valid: true, data: null, gracePeriod: true };
      }
      
      strapi.log.error(`❌ Error verifying license: ${error.message} (Key: ${licenseKey?.substring(0, 8)}...)`);
      return { valid: false, data: null };
    }
  },

  /**
   * Ping a license (lightweight check)
   */
  async pingLicense(licenseKey) {
    try {
      const licenseServerUrl = this.getLicenseServerUrl();
      const response = await fetch(`${licenseServerUrl}/api/licenses/ping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseKey }),
      });

      const data = await response.json();

      if (data.success) {
        strapi.log.debug(`📡 License ping successful: ${data.data?.isActive ? 'ACTIVE' : 'INACTIVE'} (Key: ${licenseKey?.substring(0, 8)}...)`);
        return data.data;
      } else {
        strapi.log.warn(`⚠️ License ping failed: ${data.message || 'Unknown error'} (Key: ${licenseKey?.substring(0, 8)}...)`);
        return null;
      }
    } catch (error) {
      strapi.log.error(`❌ Error pinging license: ${error.message} (Key: ${licenseKey?.substring(0, 8)}...)`);
      return null;
    }
  },

  /**
   * Upgrade a license
   */
  async upgradeLicense(licenseId, features) {
    try {
      const licenseServerUrl = this.getLicenseServerUrl();
      const response = await fetch(`${licenseServerUrl}/api/licenses/${licenseId}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(features),
      });

      const data = await response.json();

      if (data.success) {
        strapi.log.info('✅ License upgraded:', licenseId);
        return data.data;
      } else {
        strapi.log.error('❌ License upgrade failed:', licenseId);
        return null;
      }
    } catch (error) {
      strapi.log.error('❌ Error upgrading license:', error);
      return null;
    }
  },

  /**
   * Get license by key
   */
  async getLicenseByKey(licenseKey) {
    try {
      const licenseServerUrl = this.getLicenseServerUrl();
      const response = await fetch(`${licenseServerUrl}/api/licenses/key/${licenseKey}`);
      const data = await response.json();

      if (data.success) {
        return data.data;
      }
      return null;
    } catch (error) {
      strapi.log.error('❌ Error fetching license by key:', error);
      return null;
    }
  },

  /**
   * Get licenses by email
   */
  async getLicensesByEmail(email) {
    try {
      const licenseServerUrl = this.getLicenseServerUrl();
      const response = await fetch(`${licenseServerUrl}/api/licenses/email/${encodeURIComponent(email)}`);
      const data = await response.json();

      if (data.success) {
        return data.data;
      }
      return [];
    } catch (error) {
      strapi.log.error('❌ Error fetching licenses by email:', error);
      return [];
    }
  },

  /**
   * Get online statistics
   */
  async getOnlineStats() {
    try {
      const licenseServerUrl = this.getLicenseServerUrl();
      const response = await fetch(`${licenseServerUrl}/api/licenses/stats/online`);
      const data = await response.json();

      if (data.success) {
        return data.data;
      }
      return null;
    } catch (error) {
      strapi.log.error('❌ Error fetching online stats:', error);
      return null;
    }
  },

  /**
   * Start periodic pinging for a license
   */
  startPinging(licenseKey, intervalMinutes = 15) {
    const intervalMs = intervalMinutes * 60 * 1000;
    
    // Immediate ping
    this.pingLicense(licenseKey);
    
    // Setup interval
    const pingInterval = setInterval(async () => {
      await this.pingLicense(licenseKey);
    }, intervalMs);

    strapi.log.info(`📡 Started pinging license every ${intervalMinutes} minutes`);
    
    return pingInterval;
  },

  /**
   * Initialize license guard
   * Checks for existing license or prompts for creation
   */
  async initialize() {
    try {
      strapi.log.info('🔐 Initializing License Guard...');

      // Check if license key exists in plugin store
      const pluginStore = strapi.store({ 
        type: 'plugin', 
        name: 'magic-link' 
      });
      let licenseKey = await pluginStore.get({ key: 'licenseKey' });

      // Check last validation timestamp
      const lastValidated = await pluginStore.get({ key: 'lastValidated' });
      const now = new Date();
      const gracePeriodHours = 24;
      let withinGracePeriod = false;
      
      if (lastValidated) {
        const lastValidatedDate = new Date(lastValidated);
        const hoursSinceValidation = (now - lastValidatedDate) / (1000 * 60 * 60);
        withinGracePeriod = hoursSinceValidation < gracePeriodHours;
      }

      strapi.log.info('──────────────────────────────────────────────────────────');
      strapi.log.info(`📦 Plugin Store Check:`);
      if (licenseKey) {
        strapi.log.info(`   ✅ License Key found: ${licenseKey}`);
        strapi.log.info(`   🔑 Key (short): ${licenseKey.substring(0, 8)}...`);
        if (lastValidated) {
          const lastValidatedDate = new Date(lastValidated);
          const hoursAgo = Math.floor((now - lastValidatedDate) / (1000 * 60 * 60));
          strapi.log.info(`   🕐 Last validated: ${hoursAgo}h ago (Grace: ${withinGracePeriod ? 'ACTIVE' : 'EXPIRED'})`);
        } else {
          strapi.log.info(`   🕐 Last validated: Never (Grace: ACTIVE for first ${gracePeriodHours}h)`);
        }
      } else {
        strapi.log.info(`   ❌ No license key stored`);
      }
      strapi.log.info('──────────────────────────────────────────────────────────');

      if (licenseKey) {
        strapi.log.info('📄 Verifying stored license key...');
        
        // Always allow grace period during initialization (server might not be ready yet)
        const verification = await this.verifyLicense(licenseKey, true);
        
        if (verification.valid) {
          if (verification.gracePeriod) {
            strapi.log.info('✅ License accepted (offline mode / grace period)');
          } else {
            strapi.log.info('✅ License is valid and active');
          }
          
          // Start pinging
          const pingInterval = this.startPinging(licenseKey, 15);
          
          // Store interval for cleanup
          strapi.licenseGuard = {
            licenseKey,
            pingInterval,
            data: verification.data,
          };
          
          return { valid: true, data: verification.data };
        } else {
          strapi.log.warn('⚠️ Stored license is invalid or expired');
          // Only clear if we got a definitive rejection (not a network error during grace period)
          if (!withinGracePeriod) {
            await pluginStore.delete({ key: 'licenseKey' });
            await pluginStore.delete({ key: 'lastValidated' });
          }
        }
      }

      strapi.log.warn('⚠️ No valid license found. Plugin will run in demo mode.');
      
      return { valid: false, demo: true };
    } catch (error) {
      strapi.log.error('❌ Error initializing license guard:', error);
      return { valid: false, error: error.message };
    }
  },

  /**
   * Store license key after creation
   */
  async storeLicenseKey(licenseKey) {
    try {
      strapi.log.info(`🔐 Storing license key: ${licenseKey}`);
      const pluginStore = strapi.store({ 
        type: 'plugin', 
        name: 'magic-link' 
      });
      
      await pluginStore.set({ key: 'licenseKey', value: licenseKey });
      // Store initial validation timestamp
      await pluginStore.set({ key: 'lastValidated', value: new Date().toISOString() });
      
      // Verify it was stored
      const stored = await pluginStore.get({ key: 'licenseKey' });
      if (stored === licenseKey) {
        strapi.log.info('✅ License key stored and verified successfully');
        return true;
      } else {
        strapi.log.error('❌ License key storage verification failed');
        return false;
      }
    } catch (error) {
      strapi.log.error('❌ Error storing license key:', error);
      return false;
    }
  },


  /**
   * Cleanup on plugin destroy
   */
  cleanup() {
    if (strapi.licenseGuard && strapi.licenseGuard.pingInterval) {
      clearInterval(strapi.licenseGuard.pingInterval);
      strapi.log.info('🛑 License pinging stopped');
    }
  },
});

