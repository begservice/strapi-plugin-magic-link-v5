'use strict';

/**
 * magic-link.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const _ = require('lodash');
const { nanoid } = require('nanoid');
const { sanitize } = require('@strapi/utils');

module.exports = ({ strapi }) => ({
  async initialize() {
    // Initialization logic if needed
  },

  settings() {
    const pluginStore = strapi.store({
      environment: '',
      type: 'plugin',
      name: 'magic-link',
    });
    return pluginStore.get({ key: 'settings' });
  },

  userSettings() {
    const pluginStore = strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });
    return pluginStore.get({ key: 'advanced' });
  },

  async isEnabled() {
    const settings = await this.settings();
    return !!settings.enabled;
  },

  async createUser(user) {
    const userSettings = await this.userSettings();
    const role = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: userSettings.default_role } });

    const newUser = {
      ...user,
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: role.id,
    };

    const createdUser = await strapi
      .query('plugin::users-permissions.user')
      .create({ data: newUser });

    return createdUser;
  },

  async user(email, username) {
    const settings = await this.settings();
    const createUserIfNotExists = settings.createUserIfNotExists;

    const user = await strapi.query('plugin::users-permissions.user').findOne({
      where: email ? { email } : { username },
    });

    if (!user && !createUserIfNotExists) {
      throw new Error('User not found');
    }

    if (!user && createUserIfNotExists) {
      const newUser = await this.createUser({
        email,
        username: username || email.split('@')[0],
      });
      return newUser;
    }

    return user;
  },

  async createToken(email, context = {}) {
    const settings = await this.settings();
    const tokenLength = settings.token_length || 20;
    const token = nanoid(tokenLength);
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    const tokenObject = await strapi.query('plugin::strapi-plugin-magic-link-v5.token').create({
      data: {
        email,
        token,
        expires_at: expires,
        is_active: true,
        context: typeof context === 'string' ? JSON.parse(context) : context,
      },
    });

    return tokenObject;
  },

  async fetchToken(token) {
    return strapi.query('plugin::strapi-plugin-magic-link-v5.token').findOne({
      where: { token },
    });
  },

  async isTokenValid(token) {
    const { is_active, expires_at } = token;
    const settings = await this.settings();
    const staysValid = settings.stays_valid;

    if (!is_active) {
      return false;
    }

    if (staysValid) {
      return true;
    }

    const currentTime = new Date();
    const expiryTime = new Date(expires_at);

    return currentTime < expiryTime;
  },

  async deactivateToken(token) {
    return strapi.query('plugin::strapi-plugin-magic-link-v5.token').update({
      where: { id: token.id },
      data: { is_active: false },
    });
  },

  async updateTokenOnLogin(token, requestInfo = null) {
    return strapi.query('plugin::strapi-plugin-magic-link-v5.token').update({
      where: { id: token.id },
      data: {
        last_used_at: new Date(),
        last_used_ip: requestInfo?.ipAddress,
        user_agent: requestInfo?.userAgent,
      },
    });
  },

  async sendLoginLink(token) {
    const settings = await this.settings();
    const emailTemplate = {
      subject: settings.object,
      text: settings.message_text,
      html: settings.message_html,
    };

    const emailConfig = {
      from: `${settings.from_name} <${settings.from_email}>`,
      response_email: settings.response_email,
      object: settings.object,
      message: settings.message_text,
    };

    // Replace variables in the email template
    const url = settings.confirmationUrl;
    const code = token.token;

    // Replace variables in the email template
    const html = _.template(emailTemplate.html)({
      URL: url,
      CODE: code,
    });

    const text = _.template(emailTemplate.text)({
      URL: url,
      CODE: code,
    });

    // Send the email
    await strapi.plugins['email'].services.email.send({
      to: token.email,
      from: emailConfig.from,
      replyTo: emailConfig.response_email,
      subject: emailConfig.object,
      text,
      html,
    });

    return token;
  },

  /**
   * Sperrt einen bestimmten JWT-Token vor seinem Ablauf
   * @param {string} token - Der zu sperrende JWT-Token
   * @param {string} userId - Die Benutzer-ID des Token-Inhabers
   * @param {string} reason - Grund für die Sperrung (optional)
   */
  async blockJwtToken(token, userId, reason = 'Manually revoked') {
    try {
      // Holen des aktuellen Sets gesperrter Tokens
      const pluginStore = strapi.store({
        environment: '',
        type: 'plugin',
        name: 'magic-link',
      });
      
      const blockedTokens = (await pluginStore.get({ key: 'blocked_jwt_tokens' })) || { tokens: [] };
      
      // Standardablaufdatum (30 Tage ab jetzt) - wir verzichten auf die Verifizierung
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      // Hinzufügen des neuen Tokens zur Blacklist
      blockedTokens.tokens.push({
        token: token,
        userId: userId,
        reason: reason,
        blockedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
      });
      
      // Speichern der aktualisierten Liste
      await pluginStore.set({ key: 'blocked_jwt_tokens', value: blockedTokens });
      
      return { success: true };
    } catch (error) {
      strapi.log.error('Error blocking JWT token:', error);
      throw new Error('Failed to block JWT token');
    }
  },

  /**
   * Entsperrt einen bestimmten JWT-Token
   * @param {string} token - Der zu entsperrende JWT-Token
   * @param {string} userId - Die Benutzer-ID des Token-Inhabers
   */
  async unblockJwtToken(token, userId) {
    try {
      // Holen des aktuellen Sets gesperrter Tokens
      const pluginStore = strapi.store({
        environment: '',
        type: 'plugin',
        name: 'magic-link',
      });
      
      const blockedTokensData = (await pluginStore.get({ key: 'blocked_jwt_tokens' })) || { tokens: [] };
      
      // Entfernen des Token aus der Blacklist
      blockedTokensData.tokens = blockedTokensData.tokens.filter(t => 
        !(t.token === token && (t.userId === userId || !userId))
      );
      
      // Speichern der aktualisierten Liste
      await pluginStore.set({ key: 'blocked_jwt_tokens', value: blockedTokensData });
      
      return { success: true };
    } catch (error) {
      strapi.log.error('Error unblocking JWT token:', error);
      throw new Error('Failed to unblock JWT token');
    }
  },

  /**
   * Prüft, ob ein JWT-Token gesperrt ist
   * @param {string} token - Der zu überprüfende JWT-Token
   * @returns {boolean} - True, wenn der Token gesperrt ist
   */
  async isJwtTokenBlocked(token) {
    try {
      const pluginStore = strapi.store({
        environment: '',
        type: 'plugin',
        name: 'magic-link',
      });
      
      const blockedTokens = (await pluginStore.get({ key: 'blocked_jwt_tokens' })) || { tokens: [] };
      
      // Prüfen, ob der Token in der Blocklist ist
      return blockedTokens.tokens.some(blockedToken => blockedToken.token === token);
    } catch (error) {
      console.error('Error checking if JWT token is blocked:', error);
      return false;
    }
  },

  /**
   * Gibt alle gesperrten JWT-Tokens zurück
   * @returns {Array} - Liste aller gesperrten Tokens
   */
  async getBlockedJwtTokens() {
    try {
      const pluginStore = strapi.store({
        environment: '',
        type: 'plugin',
        name: 'magic-link',
      });
      
      const blockedTokens = (await pluginStore.get({ key: 'blocked_jwt_tokens' })) || { tokens: [] };
      
      // Aufräumen abgelaufener Tokens
      const now = new Date();
      blockedTokens.tokens = blockedTokens.tokens.filter(token => 
        new Date(token.expiresAt) > now
      );
      
      // Aktualisierte Liste speichern
      await pluginStore.set({ key: 'blocked_jwt_tokens', value: blockedTokens });
      
      return blockedTokens.tokens;
    } catch (error) {
      console.error('Error getting blocked JWT tokens:', error);
      return [];
    }
  },

  /**
   * Prüft, ob eine IP-Adresse gebannt ist
   * @param {string} ipAddress - Die zu prüfende IP-Adresse
   * @returns {boolean} - True, wenn die IP gebannt ist
   */
  async isIPBanned(ipAddress) {
    try {
      const pluginStore = strapi.store({
        environment: '',
        type: 'plugin',
        name: 'magic-link',
      });
      
      const bannedIPs = (await pluginStore.get({ key: 'banned_ips' })) || { ips: [] };
      
      // Prüfen, ob die IP in der Liste gebannter IPs ist
      return bannedIPs.ips.includes(ipAddress);
    } catch (error) {
      console.error('Error checking if IP is banned:', error);
      return false;
    }
  }
}); 