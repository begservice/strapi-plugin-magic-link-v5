'use strict';

/**
 * Hilfsfunktion zum Senden einer Standard-E-Mail ohne Email Designer
 * @param {Object} user - Der Benutzer, an den die E-Mail gesendet wird
 * @param {string} magicLink - Der vollständige Magic-Link-URL
 * @param {Object} settings - Die Plugin-Einstellungen
 * @param {string} token - Der generierte Token-Wert
 */
const sendStandardEmail = async (user, magicLink, settings, token) => {
  try {
    // HTML- und Text-Versionen der Nachricht vorbereiten
    let htmlMessage = settings.message_html || '';
    let textMessage = settings.message_text || '';
    
    // Ersetze Platzhalter in den Nachrichten
    htmlMessage = htmlMessage
      .replace(/{link}/g, magicLink)
      .replace(/<%= URL %>/g, settings.confirmationUrl || strapi.config.server.url)
      .replace(/<%= CODE %>/g, token)
      .replace(/{username}/g, user.username || '')
      .replace(/{email}/g, user.email || '');
    
    textMessage = textMessage
      .replace(/{link}/g, magicLink)
      .replace(/<%= URL %>/g, settings.confirmationUrl || strapi.config.server.url)
      .replace(/<%= CODE %>/g, token)
      .replace(/{username}/g, user.username || '')
      .replace(/{email}/g, user.email || '');
    
    // Sende die Email (Strapi v5 konform)
    await strapi.plugin('email').service('email').send({
      to: user.email,
      from: settings.from_email ? `${settings.from_name} <${settings.from_email}>` : undefined,
      replyTo: settings.response_email || undefined,
      subject: settings.object,
      html: htmlMessage,
      text: textMessage,
    });
    
    strapi.log.info(`Standard Magic Link Email an ${user.email} gesendet`);
  } catch (error) {
    strapi.log.error('Fehler beim Senden der Standard-E-Mail:', error);
    throw error;
  }
};

/**
 * Tokens controller
 */

