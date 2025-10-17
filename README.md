# Magic Link - Passwordless Authentication for Strapi v5

Secure passwordless authentication for Strapi using email-based magic links. No passwords required.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://badge.fury.io/js/strapi-plugin-magic-link-v5.svg)](https://www.npmjs.com/package/strapi-plugin-magic-link-v5)

---

## 📜 License

This plugin is licensed under the **MIT License** - free for everyone to use!

### What you CAN do:
- ✅ Use the plugin freely (personal & commercial)
- ✅ View and study the source code
- ✅ Report issues and contribute improvements
- ✅ Deploy in production without fees
- ✅ Integrate in your commercial projects

### What you CANNOT do:
- ❌ Remove or bypass the license validation system
- ❌ Modify `license-guard.js` or license-related endpoints
- ❌ Disable license activation requirements

**Important:** The license validation system must remain intact and functional. This ensures quality, support, and continued development. Users must activate the plugin (free) through the admin interface.

📄 See [LICENSE](./LICENSE) for full terms

---

## ✨ Features

### Core Authentication
- 🔐 **Passwordless Login** - Users log in via secure email links
- 🎫 **Magic Link Tokens** - Cryptographically secure, time-limited tokens
- 🔑 **JWT Session Management** - Monitor and manage active user sessions
- 👤 **Auto User Creation** - Optionally create users automatically on first login
- 🌍 **Multi-language Support** - English and German translations included

### Security & Control
- 🛡️ **IP Banning** - Block suspicious IP addresses
- 🔒 **Session Revocation** - Instantly revoke any active JWT session
- ⏰ **Token Expiration** - Configurable expiration periods
- 🎯 **Login Attempt Limiting** - Prevent brute force attacks
- 📊 **Security Score** - Real-time security configuration assessment
- 📝 **Login Info Tracking** - Store IP addresses and user agents for audit

### Admin Interface
- 📱 **Modern Dashboard** - Beautiful statistics and monitoring interface
- 🎨 **Professional Token Management** - Create, extend, and manage tokens
- 🔍 **Search & Filter** - Find tokens and sessions quickly
- 📄 **Pagination** - Handle large datasets efficiently
- 🎭 **Bulk Operations** - Select and manage multiple tokens at once
- 🌐 **License Management** - Built-in license activation interface

### Customization
- ✉️ **Email Templates** - Customize HTML and plain text email templates
- 🎨 **Template Variables** - Use `<%= URL %>` and `<%= CODE %>` placeholders
- ⚙️ **Flexible Configuration** - Configure via admin panel
- 🔄 **Token Reusability** - Choose between one-time or reusable tokens
- 📧 **Email Designer Support** - Integrates with Email Designer 5 plugin

---

## 📋 Prerequisites

This plugin requires a **configured email provider** to send magic link emails.

### Email Provider Setup

**Option 1: Nodemailer (Recommended)**

Install the Strapi email plugin:

```bash
npm install @strapi/provider-email-nodemailer
```

Configure in `config/plugins.js`:

```javascript
module.exports = ({ env }) => ({
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp.gmail.com'),
        port: env('SMTP_PORT', 587),
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
      },
      settings: {
        defaultFrom: env('SMTP_DEFAULT_FROM', 'noreply@example.com'),
        defaultReplyTo: env('SMTP_DEFAULT_REPLY_TO', 'support@example.com'),
      },
    },
  },
});
```

**Option 2: Other Email Providers**

You can use any Strapi-compatible email provider:
- SendGrid
- Mailgun  
- Amazon SES
- Postmark
- Any SMTP service

