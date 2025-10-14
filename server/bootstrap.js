const getEmailSettingsDefaults = () => {
  // Get email plugin settings
  const emailConfig = strapi.config.get("plugin::email");
  const emailSettings = emailConfig?.settings || {};
  
  const defaults = {};
  
  if (emailSettings) {
    // Try to extract name from email format: "Name <email@example.com>"
    if (emailSettings.defaultFrom) {
      const nameMatch = emailSettings.defaultFrom.match(/^"?([^"<]+)"?\s*<.*>$/);
      if (nameMatch) {
        defaults.from_name = nameMatch[1].trim();
      }
      
      // Extract email from format: name <email@example.com> or just email@example.com
      const emailMatch = emailSettings.defaultFrom.match(/<([^>]+)>$/) || [null, emailSettings.defaultFrom];
      if (emailMatch && emailMatch[1]) {
        defaults.from_email = emailMatch[1].trim();
      }
    }
    
    if (emailSettings.defaultReplyTo) {
      // Extract email from format: name <email@example.com> or just email@example.com
      const replyMatch = emailSettings.defaultReplyTo.match(/<([^>]+)>$/) || [null, emailSettings.defaultReplyTo];
      if (replyMatch && replyMatch[1]) {
        defaults.response_email = replyMatch[1].trim();
      }
    }
  }
  
  // Default subject
  defaults.object = "Your Magic Link for Login";
  
  return defaults;
};

module.exports = async ({ strapi }) => {
  // Get settings from store
  const { store } = strapi.plugin('magic-link').services;
  const settings = await store.get();
  
  if (!settings || Object.keys(settings).length === 0) {
    // Initialize with default settings if none exist
    const defaults = {
      enabled: true,
      createUserIfNotExists: true,
      expire_period: 3600,
      token_length: 20,
      stays_valid: false,
      login_path: '/passwordless-login',
      user_creation_strategy: 'email',
      use_jwt_token: true,
      jwt_token_expires_in: '30d',
      store_login_info: false,
      ...getEmailSettingsDefaults(),
      message_html: `<!DOCTYPE html>
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
</html>`,
      message_text: `Hello,

You requested a magic link to log in to your account. Please click the link below to log in:

<%= URL %>?code=<%= CODE %>

If you didn't request this login link, you can safely ignore this email.

The link will expire in 1 hour.

Thanks,
The Team`
    };
    
    // Save default settings
    await store.set(defaults);
  }

  // Middleware to check for banned IPs
  strapi.server.use(async (ctx, next) => {
    const clientIP = ctx.request.ip;
    
    // Sicherer Service-Zugriff mit Null-Check
    const magicLinkPlugin = strapi.plugin('magic-link');
    if (!magicLinkPlugin || !magicLinkPlugin.service) {
      return next();
    }
    
    const magicLink = magicLinkPlugin.service('magic-link');
    if (magicLink && magicLink.isIPBanned && (await magicLink.isIPBanned(clientIP))) {
      return ctx.forbidden('Access denied: Your IP has been banned');
    }
    
    await next();
  });

  // Middleware to check for revoked JWT tokens
  strapi.server.use(async (ctx, next) => {
    const prefix = 'bearer ';
    const authorization = ctx.request?.headers?.authorization?.toLowerCase() || '';
    
    if (authorization.startsWith(prefix)) {
      const token = authorization.substring(prefix.length);
      
      // Sicherer Service-Zugriff mit Null-Check
      const magicLinkPlugin = strapi.plugin('magic-link');
      if (!magicLinkPlugin || !magicLinkPlugin.service) {
        return next();
      }
      
      const magicLink = magicLinkPlugin.service('magic-link');
      if (magicLink && magicLink.isJwtTokenBlocked && (await magicLink.isJwtTokenBlocked(token))) {
        return ctx.unauthorized('Token has been revoked');
      }
    }
    
    await next();
  });
};