module.exports = {
  /**
   * Get all tokens
   * @param {Object} ctx - The request context
   */
  async find(ctx) {
    try {
      // Query all tokens
      const tokens = await strapi.db.query('plugin::magic-link.token').findMany({
        orderBy: { createdAt: 'desc' },
      });

      // SQLite speichert Booleans als 0/1 - konvertiere zu echten Booleans
      const normalizedTokens = tokens.map(token => ({
        ...token,
        is_active: !!token.is_active  // Konvertiere 0/1 zu false/true
      }));

      // Berechne den Sicherheitswert
      const securityScore = await this.calculateSecurityScore();
      
      // Füge den Sicherheitswert als Metadaten hinzu
      return {
        data: normalizedTokens,
        meta: {
          securityScore
        }
      };
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Create a new token
   * @param {Object} ctx - The request context
   */
  async create(ctx) {
    try {
      const { email, send_email = true, context = {} } = ctx.request.body;

      if (!email) {
        return ctx.badRequest('Email is required');
      }
      
      // Rate limiting check
      const rateLimiter = strapi.plugin('magic-link').service('rate-limiter');
      const ipAddress = ctx.request.ip;
      const ipCheck = await rateLimiter.checkRateLimit(ipAddress, 'ip');
      
      if (!ipCheck.allowed) {
        return ctx.tooManyRequests(`Too many token creation requests. Please try again in ${ipCheck.retryAfter} seconds.`);
      }
      
      const emailCheck = await rateLimiter.checkRateLimit(email, 'email');
      
      if (!emailCheck.allowed) {
        return ctx.tooManyRequests(`Too many requests for this email. Please try again in ${emailCheck.retryAfter} seconds.`);
      }
      
      // Überprüfe, ob die Plugin-Einstellungen das Erstellen neuer Benutzer erlauben
      const pluginStore = strapi.store({
        type: 'plugin',
        name: 'magic-link',
      });
      
      let settings = await pluginStore.get({ key: 'settings' });
      
      // --- DEBUG LOGGING START ---
      strapi.log.info('[MagicLink Controller - create function] Loaded settings from store:', settings);
      // --- DEBUG LOGGING END ---
      
      // Find the user
      let user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email },
        select: ['id', 'username', 'email'],
      });

      // --- DEBUG LOGGING START ---
      strapi.log.info(`[MagicLink Controller - create function] Checking user existence for: ${email}`);
      strapi.log.info(`[MagicLink Controller - create function] User found: ${!!user}`);
      strapi.log.info(`[MagicLink Controller - create function] Value of createUserIfNotExists from settings: ${settings.createUserIfNotExists}`);
      strapi.log.info(`[MagicLink Controller - create function] Value of create_new_user from settings: ${settings.create_new_user}`);
      // --- DEBUG LOGGING END ---

      // Verwende den richtigen Einstellungsnamen: createUserIfNotExists anstatt create_new_user
      // Prüfe sowohl auf den neuen als auch auf den alten Namen für Abwärtskompatibilität
      const canCreateUser = settings.createUserIfNotExists || settings.create_new_user;

      // If user doesn't exist and automatic creation is not enabled, return error
      if (!user && !canCreateUser) {
        // --- DEBUG LOGGING START ---
        strapi.log.warn(`[MagicLink Controller - create function] User does not exist AND canCreateUser is false. Returning Bad Request.`);
        // --- DEBUG LOGGING END ---
        return ctx.badRequest('User does not exist and automatic user creation is disabled');
      }

      // If user doesn't exist, create a new one
      if (!user && canCreateUser) {
        // --- DEBUG LOGGING START ---
        strapi.log.info(`[MagicLink Controller - create function] User does not exist BUT canCreateUser is true. Attempting to create user...`);
        // --- DEBUG LOGGING END ---
        // Generate a random username based on the email
        const username = email.split('@')[0] + Math.floor(Math.random() * 10000);
        
        // Create a random password
        const password = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);
        
        // Get the default role (authenticated)
        const defaultRole = await strapi
          .query('plugin::users-permissions.role')
          .findOne({ where: { type: 'authenticated' } });
          
        if (!defaultRole) {
          return ctx.badRequest('Authenticated role not found');
        }
        
        // Create the user
        user = await strapi.plugin('users-permissions').service('user').add({
          username,
          email,
          password,
          provider: 'magic-link',
          confirmed: true, // Auto-confirm the user
          blocked: false,
          role: defaultRole.id,
        });
        
        strapi.log.info(`Created new user with email: ${email}`);
      }

      // Generate random token (16 characters)
      const tokenValue = Math.random().toString(36).substring(2, 10) + 
                         Math.random().toString(36).substring(2, 10);
      
      // Set expiration (TTL from context, settings, or default 24 hours)
      const ttl = context.ttl || settings.token_lifetime || 24;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + ttl);

      // Erweitere den Kontext mit Ablaufdatum und Benutzerinformationen
      const enrichedContext = {
        ...(typeof context === 'string' ? JSON.parse(context) : context),
        expires_at: expiresAt.toISOString(),
        expiry_formatted: new Intl.DateTimeFormat('de-DE', {
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).format(expiresAt),
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        }
      };

      // Create the token
      const token = await strapi.db.query('plugin::magic-link.token').create({
        data: {
          token: tokenValue,
          email: user.email,
          user_id: user.id,
          expires_at: expiresAt,
          is_active: true,
          ip_address: null, // Wird beim Verwenden gesetzt
          user_agent: null, // Wird beim Verwenden gesetzt
          context: enrichedContext, // Verwende den angereicherten Kontext
        },
      });

      // Sende eine E-Mail mit dem Magic-Link nur wenn send_email true ist
      if (send_email) {
        try {
          // Lade die Einstellungen aus dem Plugin-Store, falls nicht bereits geladen
          if (!settings) {
            settings = await pluginStore.get({ key: 'settings' });
          }
          
          if (settings && settings.enabled && settings.from_email && settings.object) {
            // Erstelle die Magic-Link-URL
            const baseUrl = settings.confirmationUrl || strapi.config.server.url;
            const magicLink = `${baseUrl}?token=${tokenValue}`;
            
            // Prüfen, ob wir Email Designer verwenden sollen
            if (settings.use_email_designer && settings.email_designer_template_id) {
              // Prüfen, ob das Email Designer Plugin verfügbar ist
              if (strapi.plugin('email-designer-5')) {
                // Konvertiere die Template-ID zu einer Zahl
                const templateId = parseInt(settings.email_designer_template_id, 10);
                
                // Stelle sicher, dass die Template-ID eine gültige Zahl ist
                if (!isNaN(templateId) && templateId > 0) {
                  // Email mit dem Email Designer Plugin versenden
                  try {
                    // Die korrekte Email Designer 5 API verwenden
                    await strapi
                      .plugin('email-designer-5')
                      .service('email')
                      .sendTemplatedEmail(
                        {
                          to: user.email,
                          from: settings.from_email ? `${settings.from_name} <${settings.from_email}>` : undefined,
                          replyTo: settings.response_email || undefined,
                        },
                        {
                          templateReferenceId: templateId,
                          subject: settings.object, // Optional: überschreibt den Betreff der Vorlage
                        },
                        {
                          // Variablen für die Vorlage
                          user: {
                            username: user.username,
                            email: user.email,
                          },
                          magicLink: magicLink,
                          token: tokenValue,
                          expiresAt: expiresAt.toISOString(),
                        }
                      );
                      
                    strapi.log.info(`Magic Link Email mit Email Designer (Template ID: ${templateId}) an ${user.email} gesendet`);
                  } catch (emailDesignerError) {
                    strapi.log.error('Fehler bei Email Designer:', emailDesignerError);
                    strapi.log.info('Fallback auf Standard-Email-Versand...');
                    await sendStandardEmail(user, magicLink, settings, tokenValue);
                  }
                } else {
                  strapi.log.warn(`Ungültige Email Designer Template ID: '${settings.email_designer_template_id}', verwende Standard-Email`);
                  // Fallback auf Standard-Email wenn die Template-ID ungültig ist
                  await sendStandardEmail(user, magicLink, settings, tokenValue);
                }
              } else {
                strapi.log.warn('Email Designer Plugin ist aktiviert, aber nicht installiert');
                
                // Fallback auf Standard-Email
                await sendStandardEmail(user, magicLink, settings, tokenValue);
              }
            } else {
              // Standard-Email-Versand
              await sendStandardEmail(user, magicLink, settings, tokenValue);
            }
            
            strapi.log.info(`Magic Link Token erstellt und E-Mail an ${user.email} gesendet`);
          } else {
            strapi.log.info(`Magic Link Token erstellt, aber keine E-Mail-Einstellungen konfiguriert`);
          }
        } catch (emailError) {
          strapi.log.error('Fehler beim Senden der Magic Link Email:', emailError);
          // Wir werfen keinen Fehler, da der Token trotzdem erstellt wurde
        }
      }
      
      // Gebe den kompletten Token zurück (inkl. Token-Wert für Admin-Ansicht)
      return token;
    } catch (error) {
      strapi.log.error('Error creating token:', error);
      ctx.throw(500, error);
    }
  },

  /**
   * Block a token
   * @param {Object} ctx - The request context
   */
  async block(ctx) {
    try {
      const { id } = ctx.params;

      // Check if token exists
      const token = await strapi.db.query('plugin::magic-link.token').findOne({
        where: { id },
      });

      if (!token) {
        return ctx.notFound('Token not found');
      }

      // Update the token to be inactive
      const updatedToken = await strapi.db.query('plugin::magic-link.token').update({
        where: { id },
        data: {
          is_active: false,
        },
      });

      return updatedToken;
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Delete a token
   * @param {Object} ctx - The request context
   */
  async delete(ctx) {
    try {
      const { id } = ctx.params;

      // Check if token exists
      const token = await strapi.db.query('plugin::magic-link.token').findOne({
        where: { id },
      });

      if (!token) {
        return ctx.notFound('Token not found');
      }

      // Delete the token
      await strapi.db.query('plugin::magic-link.token').delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      strapi.log.error('Error deleting token:', error);
      ctx.throw(500, error);
    }
  },

  /**
   * Activate a token
   * @param {Object} ctx - The request context
   */
  async activate(ctx) {
    try {
      const { id } = ctx.params;

      // Prüfe, ob Token existiert
      const token = await strapi.db.query('plugin::magic-link.token').findOne({
        where: { id },
      });

      if (!token) {
        return ctx.notFound('Token nicht gefunden');
      }

      // Aktualisiere den Token auf aktiv
      const updatedToken = await strapi.db.query('plugin::magic-link.token').update({
        where: { id },
        data: {
          is_active: true,
        },
      });

      return updatedToken;
    } catch (error) {
      strapi.log.error('Fehler beim Aktivieren des Tokens:', error);
      ctx.throw(500, error);
    }
  },

  /**
   * Extend token validity
   * @param {Object} ctx - The request context
   */
  async extend(ctx) {
    try {
      const { id } = ctx.params;
      const { days } = ctx.request.body;

      // Prüfe, ob Token existiert
      const token = await strapi.db.query('plugin::magic-link.token').findOne({
        where: { id },
      });

      if (!token) {
        return ctx.notFound('Token nicht gefunden');
      }

      // Verarbeite die Anzahl der Tage
      const daysToAdd = parseInt(days) || 7; // Standard: 7 Tage
      
      // Berechne das neue Ablaufdatum
      let newExpiryDate;
      
      // Wenn der Token bereits abgelaufen ist, vom aktuellen Datum ausgehen
      if (new Date(token.expires_at) < new Date()) {
        newExpiryDate = new Date();
      } else {
        // Sonst vom aktuellen Ablaufdatum ausgehen
        newExpiryDate = new Date(token.expires_at);
      }
      
      // Tage hinzufügen
      newExpiryDate.setDate(newExpiryDate.getDate() + daysToAdd);

      // Aktualisiere den Token mit dem neuen Ablaufdatum
      const updatedToken = await strapi.db.query('plugin::magic-link.token').update({
        where: { id },
        data: {
          expires_at: newExpiryDate,
        },
      });

      return updatedToken;
    } catch (error) {
      strapi.log.error('Fehler beim Verlängern des Tokens:', error);
      ctx.throw(500, error);
    }
  },

  /**
   * Find a user by email
   * @param {Object} ctx - The request context
   */
  async findUserByEmail(ctx) {
    try {
      const { email } = ctx.query;

      if (!email) {
        return ctx.badRequest('Email is required');
      }

      // Überprüfe, ob die Plugin-Einstellungen das Erstellen neuer Benutzer erlauben
      const pluginStore = strapi.store({
        type: 'plugin',
        name: 'magic-link',
      });
      
      const settings = await pluginStore.get({ key: 'settings' });
      
      // Find the user - Entferne UUID aus der Abfrage, damit es in Strapi v5 funktioniert
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email },
        select: ['id', 'username', 'email', 'confirmed', 'blocked', 'documentId'],
      });

      if (!user) {
        // Mit createUserIfNotExists-Option kann die API weiterhin true zurückgeben
        if (settings && settings.createUserIfNotExists) {
          return { 
            exists: false, 
            canBeCreated: true,
            autoCreationEnabled: true
          };
        }
        
        return {
          exists: false,
          canBeCreated: false,
          autoCreationEnabled: false
        };
      }

      // Sicheres Benutzerobjekt ohne sensible Daten
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        documentId: user.documentId || null,
        exists: true
      };
    } catch (error) {
      console.error("Error finding user by email:", error);
      ctx.throw(500, error);
    }
  },

  /**
   * Validiert eine E-Mail (Alias für Frontend-Aufrufe)
   * @param {Object} ctx - The request context
   */
  async validateEmail(ctx) {
    return this.findUserByEmail(ctx);
  },

  /**
   * Ban an IP address
   * @param {Object} ctx - The request context
   */
  async banIP(ctx) {
    try {
      const { data } = ctx.request.body;
      
      if (!data || !data.ip) {
        return ctx.badRequest('IP address is required');
      }

      const ipAddress = data.ip;
      
      // Get plugin store to save banned IPs
      const pluginStore = strapi.store({
        type: 'plugin',
        name: 'magic-link',
      });
      
      // Get current banned IPs or initialize empty array
      const bannedIPs = (await pluginStore.get({ key: 'banned_ips' })) || { ips: [] };
      
      // Add new IP to the list if not already present
      if (!bannedIPs.ips.includes(ipAddress)) {
        bannedIPs.ips.push(ipAddress);
        
        // Save updated banned IPs list
        await pluginStore.set({ key: 'banned_ips', value: bannedIPs });
        
        // Deactivate all tokens associated with this IP
        await strapi.db.query('plugin::magic-link.token').updateMany({
          where: { ip_address: ipAddress },
          data: { is_active: false },
        });
      }
      
      return { success: true, message: `IP ${ipAddress} has been banned` };
    } catch (error) {
      strapi.log.error('Error banning IP:', error);
      ctx.throw(500, error);
    }
  },

  /**
   * Ruft die Liste der gesperrten IP-Adressen ab
   * @param {Object} ctx - The request context
   */
  async getBannedIPs(ctx) {
    try {
      // Get plugin store to retrieve banned IPs
      const pluginStore = strapi.store({
        type: 'plugin',
        name: 'magic-link',
      });
      
      // Get current banned IPs or initialize empty array
      const bannedIPs = (await pluginStore.get({ key: 'banned_ips' })) || { ips: [] };
      
      return bannedIPs;
    } catch (error) {
      strapi.log.error('Error fetching banned IPs:', error);
      ctx.throw(500, error);
    }
  },

  /**
   * Entsperrt eine IP-Adresse
   * @param {Object} ctx - The request context
   */
  async unbanIP(ctx) {
    try {
      const { data } = ctx.request.body;
      
      if (!data || !data.ip) {
        return ctx.badRequest('IP address is required');
      }

      const ipAddress = data.ip;
      
      // Get plugin store
      const pluginStore = strapi.store({
        type: 'plugin',
        name: 'magic-link',
      });
      
      // Get current banned IPs
      const bannedIPs = (await pluginStore.get({ key: 'banned_ips' })) || { ips: [] };
      
      // Remove IP from the banned list
      bannedIPs.ips = bannedIPs.ips.filter(ip => ip !== ipAddress);
      
      // Save updated banned IPs list
      await pluginStore.set({ key: 'banned_ips', value: bannedIPs });
      
      return { success: true, message: `IP ${ipAddress} has been unbanned` };
    } catch (error) {
      strapi.log.error('Error unbanning IP:', error);
      ctx.throw(500, error);
    }
  },

  /**
   * Berechnet einen Sicherheitswert basierend auf verschiedenen Plugin-Metriken
   * @returns {Promise<number>} Sicherheitswert zwischen 0 und 100
   */
  async calculateSecurityScore() {
    try {
      let score = 0;
      const maxScore = 100;
      
      // Hol die Plugin-Einstellungen
      const pluginStore = strapi.store({
        type: 'plugin',
        name: 'magic-link',
      });
      
      const settings = (await pluginStore.get({ key: 'settings' })) || {};
      
      // 1. Bewerte Token-Lebensdauer: max. 20 Punkte
      // (Kürzere Lebensdauer ist sicherer)
      let tokenLifetimePoints = 0;
      const tokenLifetime = settings.token_lifetime || 24; // Standardwert: 24 Stunden
      if (tokenLifetime <= 1) tokenLifetimePoints = 20; // 1 Stunde oder weniger
      else if (tokenLifetime <= 6) tokenLifetimePoints = 15; // 6 Stunden oder weniger
      else if (tokenLifetime <= 12) tokenLifetimePoints = 10; // 12 Stunden oder weniger
      else if (tokenLifetime <= 24) tokenLifetimePoints = 5; // 24 Stunden oder weniger
      
      // 2. Bewerte JWT-Lebensdauer: max. 20 Punkte
      let jwtLifetimePoints = 0;
      const jwtLifetime = settings.jwt_token_expires_in || '30d';
      const jwtDays = jwtLifetime.endsWith('d') ? parseInt(jwtLifetime) : 
                     jwtLifetime.endsWith('h') ? parseInt(jwtLifetime) / 24 : 30;
      
      if (jwtDays <= 1) jwtLifetimePoints = 20; // 1 Tag oder weniger
      else if (jwtDays <= 7) jwtLifetimePoints = 15; // 1 Woche oder weniger
      else if (jwtDays <= 14) jwtLifetimePoints = 10; // 2 Wochen oder weniger
      else if (jwtDays <= 30) jwtLifetimePoints = 5; // 1 Monat oder weniger
      
      // 3. Bewerte Sicherheitseinstellungen: max. 30 Punkte
      let configPoints = 0;
      
      // Ist das Auto-Create-User Feature deaktiviert? (sicherer)
      // Prüfe sowohl auf den neuen als auch auf den alten Namen für Abwärtskompatibilität
      if (settings.createUserIfNotExists === false && settings.create_new_user === false) configPoints += 10;
      
      // Ist das Email-Send Feature aktiviert? (sicherer)
      if (settings.enabled === true) configPoints += 5;
      
      // Ist Remember Me deaktiviert? (sicherer)
      if (settings.remember_me === false) configPoints += 5;
      
      // Ist stays_valid deaktiviert? (sicherer)
      if (settings.stays_valid === false) configPoints += 10;
      
      // 4. Bewerte Token-Status: max. 15 Punkte
      let tokenStatusPoints = 0;
      
      // Hole alle Tokens
      const tokens = await strapi.db.query('plugin::magic-link.token').findMany({});
      
      // Berechne Verhältnis von aktiven zu inaktiven Tokens
      const activeTokens = tokens.filter(token => token.is_active).length;
      const inactiveTokens = tokens.filter(token => !token.is_active).length;
      const tokenRatio = tokens.length > 0 ? inactiveTokens / tokens.length : 0;
      
      // Bewerte basierend auf dem Verhältnis (mehr inaktive = höhere Sicherheit)
      if (tokenRatio >= 0.8) tokenStatusPoints = 15;
      else if (tokenRatio >= 0.6) tokenStatusPoints = 10;
      else if (tokenRatio >= 0.4) tokenStatusPoints = 5;
      
      // 5. Bewerte gebannte IPs: max. 15 Punkte
      let bannedIPsPoints = 0;
      
      // Hole gebannte IPs
      const bannedIPsData = (await pluginStore.get({ key: 'banned_ips' })) || { ips: [] };
      const bannedIPsCount = bannedIPsData.ips?.length || 0;
      
      // Bewerte basierend auf Anzahl der gebannten IPs
      if (bannedIPsCount >= 10) bannedIPsPoints = 15;
      else if (bannedIPsCount >= 5) bannedIPsPoints = 10;
      else if (bannedIPsCount >= 1) bannedIPsPoints = 5;
      
      // Gesamtpunktzahl berechnen
      score = tokenLifetimePoints + jwtLifetimePoints + configPoints + tokenStatusPoints + bannedIPsPoints;
      
      // Stelle sicher, dass der Score im Bereich 0-100 liegt
      return Math.min(Math.max(score, 0), maxScore);
    } catch (error) {
      console.error('Fehler bei der Berechnung des Sicherheitswerts:', error);
      return 85; // Fallback auf den Standardwert
    }
  },

  /**
   * Get the security score
   * @param {Object} ctx - The request context
   */
  async getSecurityScore(ctx) {
    try {
      const score = await this.calculateSecurityScore();
      return { score };
    } catch (error) {
      ctx.throw(500, error);
    }
  },
}; 