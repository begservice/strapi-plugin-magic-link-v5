import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Main, 
  Flex, 
  Button, 
  Card, 
  Divider,
  Badge,
  ProgressBar
} from '@strapi/design-system';
import { 
  ArrowRight, 
  Cog, 
  Key, 
  Shield, 
  Check, 
  PuzzlePiece, 
  ExternalLink, 
  User, 
  Pencil, 
  Information,
  Calendar
} from '@strapi/icons';
import { useFetchClient } from '@strapi/helper-plugin';

const HomePage = () => {
  const { get } = useFetchClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    activeTokens: 0,
    tokenUsage: 0,
    usersUsingMagicLink: 0,
    securityScore: 85,
    tokenCreatedLast24h: 0,
    tokenExpiresNextDays: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // API-Anfrage, um echte Token-Daten zu laden
  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        setIsLoading(true);
        const response = await get('/magic-link/tokens');
        const { data, meta } = response.data || { data: [], meta: {} };
        
        if (data && Array.isArray(data)) {
          // Aktive Tokens zählen
          const activeTokens = data.filter(token => 
            token.is_active && new Date(token.expires_at) > new Date()
          ).length;
          
          // Unique Benutzer mit Magic Link zählen
          const uniqueUsers = new Set(data.map(token => token.email).filter(Boolean)).size;
          
          // Token, die in den letzten 24 Stunden erstellt wurden
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          const tokenCreatedLast24h = data.filter(token => 
            new Date(token.createdAt) > oneDayAgo
          ).length;
          
          // Token, die in den nächsten 3 Tagen ablaufen
          const threeDaysFromNow = new Date();
          threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
          const tokenExpiresNextDays = data.filter(token => {
            const expiryDate = new Date(token.expires_at);
            return expiryDate > new Date() && expiryDate < threeDaysFromNow;
          }).length;
          
          // Token-Nutzung berechnen (Prozentsatz der aktiven Tokens im Verhältnis zu allen)
          const tokenUsage = data.length > 0 
            ? Math.round((activeTokens / data.length) * 100) 
            : 0;
          
          // Sicherheitswert aus den Metadaten oder Fallback verwenden
          const securityScore = meta?.securityScore || 85;
          
          setStats({
            activeTokens,
            tokenUsage,
            usersUsingMagicLink: uniqueUsers,
            securityScore, // Dynamischer Wert aus der API
            tokenCreatedLast24h,
            tokenExpiresNextDays: tokenExpiresNextDays // Umbenennen von tokenExpiresNextHour zu tokenExpiresNextDays
          });
        }
      } catch (error) {
        console.error('Fehler beim Laden der Token-Daten:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenData();
    
    // Aktualisiere die Daten alle 30 Sekunden
    const interval = setInterval(fetchTokenData, 30000);
    return () => clearInterval(interval);
  }, [get]);

  return (
    <Main>
      <Box 
        background="neutral0" 
        paddingTop={6}
        paddingBottom={6}
        paddingLeft={7}
        paddingRight={7}
        hasRadius
        shadow="tableShadow"
      >
        <Flex direction="column" gap={5}>
          <Flex justifyContent="space-between" alignItems="center" gap={4}>
            <Flex direction="column" alignItems="center">
              <Typography variant="alpha" fontWeight="bold" textColor="neutral900">
                Magic Link Verwaltung
              </Typography>
              <Box paddingTop={1}>
                <Typography variant="zeta" textColor="neutral600" textAlign="center">
                  Zentrale Übersicht für Magic Links und JWT-Sessions
                </Typography>
              </Box>
            </Flex>
            

          </Flex>

          <Divider />

          {/* Tab Navigation */}
          <Box padding={1} background="neutral100" hasRadius>
            <Flex gap={2} justifyContent="center" padding={2}>
              <Button
                variant={activeTab === 'dashboard' ? "primary" : "tertiary"}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </Button>
              <Button
                variant={activeTab === 'features' ? "primary" : "tertiary"}
                onClick={() => setActiveTab('features')}
              >
                Funktionen
              </Button>
              <Button
                variant={activeTab === 'status' ? "primary" : "tertiary"}
                onClick={() => setActiveTab('status')}
              >
                System-Status
              </Button>
            </Flex>
          </Box>
          
          {/* Tab Content */}
          {activeTab === 'dashboard' && (
            <Box paddingTop={4}>
              <Flex direction="column" gap={4}>
                {/* Statistik-Karten */}
                <Flex gap={4} wrap="wrap" style={{ margin: '-8px' }}>
                  <Box padding={2} style={{ flex: '1 1 25%', minWidth: '250px' }}>
                    <Card shadow="tableShadow" background="neutral0" hasRadius height="100%">
                      <Box padding={4}>
                        <Flex direction="column" gap={2}>
                          <Box paddingBottom={1} style={{ textAlign: 'right' }}>
                            <Box background="primary100" padding={2} style={{ display: 'inline-block', borderRadius: '50%' }}>
                              <Key width="1.5rem" height="1.5rem" color="primary600" />
                            </Box>
                            <Badge active style={{ marginLeft: '0.5rem' }}>AKTIV</Badge>
                          </Box>
                          <Box>
                            <Flex direction="column" gap={1}>
                              <Typography variant="beta" fontWeight="bold" textColor="primary700">
                                {stats.activeTokens}
                              </Typography>
                              <Typography 
                                variant="zeta" 
                                textColor="neutral500"
                                fontWeight="medium"
                                textTransform="uppercase"
                              >
                                Aktive Tokens
                              </Typography>
                            </Flex>
                          </Box>
                          <Typography variant="pi" textColor="neutral500">
                            Letzte Aktualisierung: {new Date().toLocaleTimeString()}
                          </Typography>
                        </Flex>
                      </Box>
                    </Card>
                  </Box>

                  <Box padding={2} style={{ flex: '1 1 25%', minWidth: '250px' }}>
                    <Card shadow="tableShadow" background="neutral0" hasRadius height="100%">
                      <Box padding={4}>
                        <Flex direction="column" gap={2}>
                          <Box paddingBottom={1} style={{ textAlign: 'right' }}>
                            <Box background="secondary100" padding={2} style={{ display: 'inline-block', borderRadius: '50%' }}>
                              <User width="1.5rem" height="1.5rem" color="secondary600" />
                            </Box>
                            <Badge active style={{ marginLeft: '0.5rem' }}>AKTIV</Badge>
                          </Box>
                          <Box>
                            <Flex direction="column" gap={1}>
                              <Typography 
                                variant="beta" 
                                fontWeight="bold" 
                                textColor="primary700"
                              >
                                {stats.usersUsingMagicLink}
                              </Typography>
                              <Typography 
                                variant="zeta" 
                                textColor="neutral500"
                                fontWeight="medium"
                                textTransform="uppercase"
                              >
                                Benutzer mit Magic Link
                              </Typography>
                            </Flex>
                          </Box>
                          <Flex justifyContent="space-between" style={{ marginTop: 'auto' }}>
                            <Typography variant="pi" textColor="neutral600">
                              Neu heute:
                            </Typography>
                            <Typography variant="pi" fontWeight="bold">
                              {stats.tokenCreatedLast24h}
                            </Typography>
                          </Flex>
                        </Flex>
                      </Box>
                    </Card>
                  </Box>

                  <Box padding={2} style={{ flex: '1 1 25%', minWidth: '250px' }}>
                    <Card shadow="tableShadow" background="neutral0" hasRadius height="100%">
                      <Box padding={4}>
                        <Flex direction="column" gap={2}>
                          <Box paddingBottom={1} style={{ textAlign: 'right' }}>
                            <Box background="success100" padding={2} style={{ display: 'inline-block', borderRadius: '50%' }}>
                              <Calendar width="1.5rem" height="1.5rem" color="success600" />
                            </Box>
                            <Badge style={{ marginLeft: '0.5rem' }}>LETZTE 24H</Badge>
                          </Box>
                          <Box>
                            <Flex direction="column" gap={0}>
                              <Typography 
                                variant="gamma"  // Changed from beta to gamma for even smaller size
                                fontWeight="bold" 
                                textColor="primary700"
                              >
                                {stats.tokenUsage}%
                              </Typography>
                              <Typography 
                                variant="zeta" 
                                textColor="neutral500"
                                fontWeight="medium"
                                textTransform="uppercase"
                                style={{ fontSize: '0.75rem' }}  // Added explicit smaller font size
                              >
                                Token-Nutzung
                              </Typography>
                            </Flex>
                          </Box>
                          <Box paddingTop={1}>
                            <ProgressBar value={stats.tokenUsage} size="S" />
                            <Flex justifyContent="space-between" paddingTop={1}>
                              <Typography variant="pi" textColor="neutral600">
                                Erstellt:
                              </Typography>
                              <Typography variant="pi" fontWeight="bold">
                                {stats.tokenCreatedLast24h}
                              </Typography>
                            </Flex>
                          </Box>
                        </Flex>
                      </Box>
                    </Card>
                  </Box>

                  <Box padding={2} style={{ flex: '1 1 25%', minWidth: '250px' }}>
                    <Card shadow="tableShadow" background="neutral0" hasRadius height="100%">
                      <Box padding={4}>
                        <Flex direction="column" gap={2}>
                          <Box paddingBottom={1} style={{ textAlign: 'right' }}>
                            <Box background="danger100" padding={2} style={{ display: 'inline-block', borderRadius: '50%' }}>
                              <Shield width="1.5rem" height="1.5rem" color="danger600" />
                            </Box>
                            <Badge style={{ marginLeft: '0.5rem' }}>SICHERHEIT</Badge>
                          </Box>
                          <Box>
                            <Flex direction="column" gap={1}>
                              <Typography 
                                variant="beta" 
                                fontWeight="bold"
                                textColor="primary700"
                              >
                                {stats.securityScore}/100
                              </Typography>
                              <Box paddingTop={1}>
                                <Typography 
                                  variant="zeta"
                                  textColor="neutral600"
                                  fontWeight="medium"
                                  textTransform="uppercase"
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  Sicherheitswert
                                </Typography>
                              </Box>
                            </Flex>
                          </Box>
                          <Box paddingTop={1}>
                            <ProgressBar value={stats.securityScore} size="S" />
                            <Flex justifyContent="space-between" paddingTop={1}>
                              <Typography variant="pi" textColor="neutral600">
                                Ablaufend (3 Tage):
                              </Typography>
                              <Typography variant="pi" fontWeight="bold">
                                {stats.tokenExpiresNextDays}
                              </Typography>
                            </Flex>
                          </Box>
                        </Flex>
                      </Box>
                    </Card>
                  </Box>
                </Flex>

                {/* Aktionsfläche */}
                <Box paddingTop={4}>
                  <Typography variant="delta" fontWeight="bold" marginBottom={4}>
                    Schnellzugriff
                  </Typography>
                  <br />
                  <Flex gap={4} wrap="wrap" marginTop={4}>
                    <Box style={{ flex: '1 1 50%', minWidth: '300px' }}>
                      <Card shadow="tableShadow" hasRadius>
                        <Flex gap={3} alignItems="center" padding={4}>
                          <Box background="primary100" padding={3} hasRadius>
                            <ExternalLink width="1.5rem" height="1.5rem" color="primary600" />
                          </Box>
                          <Box style={{ flex: 1 }}>
                            <Typography variant="delta">Token-Verwaltung</Typography>
                            <br></br>
                            <Typography variant="pi" textColor="neutral600">
                              Aktive Tokens anzeigen und verwalten
                            </Typography>
                          </Box>
                          <Button 
                            variant="default"
                            endIcon={<ArrowRight />}
                            onClick={() => {
                              window.location.href = '/admin/plugins/magic-link/tokens';
                            }}
                          >
                            Öffnen
                          </Button>
                        </Flex>
                      </Card>
                    </Box>

                    <Box style={{ flex: '1 1 50%', minWidth: '300px' }}>
                      <Card shadow="tableShadow" hasRadius>
                        <Flex gap={3} alignItems="center" padding={4}>
                          <Box background="secondary100" padding={3} hasRadius>
                            <Cog width="1.5rem" height="1.5rem" color="secondary600" />
                          </Box>
                          <Box style={{ flex: 1 }}>
                            <Typography variant="delta">Plugin-Einstellungen</Typography>
                            <br></br>
                            <Typography variant="pi" textColor="neutral600">
                              Plugin konfigurieren und anpassen
                            </Typography>
                          </Box>
                          <Button 
                            variant="default"
                            endIcon={<ArrowRight />}
                            onClick={() => {
                              window.location.href = '/admin/settings/magic-link';
                            }}
                          >
                            Öffnen
                          </Button>
                        </Flex>
                      </Card>
                    </Box>
                  </Flex>
                </Box>
              </Flex>
            </Box>
          )}
          
          {activeTab === 'features' && (
            <Box padding={6}>
              <Flex wrap="wrap" gap={4} style={{ margin: '-8px' }}>
                <Box padding={2} style={{ flex: '1 1 33.33%', minWidth: '300px' }}>
                  <Card shadow="tableShadow" hasRadius height="100%">
                    <Flex direction="column" gap={4} style={{ alignItems: 'center', justifyContent: 'space-between', height: '100%' }} padding={5}>
                      <Box
                        background="primary100"
                        borderRadius="50%"
                        width={80}
                        height={80}
                        shadow="tableShadow"
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <PuzzlePiece width="2.5rem" height="2.5rem" color="primary600" />
                      </Box>
                      <Box style={{ textAlign: 'center' }}>
                        <Box textAlign="center">
                          <Typography 
                            variant="delta" 
                            as="h3" 
                            fontWeight="bold" 
                            paddingBottom={2}
                          >
                            Magic Link Authentifizierung
                          </Typography>
                          <Typography 
                            variant="epsilon" 
                            textColor="neutral600" 
                            paddingTop={2}
                          >
                            Sichere, passwortlose Authentifizierung via E-Mail-Link
                          </Typography>
                        </Box>
                      </Box>
                      <Box paddingTop={2}>
                        <Badge active>Aktiviert</Badge>
                      </Box>
                    </Flex>
                  </Card>
                </Box>

                <Box padding={2} style={{ flex: '1 1 33.33%', minWidth: '300px' }}>
                  <Card shadow="tableShadow" hasRadius height="100%">
                    <Flex direction="column" gap={4} style={{ alignItems: 'center', justifyContent: 'space-between', height: '100%' }} padding={5}>
                      <Box
                        background="success100"
                        borderRadius="50%"
                        width={80}
                        height={80}
                        shadow="tableShadow"
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Key width="2.5rem" height="2.5rem" color="success600" />
                      </Box>
                      <Box style={{ textAlign: 'center' }}>
                        <Typography 
                          variant="delta" 
                          fontWeight="bold" 
                          textColor="neutral800" 
                          paddingBottom={3}
                        >
                          Token-Management
                        </Typography>
                        <br />
                        <Typography 
                          variant="epsilon" 
                          textColor="neutral600" 
                          paddingBottom={1}
                        >
                          Verwalten und überwachen Sie aktive Anmelde-Tokens
                        </Typography>
                        <Typography 
                          variant="epsilon" 
                          textColor="neutral600" 
                          paddingTop={1}
                        >
                          Kontrollieren Sie die Sicherheit Ihrer Authentifizierungen
                        </Typography>
                      </Box>
                      <Box style={{ marginTop: 'auto', width: '100%', textAlign: 'center' }}>
                        <Button
                          variant="secondary"
                          startIcon={<Key />}
                          endIcon={<ArrowRight />}
                          onClick={() => {
                            window.location.href = '/admin/plugins/magic-link/tokens';
                          }}
                        >
                          Tokens verwalten
                        </Button>
                      </Box>
                    </Flex>
                  </Card>
                </Box>

                <Box padding={2} style={{ flex: '1 1 33.33%', minWidth: '300px' }}>
                  <Card shadow="tableShadow" hasRadius height="100%">
                    <Flex direction="column" gap={4} style={{ alignItems: 'center', justifyContent: 'space-between', height: '100%' }} padding={5}>
                      <Box
                        background="danger100"
                        borderRadius="50%"
                        width={80}
                        height={80}
                        shadow="tableShadow"
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Shield width="2.5rem" height="2.5rem" color="danger600" />
                      </Box>
                      <Box style={{ textAlign: 'center' }}>
                        <Typography variant="delta" textAlign="center" fontWeight="bold" paddingBottom={2}>
                          JWT-Session-Verwaltung
                        </Typography>
                        <br />
                        <Typography textAlign="center" variant="epsilon">
                          Überwachen Sie aktive JWT-Sessions und erhöhen Sie die Sicherheit Ihrer Anwendung.
                        </Typography>
                      </Box>
                      <Box style={{ marginTop: 'auto', width: '100%', textAlign: 'center' }}>
                        <Button
                          variant="secondary"
                          startIcon={<Shield />}
                          endIcon={<ArrowRight />}
                          onClick={() => {
                            window.location.href = '/admin/settings/magic-link';
                          }}
                        >
                          Einstellungen öffnen
                        </Button>
                      </Box>
                    </Flex>
                  </Card>
                </Box>
              </Flex>
            </Box>
          )}
          
          {activeTab === 'status' && (
            <Box padding={6}>
              <Card shadow="tableShadow" hasRadius>
                <Box padding={5}>
                  <Box paddingBottom={4}>
                    <Typography variant="delta" fontWeight="bold">
                      System-Status
                    </Typography>
                  </Box>
                  <Divider />
                  <Flex direction="column" alignItems="center" gap={4} padding={4}>
                    <Box textAlign="center" paddingBottom={3}>
                      <Flex gap={2} justifyContent="center" alignItems="center" paddingBottom={2}>
                        <Check width="1rem" color="success600" />
                        <Typography fontWeight="bold">Magic Link Status</Typography>
                      </Flex>
                      <Badge active>Aktiv</Badge>
                    </Box>
                    
                    <Box textAlign="center" paddingBottom={3}>
                      <Flex gap={2} justifyContent="center" alignItems="center" paddingBottom={2}>
                        <Check width="1rem" color="success600" />
                        <Typography fontWeight="bold">JWT Sessions</Typography>
                      </Flex>
                      <Badge active>Funktioniert</Badge>
                    </Box>
                    
                    <Box textAlign="center" paddingBottom={3}>
                      <Flex gap={2} justifyContent="center" alignItems="center" paddingBottom={2}>
                        <Check width="1rem" color="success600" />
                        <Typography fontWeight="bold">E-Mail-Versand</Typography>
                      </Flex>
                      <Badge active>Konfiguriert</Badge>
                    </Box>
                    <Divider />
                    
                    <Flex direction="column" gap={1}>
                      <Typography variant="pi" textColor="neutral600">
                        Plugin Version
                      </Typography>
                      <Typography variant="pi" fontWeight="bold">1.2.0</Typography>
                    </Flex>
                    <Flex direction="column" gap={1}>
                      <Typography variant="pi" textColor="neutral600">
                        Strapi Version
                      </Typography>
                      <Typography variant="pi" fontWeight="bold">5.0.0</Typography>
                    </Flex>
                    <Flex direction="column" gap={1}>
                      <Typography variant="pi" textColor="neutral600">
                        Letzter API-Aufruf
                      </Typography>
                      <Typography variant="pi" fontWeight="bold">
                        {new Date().toLocaleString()}
                      </Typography>
                    </Flex>
                    <Flex direction="column" gap={1}>
                      <Typography variant="pi" textColor="neutral600">
                        Browser
                      </Typography>
                      <Typography variant="pi" fontWeight="bold">
                        {window.navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                         window.navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                         window.navigator.userAgent.includes('Safari') ? 'Safari' : 'Unbekannt'}
                      </Typography>
                    </Flex>
                  </Flex>
                </Box>
              </Card>

              <Box paddingTop={4}>
                <Card shadow="tableShadow" hasRadius>
                  <Box padding={5}>
                    <Box paddingBottom={2}>
                      <Typography variant="delta" fontWeight="bold">
                        Debug-Informationen
                      </Typography>
                    </Box>
                    <Divider />
                    <Box as="pre" padding={4} background="neutral100" marginTop={4} hasRadius style={{overflow: 'auto'}}>
                      Current Path: {window.location.pathname}<br/>
                      Plugin ID: magic-link<br/>
                      HomePage Component Status: Loaded<br/>
                      Session Active: Yes<br/>
                      Current Time: {new Date().toLocaleString()}<br/>
                      User Agent: {window.navigator.userAgent}
                    </Box>
                  </Box>
                </Card>
              </Box>
            </Box>
          )}
        </Flex>
      </Box>

      <Box
        background="primary100"
        padding={5}
        marginTop={6}
        hasRadius
        borderColor="primary200"
        borderWidth="1px"
        borderStyle="solid"
      >
      </Box>
    </Main>
  );
};

export default HomePage;
