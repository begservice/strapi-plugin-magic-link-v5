'use strict';

/**
 * WhatsApp Service using Baileys
 * 
 * Provides WhatsApp messaging functionality for Magic Link delivery.
 * Uses @whiskeysockets/baileys for WhatsApp Web API integration.
 * 
 * Features:
 * - Session persistence (no re-scan needed after first setup)
 * - QR code generation for pairing
 * - Message sending to phone numbers
 * - Connection status monitoring
 * - Automatic delegation to Magic-Mail if installed (shared WhatsApp session)
 */

const path = require('path');
const fs = require('fs');

// Baileys imports (lazy loaded to avoid issues if not installed)
let baileys = null;

/**
 * Check if Magic-Mail plugin is installed and has WhatsApp service
 * @param {object} strapi - Strapi instance
 * @returns {object|null} Magic-Mail WhatsApp service or null
 */
const getMagicMailWhatsApp = (strapi) => {
  try {
    const magicMail = strapi.plugin('magic-mail');
    if (magicMail) {
      const service = magicMail.service('whatsapp');
      if (service && typeof service.getStatus === 'function') {
        return service;
      }
    }
  } catch (e) {
    // Magic-Mail not installed or no WhatsApp service
  }
  return null;
};

/**
 * Lazy load Baileys library
 * @returns {Promise<boolean>} True if Baileys is available
 */
const loadBaileys = async () => {
  if (!baileys) {
    try {
      // Use require for CommonJS compatibility
      baileys = require('@whiskeysockets/baileys');
      // Debug logs only shown when NODE_ENV !== 'production' or DEBUG is set
      if (process.env.DEBUG) {
        console.log('[Magic-Link WhatsApp] Baileys loaded successfully');
      }
      return true;
    } catch (error) {
      // This warning is important - shows when WhatsApp features are disabled
      console.warn('[Magic-Link WhatsApp] Baileys not installed. WhatsApp features disabled.');
      return false;
    }
  }
  return true;
};