See [Strapi Email Documentation](https://docs.strapi.io/dev-docs/plugins/email) for details.

### Email Designer 5 Integration (Optional)

This plugin is **fully compatible** with [Strapi Email Designer 5](https://www.npmjs.com/package/strapi-plugin-email-designer-5)!

```bash
# Install Email Designer 5
npm install strapi-plugin-email-designer-5
```

Once installed, you can:
- ✅ Create beautiful email templates in the visual designer
- ✅ Use template variables: `magicLink`, `token`, `user`, `expiresAt`
- ✅ Enable in Settings → Magic Link → Email Settings

---

## 🚀 Installation

```bash
# Using npm
npm install strapi-plugin-magic-link-v5

# Using yarn
yarn add strapi-plugin-magic-link-v5

# Using pnpm
pnpm add strapi-plugin-magic-link-v5
```

After installation, **restart your Strapi server**. The plugin will appear in your admin panel.

---

## 🎯 Quick Start

### 1️⃣ Activate License

After installing, navigate to **Settings → Magic Link → License** in your Strapi admin panel and activate the plugin (free).

### 2️⃣ Configure Settings

Go to **Settings → Magic Link → Settings** and configure:

```javascript
{
  "enabled": true,
  "createUserIfNotExists": true,    // Auto-create users
  "expire_period": 3600,             // Token valid for 1 hour
  "token_length": 20,                // Token security level
  "from_email": "noreply@yourdomain.com",
  "from_name": "Your App",
  "object": "Your Magic Link Login",
  "confirmationUrl": "https://yourdomain.com/auth/callback"
}
```

### 3️⃣ Frontend Implementation

**Request a magic link:**
```javascript
const response = await fetch('/api/magic-link/send-link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    context: { redirectTo: '/dashboard' }  // Optional
  })
});
```

**Verify token on callback page:**
```javascript
const urlParams = new URLSearchParams(window.location.search);
const loginToken = urlParams.get('loginToken');

if (loginToken) {
  const response = await fetch(`/api/magic-link/login?loginToken=${loginToken}`);
  const { jwt, user } = await response.json();
  
  // Store JWT for authenticated requests
  localStorage.setItem('token', jwt);
  
  // Redirect to dashboard
  window.location.href = '/dashboard';
}
```

---

## 📡 API Endpoints

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/magic-link/send-link` | Generate and send magic link to email |
| `GET` | `/api/magic-link/login?loginToken=xxx` | Authenticate user with token |

### Admin Endpoints (Admin Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/magic-link/tokens` | List all tokens |
| `POST` | `/magic-link/tokens` | Create a new token |
| `DELETE` | `/magic-link/tokens/:id` | Delete a token |
| `POST` | `/magic-link/tokens/:id/block` | Block a token |
| `POST` | `/magic-link/tokens/:id/extend` | Extend token validity |
| `GET` | `/magic-link/jwt-sessions` | List active JWT sessions |
| `POST` | `/magic-link/revoke-jwt` | Revoke a JWT session |
| `POST` | `/magic-link/ban-ip` | Ban an IP address |
| `GET` | `/magic-link/banned-ips` | List banned IPs |

---

## ⚙️ Configuration

### General Settings
- `enabled` - Enable/disable magic link authentication
- `createUserIfNotExists` - Auto-create users on first login
- `expire_period` - Token expiration time (seconds)
- `token_length` - Security level (20-40 recommended)
- `stays_valid` - Token reusable after first use
- `max_login_attempts` - Limit failed login attempts

### Email Settings
- `from_name` - Sender name
- `from_email` - Sender email address
- `response_email` - Reply-to email
- `object` - Email subject line
- `message_html` - HTML email template
- `message_text` - Plain text email template

### JWT Settings
- `use_jwt_token` - Use JWT for authentication
- `jwt_token_expires_in` - JWT validity period (e.g., '30d', '7d')
- `store_login_info` - Track IP and user agent

### Advanced
- `user_creation_strategy` - `email` | `emailUsername` | `manual`
- `verify_email` - Require email verification
- `callback_url` - Post-login redirect URL

---

## 🎨 Email Templates

Customize your magic link emails using template variables:

```html
<!-- HTML Template -->
<h1>Welcome!</h1>
<p>Click to login:</p>
<a href="<%= URL %>?loginToken=<%= CODE %>">
  Login to Your Account
</a>
```

**Available Variables:**
- `<%= URL %>` - Your confirmation URL
- `<%= CODE %>` - The generated token

---

## 🔒 Security Features

- **Token Expiration** - Configurable expiration periods
- **One-time Tokens** - Optional single-use tokens
- **IP Tracking** - Monitor login locations
- **IP Banning** - Block suspicious addresses
- **JWT Blacklist** - Revoke compromised sessions
- **Login Attempt Limiting** - Prevent brute force
- **User Agent Tracking** - Device fingerprinting

---

## 🎯 Use Cases

- **SaaS Applications** - Simplify user onboarding
- **Customer Portals** - Secure, password-free access
- **Multi-tenant Systems** - Easy user management
- **Mobile Apps** - Seamless authentication flow
- **Content Platforms** - Reduce password fatigue

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Emails not sending | Check Strapi email provider configuration |
| Token invalid errors | Verify token hasn't expired |
| User not found | Enable `createUserIfNotExists` setting |
| License activation fails | Check network connectivity |
| npm install fails | Use `npm install --legacy-peer-deps` |

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Commit Convention:** Follow [Conventional Commits](https://www.conventionalcommits.org/)
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks

---

## 📝 Changelog

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) for automated versioning and releases. See [GitHub Releases](https://github.com/begservice/strapi-plugin-magic-link-v5/releases) for version history.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**Important:** While the code is open source, the license validation system must remain intact. This ensures quality, security, and continued development of the plugin.

---

## 💬 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/begservice/strapi-plugin-magic-link-v5/issues)
- 📧 **Contact**: 124470865+begservice@users.noreply.github.com
- 📦 **npm**: [strapi-plugin-magic-link-v5](https://www.npmjs.com/package/strapi-plugin-magic-link-v5)

---

Made with ❤️ by [begservice](https://github.com/begservice)
