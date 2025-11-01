'use strict';
/**
 * Auth.js controller
 *
 * @description: A set of functions called "actions" for managing `Auth`.
 */

const { sanitize } = require('@strapi/utils');
const _ = require('lodash');
const { nanoid } = require('nanoid');

// Email regex pattern - simplified to avoid ReDoS attacks
const emailRegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = {
  async login(ctx) {
    const { loginToken } = ctx.query;
    // Strapi v5 pattern für Service Zugriff
    const magicLink = strapi.plugin('magic-link').service('magic-link');
    const userService = strapi.plugin('users-permissions').service('user');
    const jwtService = strapi.plugin('users-permissions').service('jwt');
    const isEnabled = await magicLink.isEnabled();

    if (!isEnabled) {
      return ctx.badRequest('plugin.disabled');
    }

    if (_.isEmpty(loginToken)) {
      return ctx.badRequest('token.invalid');
    }
    const token = await magicLink.fetchToken(loginToken);

    if (!token || !token.is_active) {
      return ctx.badRequest('token.invalid');
    }

    const isValid = await magicLink.isTokenValid(token);

    if (!isValid) {
      await magicLink.deactivateToken(token);
      return ctx.badRequest('token.invalid');
    }

    // Collect request information for security logging
    const requestInfo = {
      userAgent: ctx.request.header['user-agent'],
      ipAddress: ctx.request.ip
    };

    await magicLink.updateTokenOnLogin(token, requestInfo);

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { email: token.email },
    });

    if (!user) {
      return ctx.badRequest('wrong.email');
    }

    if (user.blocked) {
      return ctx.badRequest('blocked.user');
    }

    if (!user.confirmed) {
      await userService.edit(user.id, { confirmed: true });
    }
    
    // In Strapi v5, sanitization works differently
    // We need to handle it differently to avoid the "Missing schema" error
    const sanitizedUser = { ...user };
    delete sanitizedUser.password;
    delete sanitizedUser.resetPasswordToken;
    delete sanitizedUser.confirmationToken;
    delete sanitizedUser.roles;

    let context;
    try {
      context = token.context || {};
    } catch (e) {
      context = {};
    }
    
    // Sanitize context to prevent injection attacks
    // Whitelist allowed fields and limit their size
    const allowedContextFields = ['redirectUrl', 'locale', 'source', 'ttl', 'metadata'];
    const sanitizedContext = {};
    for (const field of allowedContextFields) {
      if (context[field] !== undefined) {
        // Limit string length to prevent payload bloat
        if (typeof context[field] === 'string') {
          sanitizedContext[field] = String(context[field]).substring(0, 500);
        } else if (typeof context[field] === 'number' && !isNaN(context[field])) {
          sanitizedContext[field] = context[field];
        } else if (typeof context[field] === 'object' && context[field] !== null) {
          // For nested objects like metadata, stringify and limit size
          try {
            const jsonStr = JSON.stringify(context[field]).substring(0, 1000);
            sanitizedContext[field] = JSON.parse(jsonStr);
          } catch {
            // Skip invalid objects
          }
        }
      }
    }
    
    // Generiere JWT-Token mit dem sanitierten Context
    const jwtToken = jwtService.issue({ 
      id: user.id,
      context: sanitizedContext
    });
    
    // Hole JWT-Konfiguration, um Ablaufzeit zu berechnen
    const settings = await magicLink.settings();
    let expirationTime = settings.jwt_token_expires_in || '30d';
    
    // Parse die Ablaufzeit (z.B. "30d" -> 30 Tage)
    let expiresAt = new Date();
    if (expirationTime.endsWith('d')) {
      const days = parseInt(expirationTime.slice(0, -1), 10);
      expiresAt.setDate(expiresAt.getDate() + days);
    } else if (expirationTime.endsWith('h')) {
      const hours = parseInt(expirationTime.slice(0, -1), 10);
      expiresAt.setHours(expiresAt.getHours() + hours);
    } else if (expirationTime.endsWith('m')) {
      const minutes = parseInt(expirationTime.slice(0, -1), 10);
      expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
    } else {
      // Fallback auf 30 Tage
      expiresAt.setDate(expiresAt.getDate() + 30);
    }
    
    try {
      // Speichere die JWT-Session im Plugin-Store
      const pluginStore = strapi.store({
        type: 'plugin',
        name: 'magic-link',
      });
      
      // Hole aktuelle JWT-Sessions oder initialisiere leere Liste
      const jwtSessions = (await pluginStore.get({ key: 'jwt_sessions' })) || { sessions: [] };
      
      // Erstelle eine neue Session mit einer eindeutigen ID (cryptographically secure)
      const sessionId = `session_${Date.now()}_${nanoid(12)}`;
      
      // Füge neue Session zur Liste hinzu
      jwtSessions.sessions.push({
        id: sessionId,
        userId: user.id,
        userEmail: user.email,
        username: user.username || user.email.split('@')[0],
        jwtToken: jwtToken,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        isRevoked: false,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        source: 'Magic Link Login',
        lastUsedAt: new Date().toISOString(),
        context: sanitizedContext  // Speichere den sanitierten Context auch in der Session
      });
      
      // Speichere aktualisierte Liste
      await pluginStore.set({ key: 'jwt_sessions', value: jwtSessions });
    } catch (error) {
      console.error("Fehler beim Speichern der JWT-Session:", error);
      // Hier nicht abbrechen, damit der Login trotzdem funktioniert
    }
    
    ctx.send({
      jwt: jwtToken,
      user: sanitizedUser,
      context: sanitizedContext,
      expires_at: expiresAt.toISOString(),
      expiry_formatted: new Intl.DateTimeFormat('de-DE', {
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(expiresAt)
    });
  },

  async sendLink(ctx) {
    // Strapi v5 pattern für Service Zugriff
    const magicLink = strapi.plugin('magic-link').service('magic-link');
    const rateLimiter = strapi.plugin('magic-link').service('rate-limiter');

    const isEnabled = await magicLink.isEnabled();

    if (!isEnabled) {
      return ctx.badRequest('plugin.disabled');
    }

    const params = _.assign(ctx.request.body);

    const email = params.email ? params.email.trim().toLowerCase() : null;
    const context = params.context || {};
    const username = params.username || null;

    const isEmail = emailRegExp.test(email);

    if (email && !isEmail) {
      return ctx.badRequest('wrong.email');
    }
    
    // Rate limiting check - both IP and email
    const ipAddress = ctx.request.ip;
    const ipCheck = await rateLimiter.checkRateLimit(ipAddress, 'ip');
    
    if (!ipCheck.allowed) {
      return ctx.tooManyRequests(`Too many requests. Please try again in ${ipCheck.retryAfter} seconds.`);
    }
    
    if (email) {
      const emailCheck = await rateLimiter.checkRateLimit(email, 'email');
      
      if (!emailCheck.allowed) {
        return ctx.tooManyRequests(`Too many requests for this email. Please try again in ${emailCheck.retryAfter} seconds.`);
      }
    }

    let user;
    try {
      user = await magicLink.user(email, username);
    } catch (e) {
      return ctx.badRequest('wrong.user')
    }

    if (!user) {
      return ctx.badRequest('wrong.email');
    }

    if (email && user.email !== email) {
      return ctx.badRequest('wrong.user')
    }

    if (user.blocked) {
      return ctx.badRequest('blocked.user');
    }

    try {
      const token = await magicLink.createToken(user.email, context);
      await magicLink.sendLoginLink(token);
      ctx.send({
        email,
        username,
        sent: true,
      });
    } catch (err) {
      return ctx.badRequest(err);
    }
  },
}; 