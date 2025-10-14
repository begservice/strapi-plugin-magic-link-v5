# Security & License Protection

## License Enforcement

This software includes multiple layers of license protection:

### 1. Backend License Check
- API endpoints are protected by `license-check` policy
- All requests are validated against active license
- Invalid/expired licenses are rejected with 401 status

### 2. Frontend License Guard
- Admin UI displays activation modal without valid license
- Prevents unauthorized UI access
- Requires license activation before use

### 3. License Verification
- License keys are validated against central license database
- Regular "ping" mechanism ensures license is active
- Offline grace period for temporary network issues

## Anti-Piracy Measures

### Current Protection:
1. **License Key Validation**: Server-side verification
2. **Device Binding**: License tied to specific server instances
3. **Online Checks**: Regular validation against license server
4. **IP Tracking**: Monitor and limit license usage by IP
5. **Audit Logging**: All license operations are logged

### Additional Recommendations:

#### Code Obfuscation (Optional)
Consider obfuscating critical parts of the code:
```bash
npm install javascript-obfuscator --save-dev
```

#### API Key Protection
Never commit license server API credentials to git:
```bash
# Add to .env
LICENSE_SERVER_URL=https://your-license-server.com
LICENSE_API_KEY=your-secret-key
```

#### Monitoring
Set up monitoring for:
- Unusual license activation patterns
- Multiple IPs using same license
- Attempts to bypass license checks

## Reporting License Violations

If you discover unauthorized use of this software:

**Email:** [Your Email]
**Subject:** License Violation Report

Include:
- URL or location where unauthorized use was found
- Screenshots/evidence
- Any relevant information

We take license violations seriously and will pursue legal action when necessary.

## Legal Notice

Unauthorized use, copying, or distribution of this software constitutes:
- Copyright infringement
- Breach of software license agreement
- Potential criminal violation under applicable laws

Violators will be prosecuted to the fullest extent of the law.

---

**Last Updated:** 2025-01-13

