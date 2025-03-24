'use strict';

module.exports = {
  async getSettings(ctx) {
    try {
      const pluginStore = strapi.store({
        environment: '',
        type: 'plugin',
        name: 'magic-link',
      });
      
      const settings = await pluginStore.get({ key: 'settings' });
      
      // Stelle sicher, dass alle Boolean-Werte korrekt formatiert sind
      const processedSettings = { ...settings };
      
      // Entferne verschachtelte settings-Objekte, falls vorhanden
      if (processedSettings && processedSettings.settings) {
        delete processedSettings.settings;
      }
      
      // Verarbeite alle Eigenschaften, die als Boolean behandelt werden sollten
      const booleanFields = [
        'enabled', 'createUserIfNotExists', 'stays_valid', 'verify_email', 
        'welcome_email', 'use_jwt_token', 'allow_magic_links_on_public_registration',
        'store_login_info', 'use_email_designer'
      ];
      
      booleanFields.forEach(field => {
        if (field in processedSettings) {
          // Konvertiere zu echten Boolean-Werten
          processedSettings[field] = !!processedSettings[field];
        }
      });
      
      // Ensure store_login_info has a value
      if (processedSettings.store_login_info === undefined) {
        processedSettings.store_login_info = true;
      }
      
      // Ensure email designer settings have values
      if (processedSettings.use_email_designer === undefined) {
        processedSettings.use_email_designer = false;
      }
      
      if (processedSettings.email_designer_template_id === undefined) {
        processedSettings.email_designer_template_id = '';
      }
      
      // Korrigiere den Login-Pfad, wenn er den alten Wert hat
      if (processedSettings.login_path === '/passwordless-login' || processedSettings.login_path === '/api/magic-link/login') {
        processedSettings.login_path = '/magic-link/login';
      }

      // Check if Email Designer plugin is installed
      const isEmailDesignerInstalled = !!strapi.plugin('email-designer-5');
      
      ctx.send({ 
        settings: processedSettings,
        emailDesignerInstalled: isEmailDesignerInstalled
      });
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  async updateSettings(ctx) {
    const { body } = ctx.request;

    try {
      // Stelle sicher, dass alle Boolean-Werte korrekt formatiert sind
      const processedBody = { ...body };
      
      // Entferne verschachtelte settings-Objekte, falls vorhanden
      if (processedBody && processedBody.settings) {
        delete processedBody.settings;
      }
      
      // Verarbeite alle Eigenschaften, die als Boolean behandelt werden sollten
      const booleanFields = [
        'enabled', 'createUserIfNotExists', 'stays_valid', 'verify_email', 
        'welcome_email', 'use_jwt_token', 'allow_magic_links_on_public_registration',
        'store_login_info', 'use_email_designer'
      ];
      
      booleanFields.forEach(field => {
        if (field in processedBody) {
          // Konvertiere verschiedene Formate zu echten Boolean-Werten
          if (typeof processedBody[field] === 'string') {
            processedBody[field] = processedBody[field] === 'true';
          } else if (typeof processedBody[field] === 'object' && processedBody[field]?.type === 'boolean') {
            processedBody[field] = !!processedBody[field].value;
          } else {
            processedBody[field] = !!processedBody[field];
          }
        }
      });
      
      // Ensure store_login_info is included in the stored settings
      if (processedBody.store_login_info === undefined) {
        processedBody.store_login_info = true;
      }
      
      const pluginStore = strapi.store({
        environment: '',
        type: 'plugin',
        name: 'magic-link',
      });
      
      await pluginStore.set({ key: 'settings', value: processedBody });
      ctx.send({ settings: processedBody });
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  async index(ctx) {
    ctx.body = { message: 'Welcome to Magic Link plugin!' };
  },

  /**
   * Setzt alle Magic Link Daten und Einstellungen zurück
   * @param {Object} ctx - Context
   */
  async resetData(ctx) {
    try {
      // Plugin Store für die Einstellungen
      const pluginStore = strapi.store({
        environment: '',
        type: 'plugin',
        name: 'magic-link',
      });

      // Standardeinstellungen definieren
      const defaultSettings = {
        enabled: true,
        createUserIfNotExists: false,
        stays_valid: false,
        expire_period: 3600,
        token_length: 20,
        max_login_attempts: 5,
        login_path: '/magic-link/login',
        confirmationUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        store_login_info: true,
        default_role: 'authenticated',
        object: 'Your Magic Link for Login',
        from_name: 'Magic Link Service',
        from_email: 'noreply@example.com',
        message_html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>Magic Link Login</title>
</head>
<body>
  <h2>Magic Link Login</h2>
  <p>Click the link below to log in:</p>
  <p><a href="<%= URL %>?loginToken=<%= CODE %>">Log in to your account</a></p>
  <p>Or use this URL: <%= URL %>?loginToken=<%= CODE %></p>
  <p>This link will expire in 1 hour.</p>
</body>
</html>`,
        message_text: `Hello,

Click the link below to log in:

<%= URL %>?loginToken=<%= CODE %>

This link will expire in 1 hour.`,
        jwt_token_expires_in: '30d'
      };

      // Einstellungen zurücksetzen
      await pluginStore.set({ key: 'settings', value: defaultSettings });

      // Alle Magic Link Tokens löschen
      await strapi.db.query('plugin::strapi-plugin-magic-link-v5.token').deleteMany({
        where: {},
      });

      // JWT Sessions löschen
      try {
        await pluginStore.delete({ key: 'jwt_sessions' });
      } catch (error) {
        console.error('Fehler beim Löschen der JWT Sessions:', error);
      }

      // Gebannte IPs zurücksetzen
      try {
        await pluginStore.set({ key: 'banned_ips', value: { ips: [] } });
      } catch (error) {
        console.error('Fehler beim Zurücksetzen der gebannten IPs:', error);
      }

      // Gesperrte JWT-Tokens zurücksetzen
      try {
        await pluginStore.set({ key: 'blocked_jwt_tokens', value: { tokens: [] } });
      } catch (error) {
        console.error('Fehler beim Zurücksetzen der gesperrten JWT-Tokens:', error);
      }

      // Erfolgreiche Antwort senden
      ctx.send({
        success: true,
        message: 'Alle Magic Link Daten wurden zurückgesetzt.',
      });
    } catch (error) {
      console.error('Fehler beim Zurücksetzen der Magic Link Daten:', error);
      ctx.throw(500, error);
    }
  },
};
