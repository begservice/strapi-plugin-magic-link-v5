# Magic Link License Guard

Der License Guard schützt und verwaltet das Magic Link Plugin über das bestehende License API System.

## 🚀 Features

- ✅ **Automatische Lizenz-Initialisierung** beim Plugin-Start
- ✅ **Auto-Ping alle 15 Minuten** für Online-Tracking
- ✅ **Geräteerkennung** (DeviceID, DeviceName, IP, UserAgent)
- ✅ **Grace Period Support** (24h Offline-Nutzung)
- ✅ **Admin-Endpoints** für Lizenzverwaltung
- ✅ **Automatisches Cleanup** beim Plugin-Stop

## 📋 Wie es funktioniert

### 1. Beim Plugin-Start

```
Plugin startet → License Guard initialisiert
                ↓
Lizenzschlüssel im Store? 
    ↓ JA                    ↓ NEIN
Verifizieren             Demo-Mode
    ↓                        ↓
Gültig?                   Warnung anzeigen
    ↓ JA      ↓ NEIN
Ping starten   Demo-Mode
```

### 2. Automatisches Pinging

Alle 15 Minuten sendet der Guard automatisch:
```json
POST /api/licenses/ping
{
  "licenseKey": "A1B2-C3D4-E5F6-G7H8"
}
```

Dies aktualisiert:
- `lastPingAt` - Aktueller Zeitstempel
- `lastActiveAt` - Aktivitäts-Tracker
- `isOnline` - Online-Status basierend auf Grace Period

## 🎯 Verwendung

### Option 1: Lizenz über API erstellen

```bash
curl -X POST http://localhost:1337/api/licenses/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "deviceName": "Server-01",
    "deviceId": "device-abc-123",
    "ipAddress": "192.168.1.100",
    "userAgent": "Strapi/5.11.2"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "License created successfully",
  "data": {
    "id": 1,
    "licenseKey": "A1B2-C3D4-E5F6-G7H8",
    "email": "admin@example.com",
    "isActive": true,
    ...
  }
}
```

Der License Guard erkennt automatisch die neue Lizenz beim nächsten Start!

### Option 2: Auto-Create über Admin-Endpoint

```bash
curl -X POST http://localhost:1337/magic-link/license/auto-create
```

Erstellt automatisch eine Lizenz mit Standard-Daten und aktiviert sie sofort.

### Option 3: Programmatisch erstellen

```javascript
// Im Strapi-Code oder Terminal
await strapi
  .plugin('magic-link')
  .service('license-guard')
  .autoCreateLicense('your@email.com', 'First', 'Last');
```

## 📡 Admin-Endpoints

Alle Endpoints sind unter `/magic-link/...` verfügbar:

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/license/status` | GET | Aktueller Lizenz-Status |
| `/license/create` | POST | Lizenz erstellen & aktivieren |
| `/license/auto-create` | POST | Auto-Lizenz mit Defaults |
| `/license/ping` | POST | Manueller Ping |
| `/license/stats` | GET | Online-Statistiken |
| `/license/deactivate` | POST | Lizenz deaktivieren |

### Beispiele

**Status abfragen:**
```bash
curl http://localhost:1337/magic-link/license/status
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "data": {
    "licenseKey": "A1B2-C3D4-E5F6-G7H8",
    "isActive": true,
    "isExpired": false,
    "isOnline": true,
    "expiresAt": "2026-10-13T10:00:00.000Z",
    "lastPingAt": "2025-10-13T21:00:00.000Z",
    "deviceName": "MacBook-Pro.local",
    "features": {
      "premium": true,
      "advanced": false,
      "enterprise": false,
      "custom": false
    },
    "maxDevices": 1,
    "currentDevices": 1
  }
}
```

**Manuelle Ping:**
```bash
curl -X POST http://localhost:1337/magic-link/license/ping
```

**Online-Statistiken:**
```bash
curl http://localhost:1337/magic-link/license/stats
```

## 🔧 Gesammelte Daten

Der License Guard sammelt automatisch:

### Device Information
- **DeviceID**: SHA256-Hash von MAC-Adressen + Hostname
- **DeviceName**: System-Hostname (z.B. "MacBook-Pro.local")
- **IP Address**: Server-IP (erste nicht-interne IPv4)
- **User Agent**: "Strapi/{version} Node/{version} {platform}/{release}"

### Beispiel gesammelte Daten:
```javascript
{
  deviceId: "a3f8e92c1d4b5e6f7a8b9c0d1e2f3a4b",
  deviceName: "MacBook-Pro.local",
  ipAddress: "192.168.1.100",
  userAgent: "Strapi/5.11.2 Node/v20.11.0 darwin/23.0.0"
}
```

## 📊 Console Output

Beim Plugin-Start siehst du eine dieser Meldungen:

### ✅ Lizenz aktiv:
```
╔════════════════════════════════════════════════════════════════╗
║  ✅ MAGIC LINK PLUGIN LICENSE ACTIVE                           ║
║                                                                ║
║  License: A1B2-C3D4-E5F6-G7H8                                  ║
║  User: Max Mustermann                                          ║
║  Email: max@example.com                                        ║
║                                                                ║
║  🔄 Auto-pinging every 15 minutes                              ║
╚════════════════════════════════════════════════════════════════╝
```

### ⚠️ Demo-Mode:
```
╔════════════════════════════════════════════════════════════════╗
║  ⚠️  MAGIC LINK PLUGIN RUNNING IN DEMO MODE                   ║
║                                                                ║
║  To activate, create a license:                                ║
║  POST http://localhost:1337/api/licenses/create                ║
║                                                                ║
║  Or auto-create with:                                          ║
║  strapi.plugin("magic-link").service("license-guard")          ║
║         .autoCreateLicense("your@email.com", "First", "Last")  ║
╚════════════════════════════════════════════════════════════════╝
```

## 🔄 Lifecycle

### Bootstrap (Plugin Start)
1. License Guard Service wird geladen
2. Nach 3 Sekunden: Initialize()
3. Prüfe auf gespeicherten Lizenzschlüssel
4. Verifiziere Lizenz
5. Starte Auto-Ping (alle 15 Min)

### Destroy (Plugin Stop)
1. Stoppe Ping-Interval
2. Cleanup-Log

## 💻 Integration in dein Plugin

### Lizenz-Status im Admin-Panel anzeigen

Erstelle eine Settings-Seite mit Lizenz-Info:

```javascript
// In deiner Settings-Component
const { data: licenseStatus } = await get('/magic-link/license/status');

