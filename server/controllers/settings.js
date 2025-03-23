const { getService } = require('../utils');

module.exports = {
  async get(ctx) {
    const { user } = ctx.state;
    if (!user.roles.find((role) => role.code === 'strapi-super-admin')) {
      return ctx.forbidden("You don't have permissions to access this resource");
    }

    try {
      // Get settings from database
      const pluginStore = getService('store');
      const settings = await pluginStore.get();

      // Get email plugin settings
      const emailConfig = strapi.config.get('plugin.email');
      const emailSettings = emailConfig?.settings || {};

      // Merge with email plugin settings if values are not set
      if (emailSettings) {
        if (!settings.from_name && emailSettings.defaultFrom) {
          // Try to extract name from email format: "Name <email@example.com>"
          const nameMatch = emailSettings.defaultFrom.match(/^"?([^"<]+)"?\s*<.*>$/);
          if (nameMatch) {
            settings.from_name = nameMatch[1].trim();
          }
        }

        if (!settings.from_email && emailSettings.defaultFrom) {
          // Extract email from format: name <email@example.com> or just email@example.com
          const emailMatch = emailSettings.defaultFrom.match(/<([^>]+)>$/) || [null, emailSettings.defaultFrom];
          if (emailMatch && emailMatch[1]) {
            settings.from_email = emailMatch[1].trim();
          }
        }

        if (!settings.response_email && emailSettings.defaultReplyTo) {
          // Extract email from format: name <email@example.com> or just email@example.com
          const replyMatch = emailSettings.defaultReplyTo.match(/<([^>]+)>$/) || [null, emailSettings.defaultReplyTo];
          if (replyMatch && replyMatch[1]) {
            settings.response_email = replyMatch[1].trim();
          }
        }
      }

      // Set default subject if not set
      if (!settings.object) {
        settings.object = "Your Magic Link for Login";
      }
      
      // Set default HTML template if not set
      if (!settings.message_html) {
        settings.message_html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; 
              text-decoration: none; border-radius: 5px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Login to Your Account</h1>
    <p>Hello,</p>
    <p>You requested a magic link to log in to your account. Please click the button below to log in:</p>
    <p><a href="<%= URL %>?code=<%= CODE %>" class="button">Login to Your Account</a></p>
    <p>If you didn't request this login link, you can safely ignore this email.</p>
    <p>The link will expire in 1 hour.</p>
    <p>Thanks,<br>The Team</p>
  </div>
</body>
</html>`;
      }
      
      // Set default text template if not set
      if (!settings.message_text) {
        settings.message_text = `Hello,

You requested a magic link to log in to your account. Please click the link below to log in:

<%= URL %>?code=<%= CODE %>

If you didn't request this login link, you can safely ignore this email.

The link will expire in 1 hour.

Thanks,
The Team`;
      }

      return ctx.send({
        data: settings,
      });
    } catch (err) {
      strapi.log.error(err);
      return ctx.badRequest('Could not get settings');
    }
  },

  async set(ctx) {
    const { user } = ctx.state;
    if (!user.roles.find((role) => role.code === 'strapi-super-admin')) {
      return ctx.forbidden("You don't have permissions to access this resource");
    }

    const settings = ctx.request.body;

    try {
      const pluginStore = getService('store');
      await pluginStore.set(settings);

      return ctx.send({
        data: settings,
      });
    } catch (err) {
      strapi.log.error(err);
      return ctx.badRequest('Could not update settings');
    }
  },
}; 