module.exports = ({ strapi }) => {
  // WhatsApp connection state
  let sock = null;
  let qrCode = null;
  let connectionStatus = 'disconnected'; // disconnected, connecting, connected, qr_pending
  let lastError = null;
  let eventListeners = [];
  let wasConnectedBefore = false; // Track if we had a successful connection
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 3;

  /**
   * Check if WhatsApp debug logging is enabled
   * @returns {Promise<boolean>} True if debug is enabled
   */
  const isDebugEnabled = async () => {
    try {
      const pluginStore = strapi.store({ type: 'plugin', name: 'magic-link' });
      const settings = await pluginStore.get({ key: 'settings' });
      return settings?.whatsapp_debug === true;
    } catch {
      return false;
    }
  };

  /**
   * Log debug message only if whatsapp_debug is enabled
   * @param {string} message - Message to log
   */
  const debugLog = async (message) => {
    if (await isDebugEnabled()) {
      strapi.log.info(message);
    }
  };

  // Get auth folder path
  const getAuthPath = () => {
    const strapiRoot = strapi.dirs?.app?.root || process.cwd();
    return path.join(strapiRoot, '.whatsapp-auth');
  };

  // Emit event to listeners
  const emit = (event, data) => {
    eventListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (e) {
        console.error('[Magic-Link WhatsApp] Event listener error:', e);
      }
    });
  };

  // Service reference for reconnect callback
  const service = {
    /**
     * Check if Magic-Mail WhatsApp is available and should be used
     * @returns {object|null} Magic-Mail service or null
     */
    getMagicMailService() {
      return getMagicMailWhatsApp(strapi);
    },

    /**
     * Check if Baileys is available
     */
    async isAvailable() {
      // If Magic-Mail is installed, delegate to it
      const magicMailWA = getMagicMailWhatsApp(strapi);
      if (magicMailWA) {
        return await magicMailWA.isAvailable();
      }
      return await loadBaileys();
    },

    /**
     * Get current connection status
     */
    getStatus() {
      // If Magic-Mail is installed, delegate to it
      const magicMailWA = getMagicMailWhatsApp(strapi);
      if (magicMailWA) {
        const status = magicMailWA.getStatus();
        return {
          ...status,
          delegatedTo: 'magic-mail',
        };
      }
      return {
        status: connectionStatus,
        qrCode: qrCode,
        lastError: lastError,
        isConnected: connectionStatus === 'connected',
      };
    },

    /**
     * Add event listener
     */
    on(callback) {
      eventListeners.push(callback);
      return () => {
        eventListeners = eventListeners.filter(l => l !== callback);
      };
    },

    /**
     * Initialize WhatsApp connection
     * @returns {Promise<object>} Connection result with success status
     */
    async connect() {
      // If Magic-Mail is installed, delegate to it
      const magicMailWA = getMagicMailWhatsApp(strapi);
      if (magicMailWA) {
        strapi.log.info('[Magic-Link WhatsApp] Delegating to Magic-Mail WhatsApp service');
        return await magicMailWA.connect();
      }

      const available = await loadBaileys();
      if (!available) {
        lastError = 'Baileys not installed';
        strapi.log.error('[Magic-Link WhatsApp] Baileys library not available');
        return { success: false, error: lastError };
      }

      if (sock && connectionStatus === 'connected') {
        await debugLog('[Magic-Link WhatsApp] Already connected');
        return { success: true, status: 'already_connected' };
      }

      // Close existing socket if any
      if (sock) {
        try {
          sock.end();
        } catch (e) {}
        sock = null;
      }

      return new Promise(async (resolve) => {
        try {
          connectionStatus = 'connecting';
          emit('status', { status: connectionStatus });
          await debugLog('[Magic-Link WhatsApp] Starting connection...');

          const authPath = getAuthPath();
          
          // Ensure auth directory exists
          if (!fs.existsSync(authPath)) {
            fs.mkdirSync(authPath, { recursive: true });
          }
          await debugLog(`[Magic-Link WhatsApp] Auth path: ${authPath}`);

          const { state, saveCreds } = await baileys.useMultiFileAuthState(authPath);
          await debugLog('[Magic-Link WhatsApp] Auth state loaded');

          // Create socket with silent logging
          const pino = require('pino');
          const logger = pino({ level: 'silent' }); // Silent to avoid console spam

          await debugLog('[Magic-Link WhatsApp] Creating WhatsApp socket...');
          const makeSocket = baileys.default || baileys.makeWASocket;
          
          // Browser config - use Chrome browser fingerprint for better compatibility
          // Using ubuntu/Chrome as alternative fingerprint to avoid 405 rejections
          const browserConfig = baileys.Browsers.ubuntu('Chrome');
          await debugLog(`[Magic-Link WhatsApp] Browser config: ${JSON.stringify(browserConfig)}`);
          
          sock = makeSocket({
            auth: state,
            logger,
            browser: browserConfig,
            syncFullHistory: false, // Disable full history sync for simpler connection
            markOnlineOnConnect: false, // Don't mark as online to preserve phone notifications
            generateHighQualityLinkPreview: false, // Reduce protocol complexity
            // getMessage is required for resending messages and poll vote decryption
            getMessage: async (key) => {
              // We don't store messages, return empty - this is fine for our use case
              return { conversation: '' };
            },
          });
          await debugLog('[Magic-Link WhatsApp] Socket created, registering event handlers...');

          let resolved = false;
          const resolveOnce = (result) => {
            if (!resolved) {
              resolved = true;
              resolve(result);
            }
          };

          // Timeout after 30 seconds (increased for slow connections)
          setTimeout(() => {
            if (!resolved) {
              strapi.log.warn('[Magic-Link WhatsApp] Connection timeout - no QR or connection');
              strapi.log.warn(`[Magic-Link WhatsApp] Current status: ${connectionStatus}, qrCode: ${!!qrCode}`);
              resolveOnce({ success: true, status: connectionStatus, qrCode });
            }
          }, 30000);

          // Handle connection updates - this is where QR comes from
          sock.ev.on('connection.update', async (update) => {
            // Debug log for connection updates
            await debugLog(`[Magic-Link WhatsApp] connection.update: ${JSON.stringify(update)}`);
            
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
              // Generate QR code as data URL
              await debugLog('[Magic-Link WhatsApp] QR code received');
              try {
                const QRCode = require('qrcode');
                qrCode = await QRCode.toDataURL(qr);
                connectionStatus = 'qr_pending';
                emit('qr', { qrCode });
                emit('status', { status: connectionStatus });
                strapi.log.info('[Magic-Link WhatsApp] [SUCCESS] QR Code generated - scan with WhatsApp');
                resolveOnce({ success: true, status: connectionStatus, qrCode });
              } catch (qrError) {
                strapi.log.error('[Magic-Link WhatsApp] QR generation error:', qrError.message);
              }
            }

          if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const isLoggedOut = statusCode === baileys.DisconnectReason.loggedOut;
            const isRestartRequired = statusCode === baileys.DisconnectReason.restartRequired;
            const isConnectionFailure = statusCode === 405; // Method Not Allowed from WhatsApp
            
            await debugLog(`[Magic-Link WhatsApp] Connection closed - statusCode: ${statusCode}`);
            
            if (isLoggedOut) {
              // User logged out - clear everything
              connectionStatus = 'disconnected';
              lastError = 'Logged out from WhatsApp';
              qrCode = null;
              wasConnectedBefore = false;
              reconnectAttempts = 0;
              // Clear auth state
              try {
                fs.rmSync(authPath, { recursive: true, force: true });
              } catch (e) {}
              strapi.log.warn('[Magic-Link WhatsApp] Logged out - auth cleared');
            } else if (isRestartRequired) {
              // WhatsApp requires restart after QR scan - create new socket
              // https://baileys.wiki/docs/socket/connecting
              await debugLog('[Magic-Link WhatsApp] Restart required - reconnecting...');
              connectionStatus = 'connecting';
              setTimeout(() => {
                service.connect();
              }, 1000);
            } else if (isConnectionFailure && reconnectAttempts < 2) {
              // 405 error - WhatsApp rejected connection, clear auth and retry (max 2 times)
              reconnectAttempts++;
              await debugLog(`[Magic-Link WhatsApp] Connection rejected (405) - retrying (${reconnectAttempts}/2)`);
              try {
                fs.rmSync(authPath, { recursive: true, force: true });
              } catch (e) {}
              connectionStatus = 'disconnected';
              qrCode = null;
              // Try again with fresh auth after short delay
              setTimeout(() => {
                service.connect();
              }, 3000);
            } else if (isConnectionFailure) {
              // 405 error persists - stop trying
              connectionStatus = 'disconnected';
              lastError = 'WhatsApp connection rejected (405). This may be a temporary issue with WhatsApp servers or an incompatible Baileys version.';
              strapi.log.error('[Magic-Link WhatsApp] [ERROR] Connection rejected after retries. Please try again later or check for Baileys updates.');
              resolveOnce({ success: false, status: connectionStatus, error: lastError });
            } else if (wasConnectedBefore && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              // Only reconnect if we had a successful connection before
              reconnectAttempts++;
              connectionStatus = 'connecting';
              await debugLog(`[Magic-Link WhatsApp] Reconnecting (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
              // Use arrow function to preserve context
              setTimeout(() => {
                service.connect();
              }, 3000 * reconnectAttempts); // Exponential backoff
            } else if (!wasConnectedBefore) {
              // Never connected - user needs to scan QR code first
              connectionStatus = 'disconnected';
              qrCode = null;
              await debugLog('[Magic-Link WhatsApp] Connection closed - waiting for QR scan');
            } else {
              // Max reconnect attempts reached
              connectionStatus = 'disconnected';
              lastError = 'Max reconnect attempts reached';
              strapi.log.warn('[Magic-Link WhatsApp] Max reconnect attempts reached');
            }
            
            emit('status', { status: connectionStatus, error: lastError });
          }

          if (connection === 'open') {
            connectionStatus = 'connected';
            qrCode = null;
            lastError = null;
            wasConnectedBefore = true; // Mark successful connection
            reconnectAttempts = 0; // Reset attempts
            emit('status', { status: connectionStatus });
            strapi.log.info('[Magic-Link WhatsApp] [SUCCESS] Connected successfully!');
            resolveOnce({ success: true, status: connectionStatus });
          }
        });

        // Save credentials when updated
        sock.ev.on('creds.update', saveCreds);

      } catch (error) {
        lastError = error.message;
        connectionStatus = 'disconnected';
        strapi.log.error('[Magic-Link WhatsApp] Connection error:', error);
        resolve({ success: false, error: error.message });
      }
      });
    },

    /**
     * Disconnect WhatsApp
     */
    async disconnect() {
      // If Magic-Mail is installed, delegate to it
      const magicMailWA = getMagicMailWhatsApp(strapi);
      if (magicMailWA) {
        strapi.log.info('[Magic-Link WhatsApp] Delegating disconnect to Magic-Mail');
        return await magicMailWA.disconnect();
      }

      if (sock) {
        try {
          await sock.logout();
        } catch (e) {}
        sock = null;
      }
      connectionStatus = 'disconnected';
      qrCode = null;
      emit('status', { status: connectionStatus });
      return { success: true };
    },

    /**
     * Send a message to a phone number
     * @param {string} phoneNumber - Phone number with country code (e.g., "491234567890")
     * @param {string} message - Message text
     */
    async sendMessage(phoneNumber, message) {
      // If Magic-Mail is installed, delegate to it
      const magicMailWA = getMagicMailWhatsApp(strapi);
      if (magicMailWA) {
        await debugLog('[Magic-Link WhatsApp] Delegating sendMessage to Magic-Mail');
        return await magicMailWA.sendMessage(phoneNumber, message);
      }

      if (connectionStatus !== 'connected' || !sock) {
        return { 
          success: false, 
          error: 'WhatsApp not connected. Please connect first.' 
        };
      }

      try {
        // Format phone number (remove + and spaces, ensure @s.whatsapp.net suffix)
        const formattedNumber = phoneNumber.replace(/[^\d]/g, '');
        const jid = `${formattedNumber}@s.whatsapp.net`;

        // Check if number exists on WhatsApp
        const [exists] = await sock.onWhatsApp(formattedNumber);
        if (!exists?.exists) {
          return { 
            success: false, 
            error: `Phone number ${phoneNumber} is not registered on WhatsApp` 
          };
        }

        // Send message
        await sock.sendMessage(jid, { text: message });

        await debugLog(`[Magic-Link WhatsApp] Message sent to ${formattedNumber}`);
        return { success: true, jid };
      } catch (error) {
        strapi.log.error('[Magic-Link WhatsApp] Send error:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Send Magic Link via WhatsApp
     * Uses the message template from plugin settings
     * @param {string} phoneNumber - Phone number
     * @param {string} magicLink - The magic link URL
     * @param {object} options - Additional options
     */
    async sendMagicLink(phoneNumber, magicLink, options = {}) {
      // Get settings from plugin store
      const pluginStore = strapi.store({ type: 'plugin', name: 'magic-link' });
      const settings = await pluginStore.get({ key: 'settings' }) || {};
      
      const { 
        appName = settings.whatsapp_app_name || 'Magic Link',
        expiryText = '1 hour',
        customMessage = null 
      } = options;

      // Get message template from settings or use default
      let messageTemplate = settings.whatsapp_message_template || 
        `*{{appName}} Login*

Klicke auf den Link um dich einzuloggen:

{{link}}

Dieser Link ist {{expiry}} gültig.

_Falls du diesen Link nicht angefordert hast, ignoriere diese Nachricht._`;

      // Replace placeholders
      const message = customMessage || messageTemplate
        .replace(/\{\{appName\}\}/g, appName)
        .replace(/\{\{link\}\}/g, magicLink)
        .replace(/\{\{expiry\}\}/g, expiryText);

      return this.sendMessage(phoneNumber, message);
    },

    /**
     * Check if a phone number is on WhatsApp
     * @param {string} phoneNumber - Phone number to check
     */
    async checkNumber(phoneNumber) {
      // If Magic-Mail is installed, delegate to it
      const magicMailWA = getMagicMailWhatsApp(strapi);
      if (magicMailWA) {
        return await magicMailWA.checkNumber(phoneNumber);
      }

      if (connectionStatus !== 'connected' || !sock) {
        return { success: false, error: 'WhatsApp not connected' };
      }

      try {
        const formattedNumber = phoneNumber.replace(/[^\d]/g, '');
        const [result] = await sock.onWhatsApp(formattedNumber);
        return { 
          success: true, 
          exists: result?.exists || false,
          jid: result?.jid 
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    /**
     * Get session info
     * @returns {Promise<object|null>} Session info or null if not connected
     */
    async getSessionInfo() {
      // If Magic-Mail is installed, delegate to it
      const magicMailWA = getMagicMailWhatsApp(strapi);
      if (magicMailWA) {
        return await magicMailWA.getSessionInfo();
      }

      if (connectionStatus !== 'connected' || !sock) {
        return null;
      }

      try {
        const user = sock.user;
        return {
          phoneNumber: user?.id?.split(':')[0] || user?.id?.split('@')[0],
          name: user?.name,
          platform: 'WhatsApp Web',
        };
      } catch (error) {
        return null;
      }
    },

    /**
     * Reset connection state (for manual cleanup)
     */
    reset() {
      sock = null;
      qrCode = null;
      connectionStatus = 'disconnected';
      lastError = null;
      wasConnectedBefore = false;
      reconnectAttempts = 0;
    },
  };

  return service;
};

