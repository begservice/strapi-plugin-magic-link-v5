import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  Flex,
  TextInput,
  Typography,
  Toggle,
  Badge,
  Loader,
} from '@strapi/design-system';
import { Check, Cross, ArrowClockwise, Phone, Message } from '@strapi/icons';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import getTrad from '../../utils/getTrad';

// ================ THEME ================
const theme = {
  colors: {
    primary: { 600: '#0284C7', 700: '#075985', 100: '#E0F2FE', 50: '#F0F9FF' },
    success: { 600: '#16A34A', 700: '#15803D', 100: '#DCFCE7', 50: '#F0FDF4' },
    danger: { 600: '#DC2626', 700: '#B91C1C', 100: '#FEE2E2', 50: '#FEF2F2' },
    warning: { 600: '#D97706', 700: '#A16207', 100: '#FEF3C7', 50: '#FFFBEB' },
    whatsapp: { 600: '#25D366', 700: '#128C7E', 100: '#D1FAE5' },
    neutral: { 0: '#FFFFFF', 50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 400: '#9CA3AF', 600: '#4B5563', 700: '#374151', 800: '#1F2937' }
  },
  shadows: { sm: '0 1px 3px rgba(0,0,0,0.1)', md: '0 4px 6px rgba(0,0,0,0.1)', xl: '0 20px 25px rgba(0,0,0,0.1)' },
  borderRadius: { md: '8px', lg: '12px', xl: '16px' }
};

// ================ STYLED COMPONENTS ================
const Container = styled(Box)`
  max-width: 900px;
  margin: 0 auto;
  padding: 32px;
`;

const Card = styled(Box)`
  background: white;
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  padding: 24px;
  margin-bottom: 24px;
`;

const QRCodeContainer = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  background: ${theme.colors.neutral[50]};
  border-radius: ${theme.borderRadius.lg};
  border: 2px dashed ${theme.colors.neutral[200]};
  min-height: 280px;
  
  img {
    max-width: 256px;
    border-radius: ${theme.borderRadius.md};
  }
`;

const StatusBadge = styled(Badge)`
  background: ${props => {
    switch(props.$status) {
      case 'connected': return theme.colors.success[100];
      case 'connecting': return theme.colors.warning[100];
      case 'qr_pending': return theme.colors.primary[100];
      default: return theme.colors.danger[100];
    }
  }};
  color: ${props => {
    switch(props.$status) {
      case 'connected': return theme.colors.success[700];
      case 'connecting': return theme.colors.warning[700];
      case 'qr_pending': return theme.colors.primary[700];
      default: return theme.colors.danger[700];
    }
  }};
  font-weight: 600;
  padding: 8px 16px;
  font-size: 14px;
`;

const WhatsAppIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${theme.colors.whatsapp[600]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
`;