if (licenseStatus.valid) {
  console.log('✅ License active:', licenseStatus.data.licenseKey);
  console.log('Features:', licenseStatus.data.features);
} else {
  console.log('⚠️ Demo mode or invalid license');
}
```

### Lizenz erstellen aus dem Admin-Panel

```javascript
const createLicense = async () => {
  const response = await post('/magic-link/license/create', {
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
  });

  if (response.data.success) {
    console.log('License created:', response.data.data.licenseKey);
  }
};
```

## 🔐 Sicherheit

- ✅ **DeviceID ist persistent** - Basiert auf Hardware
- ✅ **Eindeutige Identifikation** - SHA256-Hash
- ✅ **Keine Speicherung sensibler Daten** - Nur Hashes
- ✅ **GDPR-konform** - User-Daten anonymisiert

## 🛠 Troubleshooting

### Plugin startet im Demo-Mode

**Ursache:** Keine Lizenz gefunden oder Lizenz ungültig

**Lösung:**
```bash
# Option 1: Auto-Create
curl -X POST http://localhost:1337/magic-link/license/auto-create

# Option 2: Manuell über License API
curl -X POST http://localhost:1337/api/licenses/create \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@localhost","firstName":"Admin","lastName":"User"}'

# Option 3: Im Strapi Terminal
await strapi.plugin('magic-link').service('license-guard')
  .autoCreateLicense('admin@example.com', 'Admin', 'User');
```

### Pinging funktioniert nicht

**Prüfen:**
```bash
# Manueller Ping
curl -X POST http://localhost:1337/magic-link/license/ping

# Status prüfen
curl http://localhost:1337/magic-link/license/status
```

### Lizenz als "offline" markiert

- Grace Period ist abgelaufen (>24h kein Ping)
- Pinging wurde gestoppt
- Netzwerk-Probleme

**Lösung:** Einmal pingen → `isOnline` wird wieder auf `true` gesetzt

## 📚 Logs

Der License Guard loggt:

```
[INFO] 🔐 Initializing License Guard...
[INFO] 📄 Found existing license key: A1B2-C3D4-E5F6-G7H8
[INFO] ✅ License is valid and active
[INFO] 📡 Started pinging license every 15 minutes
[DEBUG] 📡 License ping successful: A1B2-C3D4-E5F6-G7H8
[INFO] 🛑 License pinging stopped
```

## 🎉 Fertig!

Der License Guard läuft nun automatisch im Hintergrund:
- ✅ Verifiziert beim Start
- ✅ Pingt alle 15 Minuten
- ✅ Tracked Online-Status
- ✅ Bereit für Production

Für weitere Informationen siehe:
- `/src/api/license/README.md` - License API Dokumentation
- `/src/api/license/TRACKING.md` - Tracking-Details
- `/src/api/license/SUMMARY.md` - Zusammenfassung

