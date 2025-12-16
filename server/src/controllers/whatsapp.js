'use strict';

/**
 * WhatsApp Controller
 * 
 * Admin API endpoints for WhatsApp integration management.
 */

module.exports = {
  /**
   * Get WhatsApp connection status
   * GET /magic-link/whatsapp/status
   */
  async getStatus(ctx) {
    try {
      const whatsappService = strapi.plugin('magic-link').service('whatsapp');
      
      const available = await whatsappService.isAvailable();
      if (!available) {
        return ctx.send({
          available: false,
          status: 'not_installed',
          message: 'Baileys is not installed. Run: npm install @whiskeysockets/baileys',
        });
      }

      const status = whatsappService.getStatus();
      const sessionInfo = await whatsappService.getSessionInfo();

      return ctx.send({
        available: true,
        ...status,
        session: sessionInfo,
      });
    } catch (error) {
      strapi.log.error('[Magic-Link WhatsApp] Status error:', error);
      return ctx.badRequest('Failed to get WhatsApp status', { error: error.message });
    }
  },

  /**
   * Connect to WhatsApp (generates QR code)
   * POST /magic-link/whatsapp/connect
   */
  async connect(ctx) {
    try {
      const whatsappService = strapi.plugin('magic-link').service('whatsapp');
      
      const available = await whatsappService.isAvailable();
      if (!available) {
        return ctx.badRequest('Baileys not installed. Run: npm install @whiskeysockets/baileys qrcode pino');
      }

      // Connect now waits for QR code or connection
      const result = await whatsappService.connect();
      
      if (result.success) {
        return ctx.send({
          success: true,
          status: result.status,
          qrCode: result.qrCode || whatsappService.getStatus().qrCode,
          isConnected: result.status === 'connected',
        });
      } else {
        return ctx.badRequest('Connection failed', { error: result.error });
      }
    } catch (error) {
      strapi.log.error('[Magic-Link WhatsApp] Connect error:', error);
      return ctx.badRequest('Failed to connect', { error: error.message });
    }
  },

  /**
   * Disconnect from WhatsApp
   * POST /magic-link/whatsapp/disconnect
   */
  async disconnect(ctx) {
    try {
      const whatsappService = strapi.plugin('magic-link').service('whatsapp');
      const result = await whatsappService.disconnect();
      return ctx.send(result);
    } catch (error) {
      strapi.log.error('[Magic-Link WhatsApp] Disconnect error:', error);
      return ctx.badRequest('Failed to disconnect', { error: error.message });
    }
  },

  /**
   * Check if a phone number is on WhatsApp
   * POST /magic-link/whatsapp/check-number
   */
  async checkNumber(ctx) {
    try {
      const { phoneNumber } = ctx.request.body;
      
      if (!phoneNumber) {
        return ctx.badRequest('Phone number is required');
      }

      const whatsappService = strapi.plugin('magic-link').service('whatsapp');
      const result = await whatsappService.checkNumber(phoneNumber);
      return ctx.send(result);
    } catch (error) {
      strapi.log.error('[Magic-Link WhatsApp] Check number error:', error);
      return ctx.badRequest('Failed to check number', { error: error.message });
    }
  },

  /**
   * Send a test message
   * POST /magic-link/whatsapp/test-message
   */
  async testMessage(ctx) {
    try {
      const { phoneNumber, message } = ctx.request.body;
      
      if (!phoneNumber) {
        return ctx.badRequest('Phone number is required');
      }

      const whatsappService = strapi.plugin('magic-link').service('whatsapp');
      const testMessage = message || 'This is a test message from Magic Link Plugin!';
      const result = await whatsappService.sendMessage(phoneNumber, testMessage);
      return ctx.send(result);
    } catch (error) {
      strapi.log.error('[Magic-Link WhatsApp] Test message error:', error);
      return ctx.badRequest('Failed to send message', { error: error.message });
    }
  },

  /**
   * Get QR code for scanning
   * GET /magic-link/whatsapp/qr
   */
  async getQRCode(ctx) {
    try {
      const whatsappService = strapi.plugin('magic-link').service('whatsapp');
      const status = whatsappService.getStatus();
      
      if (status.qrCode) {
        return ctx.send({
          success: true,
          qrCode: status.qrCode,
          status: status.status,
        });
      } else {
        return ctx.send({
          success: false,
          status: status.status,
          message: status.status === 'connected' 
            ? 'Already connected - no QR needed' 
            : 'No QR code available. Try connecting first.',
        });
      }
    } catch (error) {
      strapi.log.error('[Magic-Link WhatsApp] QR code error:', error);
      return ctx.badRequest('Failed to get QR code', { error: error.message });
    }
  },
};

