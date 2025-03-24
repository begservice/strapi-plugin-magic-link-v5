'use strict';

/**
 * JWT controller für die Verwaltung von JWT-Tokens
 */

module.exports = {
  /**
   * Alle aktiven JWT-Sessions abrufen
   * @param {Object} ctx - Koa-Kontext
   */
  async getSessions(ctx) {
    try {
      // Aus dem Plugin-Store auslesen
      const pluginStore = strapi.store({
        environment: '',
        type: 'plugin',
        name: 'magic-link',
      });
      
      const storedData = (await pluginStore.get({ key: 'jwt_sessions' })) || { sessions: [] };
      const jwtSessions = storedData.sessions || [];
      
      // Aktuelles Datum für Ablaufprüfung
      const now = new Date();
      
      // Aufbereitung der Daten für die Anzeige
      const sessions = jwtSessions.map(session => ({
        id: session.id,
        userId: session.userId,
        username: session.username,
        email: session.userEmail,
        token: session.jwtToken ? session.jwtToken.substring(0, 30) + '...' : 'N/A', // Nur Teile des Tokens anzeigen
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent || 'Unbekannt',
        source: session.source || 'Magic Link Login',
        revoked: session.isRevoked,
        isExpired: new Date(session.expiresAt) < now
      }));
      
      ctx.send(sessions);
    } catch (error) {
      console.error('Error fetching JWT sessions:', error);
      ctx.throw(500, error);
    }
  },

  /**
   * Ein JWT-Token sperren
   * @param {Object} ctx - Koa-Kontext
   */
  async revokeToken(ctx) {
    try {
      const { token, sessionId } = ctx.request.body;
      
      // Hole aktuelle JWT-Sessions
      const pluginStore = strapi.store({
        environment: '',
        type: 'plugin',
        name: 'magic-link',
      });
      
      const storedData = (await pluginStore.get({ key: 'jwt_sessions' })) || { sessions: [] };
      let jwtSessions = storedData.sessions || [];
      
      // Möglichkeit 1: Sperren über sessionId
      if (sessionId) {
        // Finde die Session anhand der ID
        const sessionIndex = jwtSessions.findIndex(s => s.id === sessionId);
        
        if (sessionIndex === -1) {
          return ctx.badRequest('Session not found');
        }
        
        // Markiere Session als gesperrt
        jwtSessions[sessionIndex].isRevoked = true;
        jwtSessions[sessionIndex].revokedAt = new Date().toISOString();
        jwtSessions[sessionIndex].revokeReason = 'Manually revoked from admin UI';
        
        // Sperrung auch in der Sperrliste erfassen
        if (jwtSessions[sessionIndex].jwtToken) {
          const { magicLink } = strapi.plugins['strapi-plugin-magic-link-v5'].services;
          await magicLink.blockJwtToken(
            jwtSessions[sessionIndex].jwtToken,
            jwtSessions[sessionIndex].userId,
            'Manually revoked from admin UI'
          );
        }
        
        // Speichere aktualisierte Liste
        await pluginStore.set({ key: 'jwt_sessions', value: { sessions: jwtSessions } });
        
        return ctx.send({ 
          success: true, 
          message: 'JWT session revoked successfully' 
        });
      }
      
      // Möglichkeit 2: Sperren über Token (Legacy)
      if (token) {
        const { magicLink } = strapi.plugins['strapi-plugin-magic-link-v5'].services;
        const result = await magicLink.blockJwtToken(
          token, 
          ctx.request.body.userId || 'unknown', 
          'Manually revoked from admin UI'
        );
        
        // Auch alle Sessions mit diesem Token sperren
        const tokenPrefix = token.substring(0, 30);
        
        jwtSessions = jwtSessions.map(session => {
          // Prüfe, ob der Token-Anfang übereinstimmt
          if (session.jwtToken && session.jwtToken.startsWith(tokenPrefix)) {
            return {
              ...session,
              isRevoked: true,
              revokedAt: new Date().toISOString(),
              revokeReason: 'Manually revoked from admin UI via token'
            };
          }
          return session;
        });
        
        // Speichere aktualisierte Liste
        await pluginStore.set({ key: 'jwt_sessions', value: { sessions: jwtSessions } });
        
        return ctx.send({ 
          success: true,
          message: "Die Session wurde erfolgreich gesperrt."
        });
      }
      
      return ctx.badRequest('Token or sessionId is required');
    } catch (error) {
      console.error('Error revoking JWT token:', error);
      ctx.throw(500, error);
    }
  },

  /**
   * Ein JWT-Token entsperren
   * @param {Object} ctx - Koa-Kontext
   */
  async unrevokeToken(ctx) {
    try {
      const { sessionId, userId } = ctx.request.body;
      
      if (!sessionId) {
        return ctx.badRequest('Session ID is required');
      }
      
      // Hole aktuelle JWT-Sessions
      const pluginStore = strapi.store({
        environment: '',
        type: 'plugin',
        name: 'magic-link',
      });
      
      const storedData = (await pluginStore.get({ key: 'jwt_sessions' })) || { sessions: [] };
      let jwtSessions = storedData.sessions || [];
      
      // Finde die Session anhand der ID
      const sessionIndex = jwtSessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) {
        return ctx.badRequest('Session not found');
      }
      
      // Prüfe, ob die Session abgelaufen ist
      const expiresAt = new Date(jwtSessions[sessionIndex].expiresAt);
      const now = new Date();
      
      if (expiresAt < now) {
        return ctx.badRequest('Cannot unrevoke an expired session');
      }
      
      // Session entsperren
      jwtSessions[sessionIndex].isRevoked = false;
      jwtSessions[sessionIndex].revokedAt = null;
      jwtSessions[sessionIndex].revokeReason = null;
      
      // Token aus der Sperrliste entfernen, falls vorhanden
      if (jwtSessions[sessionIndex].jwtToken) {
        const { magicLink } = strapi.plugins['strapi-plugin-magic-link-v5'].services;
        
        try {
          // JWT von der Blacklist entfernen
          await magicLink.unblockJwtToken(
            jwtSessions[sessionIndex].jwtToken,
            userId || jwtSessions[sessionIndex].userId
          );
        } catch (error) {
          console.warn('Warning: Could not unblock JWT token from blacklist:', error);
          // Fehler ignorieren, da der Token möglicherweise nicht in der Blacklist ist
        }
      }
      
      // Speichere aktualisierte Liste
      await pluginStore.set({ key: 'jwt_sessions', value: { sessions: jwtSessions } });
      
      return ctx.send({ 
        success: true, 
        message: 'JWT session unrevoked successfully' 
      });
    } catch (error) {
      console.error('Error unrevoking JWT token:', error);
      ctx.throw(500, error);
    }
  },
  
  /**
   * Alle abgelaufenen und gesperrten Sessions aufräumen
   * @param {Object} ctx - Koa-Kontext 
   */
  async cleanupSessions(ctx) {
    try {
      const now = new Date();
      
      // Hole aktuelle JWT-Sessions
      const pluginStore = strapi.store({
        environment: '',
        type: 'plugin',
        name: 'magic-link',
      });
      
      const storedData = (await pluginStore.get({ key: 'jwt_sessions' })) || { sessions: [] };
      let jwtSessions = storedData.sessions || [];
      
      // Identifiziere abgelaufene Sessions
      const expiredSessionIds = [];
      
      jwtSessions = jwtSessions.map(session => {
        // Prüfe, ob abgelaufen und nicht bereits gesperrt
        if (new Date(session.expiresAt) < now && !session.isRevoked) {
          expiredSessionIds.push(session.id);
          return {
            ...session,
            isRevoked: true,
            revokedAt: now.toISOString(),
            revokeReason: 'Automatically expired'
          };
        }
        return session;
      });
      
      // Speichere aktualisierte Liste
      await pluginStore.set({ key: 'jwt_sessions', value: { sessions: jwtSessions } });
      
      ctx.send({ 
        success: true, 
        count: expiredSessionIds.length,
        message: `${expiredSessionIds.length} abgelaufene Sessions wurden aufgeräumt.`
      });
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
      ctx.throw(500, error);
    }
  },

  async revokeJWT(ctx) {
    try {
      const { jwt, userId, reason } = ctx.request.body;
      
      if (!jwt) {
        return ctx.badRequest('JWT token is required');
      }
      
      const { magicLink } = strapi.plugins['strapi-plugin-magic-link-v5'].services;
      
      // ... existing code ...
    },

    async unrevokeJWT(ctx) {
      try {
        const { jwt, userId } = ctx.request.body;
        
        if (!jwt) {
          return ctx.badRequest('JWT token is required');
        }
        
        const { magicLink } = strapi.plugins['strapi-plugin-magic-link-v5'].services;
        
        // ... existing code ...
      },

    async getAllBlockedJWTs(ctx) {
      try {
        const { magicLink } = strapi.plugins['strapi-plugin-magic-link-v5'].services;
        
        // ... existing code ...
      },
}; 