// ================ COMPONENT ================
const WhatsAppPage = () => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const { get, post } = useFetchClient();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({
    available: false,
    status: 'disconnected',
    qrCode: null,
    session: null,
    delegatedTo: null,
  });
  const [settings, setSettings] = useState({
    whatsapp_enabled: false,
    whatsapp_app_name: 'Magic Link',
  });
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await get('/magic-link/whatsapp/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching WhatsApp status:', error);
    }
  }, [get]);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const response = await get('/magic-link/settings');
      setSettings(response.data || {});
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, [get]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStatus(), fetchSettings()]);
      setLoading(false);
    };
    init();
  }, [fetchStatus, fetchSettings]);

  // Poll for status updates when connecting
  useEffect(() => {
    if (status.status === 'connecting' || status.status === 'qr_pending') {
      const interval = setInterval(fetchStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [status.status, fetchStatus]);

  // Connect to WhatsApp
  const handleConnect = async () => {
    setConnecting(true);
    try {
      await post('/magic-link/whatsapp/connect');
      await fetchStatus();
      toggleNotification({
        type: 'success',
        message: formatMessage({ id: getTrad('whatsapp.notifications.connecting') }),
      });
    } catch (error) {
      toggleNotification({
        type: 'warning',
        message: error.response?.data?.error?.message || 'Connection failed',
      });
    }
    setConnecting(false);
  };

  // Disconnect
  const handleDisconnect = async () => {
    try {
      await post('/magic-link/whatsapp/disconnect');
      await fetchStatus();
      toggleNotification({
        type: 'success',
        message: formatMessage({ id: getTrad('whatsapp.notifications.disconnected') }),
      });
    } catch (error) {
      toggleNotification({
        type: 'warning',
        message: 'Disconnect failed',
      });
    }
  };

  // Send test message
  const handleTestMessage = async () => {
    if (!testPhone) {
      toggleNotification({
        type: 'warning',
        message: formatMessage({ id: getTrad('whatsapp.notifications.phoneRequired') }),
      });
      return;
    }

    setSending(true);
    try {
      const response = await post('/magic-link/whatsapp/test-message', {
        phoneNumber: testPhone,
        message: testMessage || undefined,
      });

      if (response.data.success) {
        toggleNotification({
          type: 'success',
          message: formatMessage({ id: getTrad('whatsapp.notifications.messageSent') }),
        });
        setTestMessage('');
      } else {
        toggleNotification({
          type: 'warning',
          message: response.data.error || 'Failed to send',
        });
      }
    } catch (error) {
      toggleNotification({
        type: 'warning',
        message: error.response?.data?.error?.message || 'Failed to send message',
      });
    }
    setSending(false);
  };

  /**
   * Returns the status label text based on current connection status
   * @returns {string} Human-readable status label
   */
  const getStatusLabel = () => {
    switch(status.status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'qr_pending': return 'Scan QR Code';
      case 'not_installed': return 'Baileys not installed';
      default: return 'Disconnected';
    }
  };

  if (loading) {
    return (
      <Container>
        <Flex justifyContent="center" padding={8}>
          <Loader />
        </Flex>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <Box marginBottom={6}>
        <Flex justifyContent="space-between" alignItems="flex-start" marginBottom={2}>
          <Flex alignItems="center" gap={4}>
            <WhatsAppIcon><Phone /></WhatsAppIcon>
            <Typography variant="alpha" fontWeight="bold">
              {formatMessage({ id: getTrad('whatsapp.title') })}
            </Typography>
          </Flex>
          <StatusBadge $status={status.status}>
            {getStatusLabel()}
          </StatusBadge>
        </Flex>
        <Typography variant="epsilon" textColor="neutral600" style={{ marginLeft: '64px' }}>
          {formatMessage({ id: getTrad('whatsapp.subtitle') })}
        </Typography>
      </Box>

      {/* Magic-Mail Delegation Info */}
      {status.delegatedTo === 'magic-mail' && (
        <Card style={{ background: theme.colors.primary[50], border: `2px solid ${theme.colors.primary[100]}` }}>
          <Typography variant="delta" fontWeight="bold" style={{ display: 'block', marginBottom: '12px' }}>
            WhatsApp managed by Magic-Mail
          </Typography>
          <Typography variant="pi" textColor="neutral600" style={{ display: 'block', lineHeight: '1.6', marginBottom: '16px' }}>
            Magic-Mail plugin is installed and handles the WhatsApp connection. You only need to scan the QR code once in Magic-Mail, and both plugins will share the same WhatsApp session.
          </Typography>
          <Box style={{ padding: '12px', background: theme.colors.neutral[100], borderRadius: theme.borderRadius.md }}>
            <Typography variant="pi" fontWeight="bold" style={{ display: 'block', marginBottom: '8px' }}>
              Go to: Plugins → Magic-Mail → WhatsApp
            </Typography>
            <Typography variant="pi" textColor="neutral500">
              All WhatsApp settings and connection management is done there.
            </Typography>
          </Box>
        </Card>
      )}

      {/* Not Available Warning */}
      {!status.available && !status.delegatedTo && (
        <Card style={{ background: theme.colors.warning[50], border: `2px solid ${theme.colors.warning[100]}` }}>
          <Typography variant="delta" fontWeight="bold" style={{ display: 'block', marginBottom: '12px' }}>
            {formatMessage({ id: getTrad('whatsapp.notInstalled.title') })}
          </Typography>
          <Typography variant="pi" textColor="neutral600" style={{ display: 'block', lineHeight: '1.6', marginBottom: '16px' }}>
            {formatMessage({ id: getTrad('whatsapp.notInstalled.description') })}
          </Typography>
          <Box style={{ padding: '12px', background: theme.colors.neutral[100], borderRadius: theme.borderRadius.md }}>
            <code style={{ fontSize: '14px' }}>npm install @whiskeysockets/baileys pino</code>
          </Box>
        </Card>
      )}

      {/* Connection Card - Only show if not delegated to Magic-Mail */}
      {status.available && !status.delegatedTo && (
        <Card>
          <Typography variant="delta" fontWeight="bold" marginBottom={4}>
            {formatMessage({ id: getTrad('whatsapp.connection.title') })}
          </Typography>

          {/* QR Code Section */}
          {(status.status === 'qr_pending' || status.status === 'disconnected' || status.status === 'connecting') && (
            <QRCodeContainer>
              {status.qrCode ? (
                <Box textAlign="center">
                  <img src={status.qrCode} alt="WhatsApp QR Code" />
                  <Typography variant="pi" textColor="neutral600" style={{ marginTop: '16px', display: 'block' }}>
                    {formatMessage({ id: getTrad('whatsapp.qr.instruction') })}
                  </Typography>
                </Box>
              ) : (
                <Flex direction="column" alignItems="center" gap={4}>
                  <Typography variant="pi" textColor="neutral600">
                    {status.status === 'connecting' 
                      ? formatMessage({ id: getTrad('whatsapp.connection.generating') })
                      : formatMessage({ id: getTrad('whatsapp.connection.clickToConnect') })
                    }
                  </Typography>
                  {status.status !== 'connecting' && (
                    <Button 
                      onClick={handleConnect} 
                      loading={connecting}
                      startIcon={<Phone />}
                      style={{ background: theme.colors.whatsapp[600] }}
                    >
                      {formatMessage({ id: getTrad('whatsapp.actions.connect') })}
                    </Button>
                  )}
                </Flex>
              )}
            </QRCodeContainer>
          )}

          {/* Connected State */}
          {status.status === 'connected' && (
            <Box>
              <Flex 
                alignItems="flex-start" 
                justifyContent="space-between"
                padding={4}
                background="success100"
                style={{ borderRadius: theme.borderRadius.md, marginBottom: '16px' }}
              >
                <Flex alignItems="flex-start" gap={3}>
                  <Check style={{ color: theme.colors.success[600], marginTop: '4px' }} />
                  <Box>
                    <Typography variant="delta" fontWeight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                      {formatMessage({ id: getTrad('whatsapp.connected.title') })}
                    </Typography>
                    {status.session && (
                      <Typography variant="pi" textColor="neutral600" style={{ display: 'block' }}>
                        {status.session.phoneNumber} • {status.session.name || 'WhatsApp User'}
                      </Typography>
                    )}
                  </Box>
                </Flex>
                <Button variant="danger" onClick={handleDisconnect} size="S">
                  {formatMessage({ id: getTrad('whatsapp.actions.disconnect') })}
                </Button>
              </Flex>

              {/* Test Message */}
              <Box style={{ marginTop: '24px' }}>
                <Typography variant="delta" fontWeight="bold" style={{ display: 'block', marginBottom: '16px' }}>
                  {formatMessage({ id: getTrad('whatsapp.test.title') })}
                </Typography>
                <Flex gap={3} alignItems="flex-start">
                  <Box style={{ flex: 1 }}>
                    <TextInput
                      placeholder="491234567890"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                    />
                  </Box>
                  <Button 
                    onClick={handleTestMessage} 
                    loading={sending}
                    startIcon={<Message />}
                  >
                    {formatMessage({ id: getTrad('whatsapp.actions.sendTest') })}
                  </Button>
                </Flex>
              </Box>
            </Box>
          )}

          {/* Refresh Button */}
          <Flex justifyContent="center" marginTop={4}>
            <Button variant="tertiary" onClick={fetchStatus} startIcon={<ArrowClockwise />}>
              {formatMessage({ id: getTrad('whatsapp.actions.refresh') })}
            </Button>
          </Flex>
        </Card>
      )}

      {/* Info Card - Only show when not delegated */}
      {!status.delegatedTo && (
        <Card style={{ background: theme.colors.primary[50], border: `2px solid ${theme.colors.primary[100]}` }}>
          <Typography variant="delta" fontWeight="bold" style={{ display: 'block', marginBottom: '12px' }}>
            {formatMessage({ id: getTrad('whatsapp.info.title') })}
          </Typography>
          <Typography variant="pi" textColor="neutral700" style={{ display: 'block', lineHeight: '1.6', marginBottom: '16px' }}>
            {formatMessage({ id: getTrad('whatsapp.info.description') })}
          </Typography>
          <Box style={{ marginTop: '16px' }}>
            <Typography variant="pi" fontWeight="bold" style={{ display: 'block', marginBottom: '8px' }}>
              {formatMessage({ id: getTrad('whatsapp.info.apiExample') })}
            </Typography>
            <Box style={{ padding: '12px', background: theme.colors.neutral[800], borderRadius: theme.borderRadius.md, color: '#fff', fontFamily: 'monospace', fontSize: '13px' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`POST /api/magic-link/send-link
{
  "email": "user@example.com",
  "phoneNumber": "491234567890",
  "delivery": "whatsapp"
}`}
              </pre>
            </Box>
          </Box>
        </Card>
      )}
    </Container>
  );
};

export default WhatsAppPage;

