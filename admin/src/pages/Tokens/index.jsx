import React, { useState, useEffect } from 'react';
import { 
  Main, 
  Typography, 
  Box, 
  Flex, 
  Button, 
  Loader, 
  EmptyStateLayout,
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  Badge,
  Divider,
  Link,
  Tooltip,
  Checkbox,
  TextInput,
  Modal,
  Field,
  useField,
} from '@strapi/design-system';
import { useFetchClient, useNotification, useFetchClient as useFetchClientHelper } from '@strapi/strapi/admin';
import { 
  Information, 
  ArrowLeft, 
  Plus, 
  Cross, 
  CheckCircle,
  ArrowRight, 
  Filter, 
  Key, 
  Globe, 
  Mail,
  WarningCircle,
  Lock,
  Calendar,
  Clock,
  Pencil,
  Shield,
  Trash,
  Check,
} from '@strapi/icons';

const TokensPage = () => {
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { del } = useFetchClientHelper();
  
  // States
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [jwtSessions, setJwtSessions] = useState([]);
  const [isLoadingJwt, setIsLoadingJwt] = useState(true);
  const [activeTab, setActiveTab] = useState('magic-links'); // 'magic-links' oder 'jwt-sessions'
  const [showRevokedTokens, setShowRevokedTokens] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [showIPBanModal, setShowIPBanModal] = useState(false);
  const [ipToBan, setIpToBan] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [emailToCreate, setEmailToCreate] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateTokenModal, setShowCreateTokenModal] = useState(false);
  const [newTokenEmail, setNewTokenEmail] = useState('');
  const [newTokenExpireDays, setNewTokenExpireDays] = useState('30');
  const [showTokenDetailModal, setShowTokenDetailModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [extensionDays, setExtensionDays] = useState(7); // Standardwert für Verlängerung: 7 Tage
  const [sendEmail, setSendEmail] = useState(true); // Flag für E-Mail-Versand
  const [jsonContext, setJsonContext] = useState(''); // JSON Kontext
  const [emailValidationStatus, setEmailValidationStatus] = useState(null); // Status der E-Mail-Validierung
  const [isValidatingEmail, setIsValidatingEmail] = useState(false); // Loading-Status für E-Mail-Validierung
  const [bannedIPs, setBannedIPs] = useState([]);
  const [isLoadingBannedIPs, setIsLoadingBannedIPs] = useState(false);
  const [ipToUnban, setIpToUnban] = useState('');
  const [showIPUnbanModal, setShowIPUnbanModal] = useState(false);

  // Lade Magic Link Tokens
  const fetchTokens = async () => {
    setIsLoading(true);
    try {
      const response = await get(`/strapi-plugin-magic-link-v5/tokens`);
      // Die Struktur der Antwort hat sich geändert, prüfe auf response.data.data
      if (response && response.data) {
        // Wenn response.data ein Objekt mit data-Eigenschaft ist (neue Struktur)
        if (response.data.data) {
          setTokens(response.data.data);
        } else {
          // Alte Struktur, wo response.data direkt das Array ist
          setTokens(response.data);
        }
      } else {
        setTokens([]);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Tokens:", error);
      setTokens([]); // Im Fehlerfall leeres Array setzen
      toggleNotification({
        type: 'warning',
        message: 'Fehler beim Laden der Magic Link Tokens'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Lade JWT Sessions
  const fetchJwtSessions = async () => {
    setIsLoadingJwt(true);
    try {
      const response = await get(`/strapi-plugin-magic-link-v5/jwt-sessions`);
      if (response && response.data) {
        setJwtSessions(response.data);
      } else {
        // Wenn keine Daten zurückgegeben werden, leeres Array setzen
        setJwtSessions([]);
      }
    } catch (error) {
      console.error("Fehler beim Laden der JWT Sessions:", error);
      // Bei Fehlern leeres Array setzen, damit die UI nicht abstürzt
      setJwtSessions([]);
      toggleNotification({
        type: 'warning',
        message: 'Fehler beim Laden der JWT Sessions'
      });
    } finally {
      setIsLoadingJwt(false);
    }
  };

  // Lade gesperrte IPs
  const fetchBannedIPs = async () => {
    setIsLoadingBannedIPs(true);
    try {
      const response = await get(`/strapi-plugin-magic-link-v5/banned-ips`);
      if (response && response.ips) {
        setBannedIPs(response.ips);
      } else {
        setBannedIPs([]);
      }
    } catch (error) {
      console.error("Fehler beim Laden der gesperrten IPs:", error);
      setBannedIPs([]);
      toggleNotification({
        type: 'warning',
        message: 'Fehler beim Laden der gesperrten IPs'
      });
    } finally {
      setIsLoadingBannedIPs(false);
    }
  };

  // IP entsperren
  const unbanIP = async () => {
    try {
      await post(`/strapi-plugin-magic-link-v5/unban-ip`, { data: { ip: ipToUnban } });
      toggleNotification({
        type: 'success',
        message: `IP ${ipToUnban} wurde erfolgreich entsperrt`
      });
      setShowIPUnbanModal(false);
      setIpToUnban('');
      await fetchBannedIPs(); // Liste der gesperrten IPs aktualisieren
    } catch (error) {
      console.error("Fehler beim Entsperren der IP:", error);
      toggleNotification({
        type: 'warning',
        message: `Fehler beim Entsperren der IP ${ipToUnban}`
      });
    }
  };

  // Benutzer anhand der E-Mail finden
  const findUserByEmail = async (email) => {
    try {
      const response = await get(`/strapi-plugin-magic-link-v5/user-by-email?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      console.error("Fehler beim Suchen des Benutzers:", error);
      toggleNotification({
        type: 'warning',
        message: `Benutzer mit der E-Mail ${email} wurde nicht gefunden`
      });
      return null;
    }
  };

  // Navigiere zum Benutzerprofil
  const navigateToUserProfile = async (email) => {
    try {
      const user = await findUserByEmail(email);
      
      if (user) {
        // Verwende documentId falls vorhanden, ansonsten die normale ID
        const idToUse = user.documentId || user.id;
        
        // Öffne das Benutzerprofil in einem neuen Tab mit dem korrekten Pfad
        window.open(`/admin/content-manager/collection-types/plugin::users-permissions.user/${idToUse}`, '_blank');
      } else {
        toggleNotification({
          type: 'warning',
          message: `Kein Benutzer mit der E-Mail ${email} gefunden`
        });
      }
    } catch (error) {
      console.error("Fehler bei der Navigation zum Benutzerprofil:", error);
      toggleNotification({
        type: 'warning',
        message: 'Fehler bei der Navigation zum Benutzerprofil'
      });
    }
  };

  // Überprüfe, ob die E-Mail-Adresse gültig ist und ob ein Benutzer erstellt werden kann
  const validateEmail = async (email) => {
    if (!email || !email.includes('@')) {
      setEmailValidationStatus({
        valid: false,
        message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
      });
      return false;
    }

    setIsValidatingEmail(true);
    setEmailValidationStatus(null);

    try {
      // Prüfe, ob die E-Mail in der Datenbank existiert
      const user = await findUserByEmail(email);
      
      // Wenn der Benutzer existiert, ist alles in Ordnung
      if (user) {
        setEmailValidationStatus({
          valid: true,
          message: 'Benutzer gefunden. Token kann erstellt werden.'
        });
        return true;
      }

      // Wenn der Benutzer nicht existiert, müssen wir die Plugin-Einstellungen prüfen
      const settingsResponse = await get('/magic-link/settings');
      const settings = settingsResponse.data || {};
      
      // Wenn "create_new_user" aktiviert ist, kann trotzdem ein Token erstellt werden
      if (settings.create_new_user) {
        setEmailValidationStatus({
          valid: true,
          message: 'Neuer Benutzer wird beim Login erstellt.'
        });
        return true;
      } else {
        // Andernfalls ist der Passwordless Login nicht möglich
        setEmailValidationStatus({
          valid: false,
          message: 'Die E-Mail existiert nicht und die automatische Benutzererstellung ist deaktiviert.'
        });
        return false;
      }
    } catch (error) {
      console.error("Fehler bei der E-Mail-Validierung:", error);
      setEmailValidationStatus({
        valid: false,
        message: 'Fehler bei der Validierung. Bitte versuchen Sie es erneut.'
      });
      return false;
    } finally {
      setIsValidatingEmail(false);
    }
  };

  // Magic Link Token blockieren
  const blockToken = async (tokenId) => {
    try {
      await post(`/strapi-plugin-magic-link-v5/tokens/${tokenId}/block`);
      toggleNotification({
        type: 'success',
        message: 'Token wurde erfolgreich gesperrt'
      });
      // Liste der Tokens aktualisieren
      fetchTokens();
    } catch (error) {
      console.error("Fehler beim Sperren des Tokens:", error);
      toggleNotification({
        type: 'warning',
        message: 'Fehler beim Sperren des Tokens'
      });
    }
  };

  // Magic Link Token aktivieren
  const activateToken = async (tokenId) => {
    try {
      await post(`/strapi-plugin-magic-link-v5/tokens/${tokenId}/activate`);
      toggleNotification({
        type: 'success',
        message: 'Token wurde erfolgreich aktiviert'
      });
      // Liste der Tokens aktualisieren
      fetchTokens();
    } catch (error) {
      console.error("Fehler beim Aktivieren des Tokens:", error);
      toggleNotification({
        type: 'warning',
        message: 'Fehler beim Aktivieren des Tokens'
      });
    }
  };

  // Token-Gültigkeit verlängern
  const extendTokenValidity = async (tokenId, days) => {
    try {
      await post(`/strapi-plugin-magic-link-v5/tokens/${tokenId}/extend`, { days });
      toggleNotification({
        type: 'success',
        message: `Token-Gültigkeit wurde um ${days} Tage verlängert`
      });
      // Liste der Tokens aktualisieren
      fetchTokens();
    } catch (error) {
      console.error("Fehler beim Verlängern der Token-Gültigkeit:", error);
      toggleNotification({
        type: 'warning',
        message: 'Fehler beim Verlängern der Token-Gültigkeit'
      });
    }
  };

  // JWT-Session widerrufen
  const revokeJwtSession = async (session) => {
    try {
      await post(`/strapi-plugin-magic-link-v5/revoke-jwt`, { 
        jti: session.jti, 
        userId: session.user?.id 
      });
      
      toggleNotification({
        type: 'success',
        message: 'JWT-Session wurde erfolgreich widerrufen'
      });
      
      // Liste der JWT-Sessions aktualisieren
      fetchJwtSessions();
    } catch (error) {
      console.error("Fehler beim Widerrufen der JWT-Session:", error);
      toggleNotification({
        type: 'warning',
        message: 'Fehler beim Widerrufen der JWT-Session'
      });
    }
  };

  // JWT-Session-Widerruf aufheben
  const unrevokeJwtSession = async (session) => {
    try {
      await post(`/strapi-plugin-magic-link-v5/unrevoke-jwt`, { 
        jti: session.jti,
        userId: session.user?.id 
      });
      
      toggleNotification({
        type: 'success',
        message: 'JWT-Session wurde erfolgreich wiederhergestellt'
      });
      
      // Liste der JWT-Sessions aktualisieren
      fetchJwtSessions();
    } catch (error) {
      console.error("Fehler beim Wiederherstellen der JWT-Session:", error);
      toggleNotification({
        type: 'warning',
        message: 'Fehler beim Wiederherstellen der JWT-Session'
      });
    }
  };

  // Formatiere Datum
  const formatDate = (dateString) => {
    if (!dateString) return 'Nicht verfügbar';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Berechne, ob ein Datum abgelaufen ist
  const isExpired = (dateString) => {
    if (!dateString) return false;
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // Prüfe, ob das Datum gültig ist (nicht NaN)
      if (isNaN(date.getTime())) return false;
      
      return date < now;
    } catch (error) {
      console.error('Fehler beim Prüfen des Ablaufdatums:', error);
      return false;
    }
  };

  // Die Browser-Erkennung verbessern
  const extractBrowserInfo = (userAgent) => {
    if (!userAgent) return { name: 'Unbekannt', device: 'Unbekannt', version: '', osVersion: '' };
    
    let browser = 'Unbekannt';
    let device = 'Desktop';
    let version = '';
    let osVersion = '';
    
    // Browser-Erkennung mit Version
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
      version = match ? match[1] : '';
    }
    else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
      version = match ? match[1] : '';
    }
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'Safari';
      const match = userAgent.match(/Version\/(\d+\.\d+)/);
      version = match ? match[1] : '';
    }
    else if (userAgent.includes('Edg')) {
      browser = 'Edge';
      const match = userAgent.match(/Edg\/(\d+\.\d+)/);
      version = match ? match[1] : '';
    }
    else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
      browser = 'Internet Explorer';
      const match = userAgent.includes('MSIE') ? 
        userAgent.match(/MSIE (\d+\.\d+)/) : 
        userAgent.match(/rv:(\d+\.\d+)/);
      version = match ? match[1] : '';
    }
    else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
      browser = 'Opera';
      const match = userAgent.includes('OPR') ? 
        userAgent.match(/OPR\/(\d+\.\d+)/) : 
        userAgent.match(/Opera\/(\d+\.\d+)/);
      version = match ? match[1] : '';
    }
    
    // Geräte-Erkennung mit Version
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      device = 'iOS';
      const match = userAgent.match(/OS (\d+_\d+)/);
      osVersion = match ? match[1].replace('_', '.') : '';
    } else if (userAgent.includes('Android')) {
      device = 'Android';
      const match = userAgent.match(/Android (\d+(\.\d+)?)/);
      osVersion = match ? match[1] : '';
    } else if (userAgent.includes('Windows')) {
      device = 'Windows';
      if (userAgent.includes('Windows NT 10.0')) osVersion = '10/11';
      else if (userAgent.includes('Windows NT 6.3')) osVersion = '8.1';
      else if (userAgent.includes('Windows NT 6.2')) osVersion = '8';
      else if (userAgent.includes('Windows NT 6.1')) osVersion = '7';
      else if (userAgent.includes('Windows NT 6.0')) osVersion = 'Vista';
      else if (userAgent.includes('Windows NT 5.1')) osVersion = 'XP';
    } else if (userAgent.includes('Mac OS')) {
      device = 'macOS';
      // Versuche macOS Version zu extrahieren
      const match = userAgent.match(/Mac OS X (\d+[._]\d+([._]\d+)?)/);
      if (match) {
        osVersion = match[1].replace(/_/g, '.');
        // Übersetze die Version in gebräuchliche Namen (wenn möglich)
        if (osVersion.startsWith('10.15')) osVersion += ' (Catalina)';
        else if (osVersion.startsWith('10.14')) osVersion += ' (Mojave)';
        else if (osVersion.startsWith('10.13')) osVersion += ' (High Sierra)';
        else if (osVersion.startsWith('11.')) osVersion += ' (Big Sur)';
        else if (osVersion.startsWith('12.')) osVersion += ' (Monterey)';
        else if (osVersion.startsWith('13.')) osVersion += ' (Ventura)';
        else if (osVersion.startsWith('14.')) osVersion += ' (Sonoma)';
      }
    } else if (userAgent.includes('Linux')) {
      device = 'Linux';
      // Linux Version ist oft schwierig zu extrahieren
      if (userAgent.includes('Ubuntu')) osVersion = 'Ubuntu';
      else if (userAgent.includes('Fedora')) osVersion = 'Fedora';
      else if (userAgent.includes('Debian')) osVersion = 'Debian';
    } else if (userAgent.includes('Mobile')) {
      device = 'Mobile';
    }
    
    return { name: browser, device, version, osVersion };
  };

  // Bulk Delete Funktion
  const bulkDeleteTokens = async () => {
    try {
      // Unterscheide zwischen JWT-Sessions und Magic-Link-Tokens
      if (activeTab === 'jwt-sessions') {
        // Für JWT-Sessions den korrekten Endpunkt verwenden
        await Promise.all(
          selectedTokens.map(sessionId => 
            post('/magic-link/revoke-jwt', {
              sessionId: sessionId,
              // Finde die entsprechende Session, um die userId zu erhalten
              userId: jwtSessions.find(s => s.id === sessionId)?.userId || ''
            })
          )
        );
        
        await fetchJwtSessions();
      } else {
        // Für Magic-Link-Tokens den bestehenden Endpunkt verwenden
        await Promise.all(
          selectedTokens.map(tokenId => 
            del(`/magic-link/tokens/${tokenId}`)
          )
        );
        
        await fetchTokens();
      }
      
      toggleNotification({
        type: 'success',
        message: `${selectedTokens.length} ${activeTab === 'jwt-sessions' ? 'Session(s)' : 'Token(s)'} erfolgreich ${activeTab === 'jwt-sessions' ? 'gesperrt' : 'gelöscht'}`,
      });
      setSelectedTokens([]);
    } catch (error) {
      console.error('Fehler beim Massenlöschen:', error);
      toggleNotification({
        type: 'danger',
        message: `Fehler beim ${activeTab === 'jwt-sessions' ? 'Sperren' : 'Löschen'} der ausgewählten ${activeTab === 'jwt-sessions' ? 'Sessions' : 'Tokens'}`,
      });
    }
  };

  // IP-Bann Funktion implementieren
  const banIP = async () => {
    try {
      await post(`/strapi-plugin-magic-link-v5/ban-ip`, { data: { ip: ipToBan } });
      
      toggleNotification({
        type: 'success',
        message: `IP ${ipToBan} wurde erfolgreich gesperrt`
      });
      
      setShowIPBanModal(false);
      setIpToBan('');
      
      // Liste der gesperrten IPs aktualisieren
      await fetchBannedIPs();
    } catch (error) {
      console.error("Fehler beim Sperren der IP:", error);
      toggleNotification({
        type: 'warning',
        message: `Fehler beim Sperren der IP ${ipToBan}`
      });
    }
  };

  // Aufräumen der abgelaufenen Sessions
  const cleanupSessions = async () => {
    try {
      setIsLoadingJwt(true);
      const response = await post('/magic-link/cleanup-sessions');
      fetchJwtSessions();
      
      toggleNotification({
        type: 'success',
        message: response.data.message || 'Abgelaufene Sessions wurden aufgeräumt'
      });
    } catch (error) {
      console.error("Fehler beim Aufräumen der Sessions:", error);
      toggleNotification({
        type: 'danger',
        message: 'Fehler beim Aufräumen der abgelaufenen Sessions'
      });
    } finally {
      setIsLoadingJwt(false);
    }
  };

  // Neue Funktion zum Erstellen eines Tokens
  const createToken = async () => {
    try {
      if (!newTokenEmail) {
        toggleNotification({
          type: 'warning',
          message: 'Bitte geben Sie eine E-Mail an'
        });
        return;
      }
      
      // Parse jsonContext
      let parsedJsonData = null;
      if (jsonContext && jsonContext.trim() !== '') {
        try {
          parsedJsonData = JSON.parse(jsonContext);
        } catch (e) {
          toggleNotification({
            type: 'warning',
            message: 'Der JSON-Kontext ist nicht gültig'
          });
          return;
        }
      }
      
      // Sende Anfrage zum Erstellen des Tokens
      await post(`/strapi-plugin-magic-link-v5/tokens`, {
        email: newTokenEmail,
        expires_in: parseInt(newTokenExpireDays) || 30,
        context: parsedJsonData,
        send_email: true
      });
      
      toggleNotification({
        type: 'success',
        message: `Neuer Token für ${newTokenEmail} wurde erstellt`
      });
      
      // Modal schließen und Formular zurücksetzen
      setShowCreateTokenModal(false);
      setNewTokenEmail('');
      setNewTokenExpireDays('30');
      setJsonContext('');
      
      // Liste der Tokens aktualisieren
      fetchTokens();
    } catch (error) {
      console.error("Fehler beim Erstellen des Tokens:", error);
      toggleNotification({
        type: 'warning',
        message: 'Fehler beim Erstellen des Tokens'
      });
    }
  };

  // Funktion zum Öffnen des Token-Detail-Modals
  const openTokenDetailModal = (token) => {
    setSelectedToken(token);
    setShowTokenDetailModal(true);
  };

  // Initialisiere Daten beim Laden
  useEffect(() => {
    fetchTokens();
    fetchJwtSessions();
    fetchBannedIPs();
  }, []);

  // Aktive Magic Link Tokens
  const activeTokens = tokens.filter(token => token.is_active);
  
  // Gefilterte JWT Sessions
  const filteredJwtSessions = showRevokedTokens 
    ? jwtSessions 
    : jwtSessions.filter(session => !session.revoked);

  // Token-Zusammenfassung
  const tokenStats = {
    total: tokens.length || 0,
    active: activeTokens.length || 0,
    expired: activeTokens.filter(token => isExpired(token.expires_at)).length || 0,
    valid: activeTokens.filter(token => !isExpired(token.expires_at)).length || 0,
  };

  // JWT-Zusammenfassung
  const jwtStats = {
    total: jwtSessions.length || 0,
    active: jwtSessions.filter(s => !s.revoked && !isExpired(s.expiresAt)).length || 0,
    expired: jwtSessions.filter(s => !s.revoked && isExpired(s.expiresAt)).length || 0,
    revoked: jwtSessions.filter(s => s.revoked).length || 0,
  };

  // Statistikkarte Komponente für einheitliches Design
  const StatCard = ({ title, value, color, icon }) => (
    <Box 
      background="neutral0" 
      padding={4} 
      shadow="tableShadow" 
      hasRadius
      borderColor={color}
      borderWidth="2px"
      borderStyle="solid"
      style={{ 
        transition: 'all 0.2s ease-in-out', 
        cursor: 'default',
        height: '100%', 
        display: 'flex',
        flexDirection: 'column'
      }}
      hover={{ shadow: 'popupShadow', transform: 'translateY(-2px)' }}
    >
      <Flex alignItems="center" gap={2} paddingBottom={3}>
        <Box 
          background={`${color}20`} 
          padding={2} 
          style={{
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <Box style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            {React.cloneElement(icon, { fill: color })}
          </Box>
        </Box>
        <Typography variant="delta" textColor="neutral600">{title}</Typography>
      </Flex>
      <Box style={{ flexGrow: 1, display: 'flex', textAlign: 'center' }}>
        <Box style={{ margin: 'auto' }}>
          <Typography variant="alpha" textAlign="center" textColor={color || "neutral800"}>{value}</Typography>
        </Box>
      </Box>
    </Box>
  );
  
  // Status-Badge Komponente
  const StatusBadge = ({ status, text, subText }) => {
    let color, background, icon;
    
    switch(status) {
      case 'success':
        color = 'success600';
        background = 'success100';
        icon = <Key fill={color} />;
        break;
      case 'warning':
        color = 'warning600';
        background = 'warning100';
        icon = <WarningCircle fill={color} />;
        break;
      case 'danger':
        color = 'danger600';
        background = 'danger100';
        icon = <Lock fill={color} />;
        break;
      default:
        color = 'neutral600';
        background = 'neutral100';
        icon = <Information fill={color} />;
    }
    
    return (
      <Box
        background={background}
        padding="6px 8px"
        hasRadius
        style={{ 
          display: 'inline-flex',
          marginBottom: '4px',
          borderLeft: `3px solid var(--strapi-${color})`,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          width: 'fit-content',
          position: 'relative'
        }}
      >
        <Tooltip content={subText}>
          <Flex>
            {icon}
            <Typography variant="pi" fontWeight="bold" textColor={color}>
              {text}
            </Typography>
          </Flex>
        </Tooltip>
      </Box>
    );
  };

  // Hauptrender
  return (
    <Main>
      {/* Header */}
      <Box 
        background="neutral100" 
        padding={6} 
        shadow="tableShadow"
        hasRadius
        style={{ borderBottom: '1px solid #EAEAEF' }}
      >
        <Flex justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="alpha" paddingBottom={2}>
              Token-Verwaltung
            </Typography>
            <br />
            <Typography variant="epsilon" textColor="neutral600">
              Verwaltung von Magic Link Tokens und JWT-Sessions
            </Typography>
          </Box>
          <Flex gap={2}>
            <Button 
              onClick={() => setShowCreateModal(true)}
              startIcon={<Plus />}
              variant="default"
            >
              Token erstellen
            </Button>
            <Button 
              onClick={bulkDeleteTokens}
              variant="danger"
              startIcon={<Trash />}
            >
              {activeTab === 'jwt-sessions' ? 'Bulk Sperren' : 'Bulk Delete'}
            </Button>
            <Button
              variant="secondary"
              startIcon={<Shield />}
              onClick={() => {
                const ips = [...new Set(selectedTokens
                  .map(tokenId => tokens.find(t => t.id === tokenId)?.ip_address)
                  .filter(Boolean))];
                setIpToBan(ips.join(', '));
                setShowIPBanModal(true);
              }}
            >
              IPs bannen ({new Set(selectedTokens
                .map(tokenId => tokens.find(t => t.id === tokenId)?.ip_address)
                .filter(Boolean)).size})
            </Button>
            <Button
              startIcon={<ArrowRight fill="primary600" />}
              onClick={() => {
                fetchTokens();
                fetchJwtSessions();
              }}
              disabled={isLoading || isLoadingJwt}
            >
              Aktualisieren
            </Button>
            <Flex>
              <Button
                onClick={() => window.location.href = '/admin/plugins/strapi-plugin-magic-link-v5'}
                variant="tertiary"
                startIcon={<ArrowLeft />}
              >
                Zurück
              </Button>
              <Button 
                onClick={() => setShowCreateTokenModal(true)}
                variant="default"
                startIcon={<Plus />}
              >
                Token erstellen
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Box>

      {/* Tab Navigation */}
      <Box padding={4} background="neutral0" shadow="filterShadow" marginTop={4} hasRadius>
        <Flex gap={4}>
          <Button
            variant={activeTab === 'magic-links' ? "primary" : "tertiary"}
            onClick={() => setActiveTab('magic-links')}
            fullWidth
          >
            Magic Link Tokens
          </Button>
          <Button
            variant={activeTab === 'jwt-sessions' ? "primary" : "tertiary"}
            onClick={() => setActiveTab('jwt-sessions')}
            fullWidth
          >
            JWT Sessions
          </Button>
          <Button
            variant={activeTab === 'ip-bans' ? "primary" : "tertiary"}
            onClick={() => setActiveTab('ip-bans')}
            fullWidth
          >
            IP-Sperren
          </Button>
        </Flex>
      </Box>

      {/* Tab Content */}
      <Box padding={4}>
        {/* Magic Links Tab */}
        {activeTab === 'magic-links' && (
          <>
            {/* Statistiken */}
            <Flex justifyContent="center" paddingBottom={4}>
              <Flex 
                gap={4} 
                padding={4} 
                background="neutral0" 
                shadow="tableShadow" 
                hasRadius
                wrap="wrap"
                style={{ 
                  width: '100%',
                  maxWidth: '800px',
                  justifyContent: 'center'
                }}
              >
                {[
                  { title: "Alle Tokens", value: tokenStats.total, color: "neutral800", icon: <Key /> },
                  { title: "Aktive Tokens", value: tokenStats.active, color: "success500", icon: <Key /> },
                  { title: "Gültige Tokens", value: tokenStats.valid, color: "primary600", icon: <Key /> },
                  { title: "Abgelaufene Tokens", value: tokenStats.expired, color: "warning500", icon: <WarningCircle /> }
                ].map((stat, index) => (
                  <Box 
                    key={index}
                    style={{ 
                      flex: '1 1 180px', 
                      minWidth: '180px',
                      maxWidth: '240px'
                    }}
                  >
                    <StatCard 
                      title={stat.title}
                      value={stat.value}
                      color={stat.color}
                      icon={stat.icon}
                      style={{ textAlign: 'center' }}
                    />
                  </Box>
                ))}
              </Flex>
            </Flex>
            
            {/* Token Tabelle */}
            <Box 
              background="neutral0" 
              padding={4} 
              shadow="tableShadow" 
              hasRadius
              style={{ 
                border: '1px solid #EAEAEF',
                borderRadius: '4px'
              }}
            >
              <Flex justifyContent="space-between" alignItems="center" paddingBottom={4}>
                <Typography variant="beta">
                  Magic Link Tokens ({activeTokens.length})
                </Typography>
                <Flex gap={2}>
                  <Badge 
                    backgroundColor="primary100" 
                    textColor="primary600" 
                    padding={2}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Key fill="primary600" />
                    Aktive Tokens: {tokenStats.active}
                  </Badge>
                </Flex>
              </Flex>
              
              {isLoading ? (
                <Flex justifyContent="center" alignItems="center" paddingTop={6} paddingBottom={6}>
                  <Loader>Tokens werden geladen...</Loader>
                </Flex>
              ) : activeTokens.length === 0 ? (
                <EmptyStateLayout
                  icon={<Information fill="neutral600" />}
                  content="Keine aktiven Magic Link Tokens gefunden"
                  action={
                    <Button 
                      variant="secondary" 
                      startIcon={<ArrowRight fill="primary600" />}
                      onClick={fetchTokens}
                    >
                      Aktualisieren
                    </Button>
                  }
                />
              ) : (
                <Box overflow="auto" style={{ borderRadius: '4px', border: '1px solid #EAEAEF' }}>
                  <Table 
                    colCount={5} 
                    rowCount={activeTokens.length} 
                    style={{
                      borderCollapse: 'separate',
                      borderSpacing: 0,
                    }}
                  >
                    <Thead background="neutral100">
                      <Tr style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                        <Th width="5%">
                          <Checkbox
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTokens(activeTokens.map(t => t.id));
                              } else {
                                setSelectedTokens([]);
                              }
                            }}
                            checked={selectedTokens.length === activeTokens.length && activeTokens.length > 0}
                            indeterminate={selectedTokens.length > 0 && selectedTokens.length < activeTokens.length ? true : undefined}
                            aria-label="Alle Tokens auswählen"
                          />
                        </Th>
                        <Th width="20%">
                          <Flex gap={3} alignItems="center" padding={3}>
                            <Box background="primary100" padding={2} hasRadius>
                              <Mail width="1rem" color="primary600" />
                            </Box>
                            <Typography variant="sigma" textColor="neutral600" fontWeight="bold" textTransform="uppercase">
                              E-Mail
                            </Typography>
                          </Flex>
                        </Th>
                        <Th width="15%">
                          <Flex gap={3} alignItems="center" padding={3}>
                            <Box background="success100" padding={2} hasRadius>
                              <Key width="1rem" color="success600" />
                            </Box>
                            <Typography variant="sigma" textColor="neutral600" fontWeight="bold" textTransform="uppercase">
                              Status
                            </Typography>
                          </Flex>
                        </Th>
                        <Th width="20%">
                          <Flex gap={3} alignItems="center" padding={3}>
                            <Box background="warning100" padding={2} hasRadius>
                              <Globe width="1rem" color="warning600" />
                            </Box>
                            <Typography variant="sigma" textColor="neutral600" fontWeight="bold" textTransform="uppercase">
                              Geräteinfo
                            </Typography>
                          </Flex>
                        </Th>
                        <Th width="30%">
                          <Flex gap={3} alignItems="center" padding={3}>
                            <Box background="primary100" padding={2} hasRadius>
                              <Flex gap={1}>
                                <Clock width="1rem" color="primary600" />
                                <CheckCircle width="1rem" color="primary600" />
                              </Flex>
                            </Box>
                            <Typography variant="sigma" textColor="neutral600" fontWeight="bold" textTransform="uppercase" style={{ paddingLeft: '10px' }}>
                              Zuletzt verwendet / Gültig bis
                            </Typography>
                          </Flex>
                        </Th>
                        <Th width="15%">
                          <Flex gap={3} alignItems="center" padding={3}>
                            <Box background="danger100" padding={2} hasRadius>
                              <Pencil width="1rem" color="danger600" />
                            </Box>
                            <Typography variant="sigma" textColor="neutral600" fontWeight="bold" textTransform="uppercase">
                              Aktionen
                            </Typography>
                          </Flex>
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {activeTokens.map((token, index) => {
                        const browserInfo = token.user_agent ? extractBrowserInfo(token.user_agent) : { name: 'Unbekannt', device: 'Unbekannt', version: '', osVersion: '' };
                        const isTokenExpired = isExpired(token.expires_at);
                        
                        return (
                          <Tr 
                            key={token.id}
                            style={{
                              backgroundColor: index % 2 === 0 ? 'white' : '#F7F7F9',
                              borderBottom: '1px solid #EAEAEF',
                              height: '72px'
                            }}
                          >
                            <Td>
                              <Checkbox
                                aria-label={`Token für ${token.email} auswählen`}
                                checked={selectedTokens.includes(token.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedTokens([...selectedTokens, token.id]);
                                  } else {
                                    setSelectedTokens(selectedTokens.filter(id => id !== token.id));
                                  }
                                }}
                              />
                            </Td>
                            <Td>
                              <Link onClick={() => navigateToUserProfile(token.email)} style={{ cursor: 'pointer' }}>
                                <Typography fontWeight="bold" textColor="primary600">{token.email}</Typography>
                              </Link>
                            </Td>
                            <Td>
                              <Flex direction="column" alignItems="flex-start" gap={1}>
                                {token.is_active ? (
                                  <>
                                    <StatusBadge status="success" text="Aktiv" subText={isTokenExpired ? "Abgelaufen" : ""} />
                                    {isTokenExpired && (
                                      <StatusBadge status="warning" text="Abgelaufen" subText={formatDate(token.expires_at)} />
                                    )}
                                  </>
                                ) : (
                                  <StatusBadge status="danger" text="Blockiert" subText="" />
                                )}
                              </Flex>
                            </Td>
                            <Td>
                              <Flex direction="column" gap={2} alignItems="flex-start">
                                {/* Browser Badge */}
                                <Box
                                  hasRadius
                                  padding={2}
                                  background="primary100"
                                  borderColor="primary200"
                                  style={{
                                    width: '100%',
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                  }}
                                >
                                  <Flex alignItems="center">
                                    <Box marginRight={2} style={{ display: 'flex', width: '20px', height: '20px' }}>
                                      <Globe fill="#4945FF" width={16} height={16} />
                                    </Box>
                                    <Typography variant="pi" fontWeight="semiBold">
                                      {browserInfo.name}
                                      {browserInfo.version && <> v{browserInfo.version}</>}
                                    </Typography>
                                  </Flex>
                                </Box>

                                {/* Betriebssystem Badge */}
                                <Box
                                  hasRadius
                                  padding={2}
                                  background="neutral100"
                                  borderColor="neutral200"
                                  style={{
                                    width: '100%',
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                  }}
                                >
                                  <Flex alignItems="center">
                                    <Box marginRight={2} style={{ display: 'flex', width: '20px', height: '20px' }}>
                                      <Information fill="#666687" width={16} height={16} />
                                    </Box>
                                    <Typography variant="pi" fontWeight="semiBold">
                                      {browserInfo.device}
                                      {browserInfo.osVersion && <> {browserInfo.osVersion}</>}
                                    </Typography>
                                  </Flex>
                                </Box>
                                
                                {/* IP-Adresse Badge */}
                                {token.ip_address && (
                                  <Box
                                    hasRadius
                                    padding={2}
                                    background="neutral150"
                                    borderColor="neutral200"
                                    style={{
                                      width: '100%',
                                      borderWidth: '1px',
                                      borderStyle: 'solid',
                                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                    }}
                                  >
                                    <Flex alignItems="center">
                                      <Box marginRight={2} style={{ display: 'flex', width: '20px', height: '20px' }}>
                                        <Shield fill="#666687" width={16} height={16} />
                                      </Box>
                                      <Typography variant="pi" fontWeight="semiBold" fontFamily="monospace">
                                        IP: {token.ip_address}
                                      </Typography>
                                    </Flex>
                                  </Box>
                                )}
                              </Flex>
                            </Td>
                            <Td colSpan={1}>
                              <Box style={{ display: 'table', width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                {/* Erstellt */}
                                <Box style={{ display: 'table-row' }}>
                                  <Box 
                                    background="neutral100" 
                                    hasRadius
                                    style={{ 
                                      borderLeft: '3px solid var(--strapi-neutral600)',
                                      display: 'table-cell',
                                      padding: '8px',
                                      verticalAlign: 'middle',
                                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                    }}
                                  >
                                    <Box style={{ display: 'flex', alignItems: 'center' }}>
                                      <Box style={{ width: '24px', display: 'flex', justifyContent: 'center', marginRight: '8px' }}>
                                        <Calendar fill="neutral600" />
                                      </Box>
                                      <Typography variant="pi" fontWeight="bold" textColor="neutral600" style={{width: '120px', display: 'inline-block'}}>Erstellt:</Typography>
                                      <Typography variant="pi">{formatDate(token.createdAt)}</Typography>
                                    </Box>
                                  </Box>
                                </Box>

                                {/* Gültig bis */}
                                <Box style={{ display: 'table-row', marginTop: '8px' }}>
                                  <Box 
                                    background={isTokenExpired ? "danger100" : "success100"} 
                                    hasRadius
                                    style={{ 
                                      borderLeft: `3px solid var(--strapi-${isTokenExpired ? 'danger600' : 'success600'})`,
                                      display: 'table-cell',
                                      padding: '8px',
                                      verticalAlign: 'middle',
                                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                    }}
                                  >
                                    <Box style={{ display: 'flex', alignItems: 'center' }}>
                                      <Box style={{ width: '24px', display: 'flex', justifyContent: 'center', marginRight: '8px' }}>
                                        <Clock fill={isTokenExpired ? "danger600" : "success600"} />
                                      </Box>
                                      <Typography variant="pi" fontWeight="bold" textColor={isTokenExpired ? "danger600" : "success600"} style={{width: '120px', display: 'inline-block'}}>Gültig bis:</Typography>
                                      <Typography variant="pi" textColor={isTokenExpired ? "danger600" : "success600"}>{formatDate(token.expires_at)}</Typography>
                                    </Box>
                                  </Box>
                                </Box>

                                {/* Zuletzt verwendet */}
                                {token.last_used_at && (
                                  <Box style={{ display: 'table-row' }}>
                                    <Box 
                                      background="neutral100" 
                                      hasRadius
                                      style={{ 
                                        borderLeft: '3px solid var(--strapi-primary600)',
                                        display: 'table-cell',
                                        padding: '8px',
                                        verticalAlign: 'middle',
                                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                      }}
                                    >
                                      <Box style={{ display: 'flex', alignItems: 'center' }}>
                                        <Box style={{ width: '24px', display: 'flex', justifyContent: 'center', marginRight: '8px' }}>
                                          <Clock fill="primary600" />
                                        </Box>
                                        <Typography variant="pi" fontWeight="bold" textColor="primary600" style={{width: '120px', display: 'inline-block'}}>Zuletzt verwendet:</Typography>
                                        <Typography variant="pi">{formatDate(token.last_used_at)}</Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                )}
                              </Box>
                            </Td>
                            <Td>
                              <Flex direction="column" gap={2}>
                                <Button 
                                  variant="danger-light"
                                  size="S"
                                  onClick={() => blockToken(token.id)}
                                  disabled={!token.is_active}
                                  fullWidth
                                  style={{
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                    transition: 'all 0.2s ease-in-out'
                                  }}
                                >
                                  Blockieren
                                </Button>
                                <Button 
                                  variant="secondary"
                                  size="S"
                                  onClick={() => openTokenDetailModal(token)}
                                  fullWidth
                                  style={{
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                    transition: 'all 0.2s ease-in-out'
                                  }}
                                >
                                  Details
                                </Button>
                              </Flex>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </Box>
          </>
        )}

        {/* JWT Sessions Tab */}
        {activeTab === 'jwt-sessions' && (
          <>
            {/* JWT Statistiken */}
            <Flex justifyContent="center" paddingBottom={4}>
              <Flex 
                gap={4} 
                padding={4} 
                background="neutral0" 
                shadow="tableShadow" 
                hasRadius
                wrap="wrap"
                style={{ 
                  width: '100%',
                  maxWidth: '800px',
                  justifyContent: 'center'
                }}
              >
                {[
                  { title: "Alle Sessions", value: jwtStats.total, color: "neutral800", icon: <Key /> },
                  { title: "Aktive Sessions", value: jwtStats.active, color: "success500", icon: <Key /> },
                  { title: "Abgelaufene Sessions", value: jwtStats.expired, color: "warning500", icon: <WarningCircle /> },
                  { title: "Gesperrte Sessions", value: jwtStats.revoked, color: "danger500", icon: <Lock /> }
                ].map((stat, index) => (
                  <Box key={index} style={{ flex: '1 1 180px', minWidth: '180px', maxWidth: '240px' }}>
                    <StatCard 
                      title={stat.title}
                      value={stat.value}
                      color={stat.color}
                      icon={stat.icon}
                    />
                  </Box>
                ))}
              </Flex>
            </Flex>
          
            {/* JWT Session Tabelle */}
            <Box 
              background="neutral0" 
              padding={4} 
              shadow="tableShadow" 
              hasRadius
              style={{ 
                border: '1px solid #EAEAEF',
                borderRadius: '4px'
              }}
            >
              <Flex justifyContent="space-between" alignItems="center" paddingBottom={4}>
                <Typography variant="beta">
                  JWT Sessions ({filteredJwtSessions.length})
                </Typography>
                <Flex gap={2}>
                  <Button
                    variant="secondary"
                    startIcon={<Clock />}
                    onClick={cleanupSessions}
                    disabled={isLoadingJwt}
                  >
                    Abgelaufene aufräumen
                  </Button>
                  <Button
                    variant={showRevokedTokens ? "success" : "secondary"}
                    startIcon={showRevokedTokens ? <CheckCircle /> : <Filter />}
                    onClick={() => setShowRevokedTokens(!showRevokedTokens)}
                  >
                    {showRevokedTokens ? 'Nur aktive anzeigen' : 'Auch gesperrte anzeigen'}
                  </Button>
                </Flex>
              </Flex>
              
              {isLoadingJwt ? (
                <Flex justifyContent="center" alignItems="center" paddingTop={6} paddingBottom={6}>
                  <Loader>JWT Sessions werden geladen...</Loader>
                </Flex>
              ) : filteredJwtSessions.length === 0 ? (
                <EmptyStateLayout
                  icon={<Information fill="neutral600" />}
                  content={
                    showRevokedTokens 
                      ? "Keine JWT Sessions gefunden" 
                      : "Keine aktiven JWT Sessions gefunden"
                  }
                  action={
                    <Button 
                      variant="secondary" 
                      startIcon={<ArrowRight fill="primary600" />}
                      onClick={fetchJwtSessions}
                    >
                      Aktualisieren
                    </Button>
                  }
                />
              ) : (
                <Box overflow="auto" style={{ borderRadius: '4px', border: '1px solid #EAEAEF' }}>
                  <Table 
                    colCount={7} 
                    rowCount={filteredJwtSessions.length}
                    style={{
                      borderCollapse: 'separate',
                      borderSpacing: 0,
                    }}
                  >
                    <Thead background="neutral150">
                      <Tr style={{ borderBottom: '2px solid #dcdce4' }}>
                        <Th width="5%">
                          <Checkbox
                            aria-label="Alle Sessions auswählen"
                            indeterminate={selectedTokens.length > 0 && selectedTokens.length < filteredJwtSessions.length ? true : undefined}
                            checked={selectedTokens.length === filteredJwtSessions.length && filteredJwtSessions.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTokens(filteredJwtSessions.map(s => s.id));
                              } else {
                                setSelectedTokens([]);
                              }
                            }}
                          />
                        </Th>
                        <Th width="15%">
                          <Flex gap={2} alignItems="center">
                            <Mail fill="neutral600" />
                            <Typography variant="sigma">Benutzer</Typography>
                          </Flex>
                        </Th>
                        <Th width="10%">
                          <Flex gap={2} alignItems="center">
                            <Key fill="neutral600" />
                            <Typography variant="sigma">Status</Typography>
                          </Flex>
                        </Th>
                        <Th width="15%">
                          <Flex gap={2} alignItems="center">
                            <Globe fill="neutral600" />
                            <Typography variant="sigma">Browser/IP</Typography>
                          </Flex>
                        </Th>
                        <Th width="15%">
                          <Flex gap={2} alignItems="center">
                            <Calendar fill="neutral600" />
                            <Typography variant="sigma">Erstellt</Typography>
                          </Flex>
                        </Th>
                        <Th width="15%">
                          <Flex gap={2} alignItems="center">
                            <Clock fill="neutral600" />
                            <Typography variant="sigma">Läuft ab</Typography>
                          </Flex>
                        </Th>
                        <Th width="15%">
                          <Flex gap={2} alignItems="center">
                            <Information fill="neutral600" />
                            <Typography variant="sigma">Quelle</Typography>
                          </Flex>
                        </Th>
                        <Th width="15%">
                          <Flex gap={2} alignItems="center">
                            <Pencil fill="neutral600" />
                            <Typography variant="sigma">Aktionen</Typography>
                          </Flex>
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredJwtSessions.map((session, index) => {
                        const browserInfo = session.userAgent ? extractBrowserInfo(session.userAgent) : { name: 'Unbekannt', device: 'Unbekannt', version: '', osVersion: '' };
                        const isSessionExpired = isExpired(session.expiresAt);
                        return (
                          <Tr 
                            key={index}
                            style={{
                              backgroundColor: index % 2 === 0 ? 'white' : '#F7F7F9',
                              borderBottom: '1px solid #EAEAEF',
                              height: '72px'
                            }}
                          >
                            <Td>
                              <Checkbox
                                aria-label={`Session für ${session.username || session.userId || 'Unbekannt'} auswählen`}
                                checked={selectedTokens.includes(session.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedTokens([...selectedTokens, session.id]);
                                  } else {
                                    setSelectedTokens(selectedTokens.filter(id => id !== session.id));
                                  }
                                }}
                              />
                            </Td>
                            <Td>
                              <Box>
                                <Typography fontWeight="bold" textColor="primary600">
                                  {session.username || session.userId || 'Unbekannt'}
                                </Typography>
                                {session.email && (
                                  <Link href={`mailto:${session.email}`}>
                                    <Typography variant="pi" textColor="neutral600">
                                      {session.email}
                                    </Typography>
                                  </Link>
                                )}
                              </Box>
                            </Td>
                            <Td>
                              <Flex direction="column" alignItems="flex-start" gap={1}>
                                {session.revoked ? (
                                  <StatusBadge status="danger" text="Gesperrt" subText="" />
                                ) : (
                                  <>
                                    <StatusBadge status="success" text="Aktiv" subText={isSessionExpired ? "Abgelaufen" : ""} />
                                    {isSessionExpired && (
                                      <StatusBadge status="warning" text="Abgelaufen" subText={formatDate(session.expiresAt)} />
                                    )}
                                  </>
                                )}
                              </Flex>
                            </Td>
                            <Td>
                              <Flex direction="column" gap={2} alignItems="flex-start">
                                {/* Browser Badge */}
                                <Box
                                  hasRadius
                                  padding={2}
                                  background="primary100"
                                  borderColor="primary200"
                                  style={{
                                    width: '100%',
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                  }}
                                >
                                  <Flex alignItems="center">
                                    <Box marginRight={2} style={{ display: 'flex', width: '20px', height: '20px' }}>
                                      <Globe fill="#4945FF" width={16} height={16} />
                                    </Box>
                                    <Typography variant="pi" fontWeight="semiBold">
                                      {browserInfo.name}
                                      {browserInfo.version && <> v{browserInfo.version}</>}
                                    </Typography>
                                  </Flex>
                                </Box>

                                {/* Betriebssystem Badge */}
                                <Box
                                  hasRadius
                                  padding={2}
                                  background="neutral100"
                                  borderColor="neutral200"
                                  style={{
                                    width: '100%',
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                  }}
                                >
                                  <Flex alignItems="center">
                                    <Box marginRight={2} style={{ display: 'flex', width: '20px', height: '20px' }}>
                                      <Information fill="#666687" width={16} height={16} />
                                    </Box>
                                    <Typography variant="pi" fontWeight="semiBold">
                                      {browserInfo.device}
                                      {browserInfo.osVersion && <> {browserInfo.osVersion}</>}
                                    </Typography>
                                  </Flex>
                                </Box>
                                
                                {/* IP-Adresse Badge */}
                                {session.ipAddress && (
                                  <Box
                                    hasRadius
                                    padding={2}
                                    background="neutral150"
                                    borderColor="neutral200"
                                    style={{
                                      width: '100%',
                                      borderWidth: '1px',
                                      borderStyle: 'solid',
                                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                    }}
                                  >
                                    <Flex alignItems="center">
                                      <Box marginRight={2} style={{ display: 'flex', width: '20px', height: '20px' }}>
                                        <Shield fill="#666687" width={16} height={16} />
                                      </Box>
                                      <Typography variant="pi" fontWeight="semiBold" fontFamily="monospace">
                                        IP: {session.ipAddress}
                                      </Typography>
                                    </Flex>
                                  </Box>
                                )}
                              </Flex>
                            </Td>
                            <Td>
                              <Box style={{ display: 'table', width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                <Box style={{ display: 'table-row' }}>
                                  <Box 
                                    background="neutral100" 
                                    hasRadius
                                    style={{ 
                                      borderLeft: '3px solid var(--strapi-neutral600)',
                                      display: 'table-cell',
                                      padding: '8px',
                                      verticalAlign: 'middle',
                                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                    }}
                                  >
                                    <Box style={{ display: 'flex', alignItems: 'center' }}>
                                      <Box style={{ width: '24px', display: 'flex', justifyContent: 'center', marginRight: '8px' }}>
                                        <Calendar fill="neutral600" />
                                      </Box>
                                      <Typography variant="pi" textColor="neutral600">{formatDate(session.createdAt)}</Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              </Box>
                            </Td>
                            <Td>
                              <Box style={{ display: 'table', width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                <Box style={{ display: 'table-row' }}>
                                  <Box 
                                    background={isSessionExpired ? "danger100" : "success100"} 
                                    hasRadius
                                    style={{ 
                                      borderLeft: `3px solid var(--strapi-${isSessionExpired ? 'danger600' : 'success600'})`,
                                      display: 'table-cell',
                                      padding: '8px',
                                      verticalAlign: 'middle',
                                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                    }}
                                  >
                                    <Box style={{ display: 'flex', alignItems: 'center' }}>
                                      <Box style={{ width: '24px', display: 'flex', justifyContent: 'center', marginRight: '8px' }}>
                                        <Clock fill={isSessionExpired ? "danger600" : "success600"} />
                                      </Box>
                                      <Typography 
                                        variant="pi"
                                        textColor={isSessionExpired ? "danger600" : "success600"}
                                      >
                                        {formatDate(session.expiresAt)}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              </Box>
                            </Td>
                            <Td>
                              <Badge 
                                padding={2}
                                style={{ 
                                  borderRadius: '4px',
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                  display: 'inline-block',
                                  padding: '6px 8px',
                                  height: '28px'
                                }}
                              >
                                <Box style={{ display: 'flex' }}>
                                  <Box style={{ marginRight: '4px', display: 'flex' }}>
                                    <Information fill="neutral600" />
                                  </Box>
                                  <span>
                                    {session.source || "Magic Link Login"}
                                  </span>
                                </Box>
                              </Badge>
                            </Td>
                            <Td>
                              {!session.revoked && !isSessionExpired ? (
                                <Button 
                                  variant="danger-light"
                                  size="S"
                                  onClick={() => revokeJwtSession(session)}
                                  fullWidth
                                  style={{
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                    transition: 'all 0.2s ease-in-out'
                                  }}
                                >
                                  Sperren
                                </Button>
                              ) : session.revoked ? (
                                <Button 
                                  variant="success"
                                  size="S"
                                  onClick={() => unrevokeJwtSession(session)}
                                  fullWidth
                                  style={{
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                    transition: 'all 0.2s ease-in-out'
                                  }}
                                >
                                  Entsperren
                                </Button>
                              ) : (
                                <Typography variant="pi" textColor="neutral600" textAlign="center">
                                  -
                                </Typography>
                              )}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </Box>
          </>
        )}

        {/* IP-Sperren Tab */}
        {activeTab === 'ip-bans' && (
          <>
            <Box background="neutral0" padding={8} shadow="tableShadow" hasRadius>
              <Flex direction="column" gap={6}>
                <Typography variant="beta">Gesperrte IP-Adressen</Typography>
                
                <Flex gap={4} justifyContent="space-between" alignItems="center">
                  <Box>
                    <Button 
                      onClick={() => {
                        fetchBannedIPs();
                        toggleNotification({
                          type: 'info',
                          message: 'IP-Liste aktualisiert'
                        });
                      }}
                      startIcon={<ArrowRight />}
                      loading={isLoadingBannedIPs}
                    >
                      Aktualisieren
                    </Button>
                  </Box>
                  <Box>
                    <Button 
                      onClick={() => setShowIPBanModal(true)}
                      startIcon={<Shield />}
                      variant="danger"
                    >
                      IP sperren
                    </Button>
                  </Box>
                </Flex>
                
                {isLoadingBannedIPs ? (
                  <Flex justifyContent="center" padding={6}>
                    <Loader>Lade gesperrte IP-Adressen...</Loader>
                  </Flex>
                ) : (
                  bannedIPs.length === 0 ? (
                    <EmptyStateLayout 
                      icon={<Shield width="6rem" height="6rem" />}
                      content="Keine gesperrten IP-Adressen gefunden"
                      action={
                        <Button
                          onClick={() => setShowIPBanModal(true)}
                          startIcon={<Shield />}
                          variant="danger"
                        >
                          IP sperren
                        </Button>
                      }
                    />
                  ) : (
                    <Table colCount={3} rowCount={bannedIPs.length + 1}>
                      <Thead>
                        <Tr>
                          <Th>
                            <Typography variant="sigma">IP-Adresse</Typography>
                          </Th>
                          <Th>
                            <Typography variant="sigma">Tokens</Typography>
                          </Th>
                          <Th>
                            <Typography variant="sigma">Aktionen</Typography>
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {bannedIPs.map((ip, index) => (
                          <Tr key={`banned-ip-${index}`}>
                            <Td>
                              <Typography fontFamily="monospace">{ip}</Typography>
                            </Td>
                            <Td>
                              <Badge>
                                {tokens.filter(token => token.ip_address === ip).length} Tokens
                              </Badge>
                            </Td>
                            <Td>
                              <Flex gap={2}>
                                <Button 
                                  onClick={() => {
                                    setIpToUnban(ip);
                                    setShowIPUnbanModal(true);
                                  }}
                                  size="S"
                                  variant="danger-light"
                                >
                                  Entsperren
                                </Button>
                              </Flex>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )
                )}
              </Flex>
            </Box>
          </>
        )}
      </Box>

      {/* IP-Bann Modal */}
      <Modal.Root open={showIPBanModal} onOpenChange={setShowIPBanModal}>
        <Modal.Content>
          <Modal.Header>
            <Modal.Title>IP-Adresse bannen</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Flex direction="column" gap={2}>
              <Field.Root name="ip">
                <Field.Label>IP-Adresse</Field.Label>
                <Field.Input
                  placeholder="z.B. 192.168.1.1"
                  value={ipToBan}
                  onChange={(e) => setIpToBan(e.target.value)}
                />
                <Field.Hint>Geben Sie die zu bannende IP-Adresse ein</Field.Hint>
              </Field.Root>
            </Flex>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => setShowIPBanModal(false)} variant="tertiary">
              Abbrechen
            </Button>
            <Button onClick={() => {
              banIP();
              setShowIPBanModal(false);
            }} startIcon={<Shield />} variant="danger">
              IP bannen
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>

      {/* Modal für die Eingabe der E-Mail */}
      <Modal.Root open={showCreateModal} onOpenChange={setShowCreateModal}>
        <Modal.Content>
          <Modal.Header>
            <Modal.Title>Magic Link Token erstellen</Modal.Title>
            <Modal.SubTitle>Erstellen Sie einen Token für einen Benutzer</Modal.SubTitle>
          </Modal.Header>
          <Modal.Body>
            <Box paddingTop={2}>
              <Field.Root name="email-create">
                <Field.Label>E-Mail</Field.Label>
                <Field.Input
                  type="email"
                  placeholder="email@example.com"
                  value={emailToCreate}
                  onChange={(e) => setEmailToCreate(e.target.value)}
                  aria-label="E-Mail für den neuen Token"
                />
                <Field.Hint>Die E-Mail des Benutzers, für den der Token erstellt werden soll</Field.Hint>
              </Field.Root>
            </Box>
            
            <Box paddingTop={4}>
              <Field.Root name="send-email">
                <Flex gap={2} alignItems="center">
                  <Field.Input
                    type="checkbox"
                    id="send-email"
                    name="send-email"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                  />
                  <Field.Label htmlFor="send-email">E-Mail mit Magic Link senden</Field.Label>
                </Flex>
              </Field.Root>
            </Box>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              onClick={() => {
                setShowCreateModal(false);
                setEmailToCreate('');
                setJsonContext('');
                setSendEmail(true);
                setEmailValidationStatus(null);
              }}
              variant="tertiary"
            >
              Abbrechen
            </Button>
            <Flex gap={2}>
              <Button 
                onClick={() => validateEmail(emailToCreate)}
                variant="secondary"
                loading={isValidatingEmail}
              >
                E-Mail validieren
              </Button>
              <Button 
                onClick={() => {
                  createToken();
                }}
                loading={isCreating}
                startIcon={<Check />}
                disabled={isValidatingEmail || (emailValidationStatus && !emailValidationStatus.valid)}
              >
                Token erstellen
              </Button>
            </Flex>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>

      {/* Token Detail Modal */}
      {selectedToken && (
        <Modal.Root open={showTokenDetailModal} onOpenChange={setShowTokenDetailModal}>
          <Modal.Content style={{ maxWidth: '900px' }}>
            <Modal.Header>
              <Modal.Title>Token Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Box background="neutral100" padding={4} hasRadius style={{ marginBottom: '24px' }}>
                <Typography variant="beta" textColor="primary600" style={{ marginBottom: '12px' }}>
                  Allgemeine Informationen
                </Typography>
                <Flex gap={4} wrap="wrap">
                  <Box width="45%" marginBottom={4}>
                    <Box padding={3} background="neutral0" hasRadius shadow="filterShadow" style={{ height: '100%' }}>
                      <Typography variant="delta" fontWeight="bold" textColor="neutral800">E-Mail</Typography>
                      <Box marginTop={2}>
                        <Link onClick={() => navigateToUserProfile(selectedToken.email)} style={{ cursor: 'pointer', textDecoration: 'none' }}>
                          <Typography textColor="primary600">{selectedToken.email}</Typography>
                        </Link>
                      </Box>
                    </Box>
                  </Box>
                  <Box width="45%" marginBottom={4}>
                    <Box padding={3} background="neutral0" hasRadius shadow="filterShadow" style={{ height: '100%' }}>
                      <Typography variant="delta" fontWeight="bold" textColor="neutral800">Token ID</Typography>
                      <Box marginTop={2}>
                        <Typography variant="pi" fontFamily="monospace" style={{ wordBreak: 'break-all' }}>
                          {selectedToken.id}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box width="30%" marginBottom={4}>
                    <Box padding={3} background="neutral0" hasRadius shadow="filterShadow" style={{ height: '100%' }}>
                      <Typography variant="delta" fontWeight="bold" textColor="neutral800">Status</Typography>
                      <Box marginTop={2}>
                        <Flex direction="column" gap={2}>
                          {selectedToken.is_active ? (
                            <Badge backgroundColor="success100" textColor="success600" padding={2}>
                              Aktiv
                            </Badge>
                          ) : (
                            <Badge backgroundColor="danger100" textColor="danger600" padding={2}>
                              Blockiert
                            </Badge>
                          )}
                          {isExpired(selectedToken.expires_at) && (
                            <Badge backgroundColor="warning100" textColor="warning600" padding={2}>
                              Abgelaufen
                            </Badge>
                          )}
                        </Flex>
                      </Box>
                    </Box>
                  </Box>
                  <Box width="30%" marginBottom={4}>
                    <Box padding={3} background="neutral0" hasRadius shadow="filterShadow" style={{ height: '100%' }}>
                      <Typography variant="delta" fontWeight="bold" textColor="neutral800">Benutzer-ID</Typography>
                      <Box marginTop={2}>
                        <Typography variant="pi" fontFamily="monospace">
                          {selectedToken.user_id || 'Nicht verfügbar'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box width="30%" marginBottom={4}>
                    <Box padding={3} background="neutral0" hasRadius shadow="filterShadow" style={{ height: '100%' }}>
                      <Typography variant="delta" fontWeight="bold" textColor="neutral800">IP-Adresse</Typography>
                      <Box marginTop={2}>
                        <Typography variant="pi" fontFamily="monospace">
                          {selectedToken.ip_address || 'Nicht verfügbar'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Flex>
              </Box>

              <Box background="neutral100" padding={4} hasRadius style={{ marginBottom: '24px' }}>
                <Typography variant="beta" textColor="primary600" style={{ marginBottom: '12px' }}>
                  Zeitliche Informationen
                </Typography>
                <Flex gap={4} wrap="wrap">
                  <Box width="30%" marginBottom={4}>
                    <Box padding={3} background="neutral0" hasRadius shadow="filterShadow" style={{ height: '100%' }}>
                      <Typography variant="delta" fontWeight="bold" textColor="neutral800">Erstellt am</Typography>
                      <Box marginTop={2}>
                        <Typography>
                          {formatDate(selectedToken.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box width="30%" marginBottom={4}>
                    <Box padding={3} background={isExpired(selectedToken.expires_at) ? "danger100" : "success100"} hasRadius shadow="filterShadow" style={{ height: '100%' }}>
                      <Typography variant="delta" fontWeight="bold" textColor={isExpired(selectedToken.expires_at) ? "danger600" : "success600"}>
                        Gültig bis
                      </Typography>
                      <Box marginTop={2}>
                        <Typography textColor={isExpired(selectedToken.expires_at) ? "danger600" : "success600"}>
                          {formatDate(selectedToken.expires_at)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box width="30%" marginBottom={4}>
                    <Box padding={3} background="neutral0" hasRadius shadow="filterShadow" style={{ height: '100%' }}>
                      <Typography variant="delta" fontWeight="bold" textColor="neutral800">Zuletzt verwendet</Typography>
                      <Box marginTop={2}>
                        <Typography>
                          {selectedToken.last_used_at ? formatDate(selectedToken.last_used_at) : 'Noch nicht verwendet'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Flex>
              </Box>

              {selectedToken.user_agent && (
                <Box background="neutral100" padding={4} hasRadius>
                  <Typography variant="beta" textColor="primary600" style={{ marginBottom: '12px' }}>
                    Geräte- und Browser-Informationen
                  </Typography>
                  <Box padding={3} background="neutral0" hasRadius shadow="filterShadow">
                    <Typography variant="delta" fontWeight="bold" textColor="neutral800">User Agent</Typography>
                    <Box marginTop={2} style={{ wordBreak: 'break-all' }}>
                      <Typography variant="pi" fontFamily="monospace">
                        {selectedToken.user_agent}
                      </Typography>
                    </Box>
                    <Divider marginTop={4} marginBottom={4} />
                    <Flex gap={4} wrap="wrap">
                      <Box width="45%" marginBottom={4}>
                        <Typography variant="delta" fontWeight="bold" textColor="neutral800">Erkannter Browser</Typography>
                        <Box marginTop={2}>
                          <Typography>
                            {extractBrowserInfo(selectedToken.user_agent).name} {extractBrowserInfo(selectedToken.user_agent).version && ` v${extractBrowserInfo(selectedToken.user_agent).version}`}
                          </Typography>
                        </Box>
                      </Box>
                      <Box width="45%" marginBottom={4}>
                        <Typography variant="delta" fontWeight="bold" textColor="neutral800">Betriebssystem</Typography>
                        <Box marginTop={2}>
                          <Typography>
                            {extractBrowserInfo(selectedToken.user_agent).device} {extractBrowserInfo(selectedToken.user_agent).osVersion && ` ${extractBrowserInfo(selectedToken.user_agent).osVersion}`}
                          </Typography>
                        </Box>
                      </Box>
                    </Flex>
                  </Box>
                </Box>
              )}

              {/* Context JSON Feld */}
              {selectedToken.context && (
                <Box background="neutral100" padding={4} hasRadius>
                  <Typography variant="beta" textColor="primary600" style={{ marginBottom: '12px' }}>
                    Context Daten
                  </Typography>
                  <Box padding={3} background="neutral0" hasRadius shadow="filterShadow">
                    <Typography variant="delta" fontWeight="bold" textColor="neutral800">Context JSON</Typography>
                    <Box 
                      marginTop={2} 
                      background="neutral150" 
                      padding={3} 
                      hasRadius 
                      style={{ 
                        wordBreak: 'break-all',
                        maxHeight: '200px',
                        overflow: 'auto'
                      }}
                    >
                      <Typography variant="pi" fontFamily="monospace">
                        {typeof selectedToken.context === 'object' 
                          ? JSON.stringify(selectedToken.context, null, 2) 
                          : selectedToken.context || '{}'
                        }
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Flex gap={2} justifyContent="space-between" width="100%">
                <Box>
                  {selectedToken.is_active ? (
                    <Button 
                      onClick={() => blockToken(selectedToken.id)} 
                      variant="danger"
                      startIcon={<Lock />}
                    >
                      Blockieren
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => activateToken(selectedToken.id)} 
                      variant="success"
                      startIcon={<CheckCircle />}
                    >
                      Aktivieren
                    </Button>
                  )}
                </Box>
                
                <Flex gap={2}>
                  <Flex alignItems="center" background="neutral100" padding={2} hasRadius>
                    <TextInput
                      type="number"
                      label=""
                      name="days"
                      value={extensionDays}
                      onChange={(e) => setExtensionDays(parseInt(e.target.value) || 1)}
                      aria-label="Tage"
                      style={{ width: '60px' }}
                      min="1"
                      max="365"
                    />
                    <Box paddingLeft={2}>Tage</Box>
                  </Flex>
                  
                  <Button 
                    onClick={() => extendTokenValidity(selectedToken.id, extensionDays)} 
                    variant="secondary"
                    startIcon={<Clock />}
                  >
                    Gültigkeit verlängern
                  </Button>
                  
                  <Button onClick={() => setShowTokenDetailModal(false)} variant="tertiary">
                    Schließen
                  </Button>
                </Flex>
              </Flex>
            </Modal.Footer>
          </Modal.Content>
        </Modal.Root>
      )}

      {/* IP-Ban-Modal für Entsperren */}
      <Modal.Root open={showIPUnbanModal} onOpenChange={setShowIPUnbanModal}>
        <Modal.Content>
          <Modal.Header>
            <Modal.Title>IP-Adresse entsperren</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Typography variant="omega">
              Möchten Sie die IP-Adresse {ipToUnban} wirklich entsperren?
            </Typography>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => setShowIPUnbanModal(false)} variant="tertiary">
              Abbrechen
            </Button>
            <Button onClick={unbanIP} startIcon={<CheckCircle />} variant="success">
              IP entsperren
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>

      {/* Create Token Modal */}
      <Modal.Root open={showCreateTokenModal} onOpenChange={setShowCreateTokenModal}>
        <Modal.Content>
          <Modal.Header>
            <Modal.Title>Neuen Magic Link Token erstellen</Modal.Title>
            <Modal.SubTitle>Erstellen Sie einen neuen Token für einen Benutzer</Modal.SubTitle>
          </Modal.Header>
          <Modal.Body>
            <Box paddingTop={2}>
              <Field.Root name="email">
                <Field.Label>E-Mail</Field.Label>
                <Field.Input
                  type="email"
                  placeholder="email@example.com"
                  value={newTokenEmail}
                  onChange={(e) => setNewTokenEmail(e.target.value)}
                  aria-label="E-Mail für den neuen Token"
                />
                <Field.Hint>Die E-Mail des Benutzers, für den der Token erstellt werden soll</Field.Hint>
              </Field.Root>
            </Box>
            
            <Box paddingTop={4}>
              <Field.Root name="expire-days">
                <Field.Label>Gültigkeit (Tage)</Field.Label>
                <Field.Input
                  type="number"
                  placeholder="30"
                  value={newTokenExpireDays}
                  onChange={(e) => setNewTokenExpireDays(e.target.value)}
                  aria-label="Gültigkeitsdauer in Tagen"
                  min="1"
                />
                <Field.Hint>Anzahl der Tage, für die der Token gültig sein soll</Field.Hint>
              </Field.Root>
            </Box>
            
            <Box paddingTop={4}>
              <Field.Root name="json-context">
                <Field.Label>JSON-Kontext</Field.Label>
                <Field.Input
                  as="textarea"
                  placeholder='{"key": "value"}'
                  name="json-context"
                  onChange={(e) => setJsonContext(e.target.value)}
                  value={jsonContext}
                  aria-label="JSON-Kontext"
                  style={{ height: '80px', fontFamily: 'monospace' }}
                />
                <Field.Hint>Optionaler JSON-Kontext für den Token (z.B. in Form von Key-Value-Paaren)</Field.Hint>
              </Field.Root>
            </Box>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              onClick={() => {
                setShowCreateTokenModal(false);
                setNewTokenEmail('');
                setNewTokenExpireDays('30');
                setJsonContext('');
              }}
              variant="tertiary"
            >
              Abbrechen
            </Button>
            <Button 
              onClick={createToken}
              variant="default"
              startIcon={<Check />}
              disabled={!newTokenEmail}
            >
              Token erstellen
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>
    </Main>
  );
};

export default TokensPage; 