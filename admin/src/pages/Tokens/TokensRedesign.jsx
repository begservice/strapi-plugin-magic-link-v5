import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
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
  IconButton,
  Grid,
  Tooltip,
  Modal,
  TextInput,
  Field,
  Checkbox,
} from '@strapi/design-system';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { 
  Plus, 
  ArrowLeft, 
  ArrowRight,
  Key, 
  Shield, 
  Earth,
  PaintBrush,
  ChartBubble,
  Server,
  Clock,
  Eye,
  Trash,
  Mail,
  Cross,
  WarningCircle,
  Check,
  Pencil,
  User,
  Calendar,
  Lock,
  ArrowClockwise
} from '@strapi/icons';
import CreateTokenModal from './CreateTokenModal';

// ================ ANIMATIONEN ================
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// ================ STYLED COMPONENTS ================
const PageWrapper = styled(Box)`
  animation: ${fadeIn} 0.6s ease;
`;

const GradientHeader = styled(Box)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px;
  padding: 40px;
  margin-bottom: 32px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 40px -12px rgba(102, 126, 234, 0.35);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 200%;
    height: 100%;
    background: linear-gradient(
      90deg, 
      transparent, 
      rgba(255, 255, 255, 0.1), 
      transparent
    );
    animation: ${shimmer} 3s infinite;
  }
  
  &::after {
    content: '✨';
    position: absolute;
    top: 20px;
    right: 20px;
    font-size: 48px;
    opacity: 0.1;
    animation: ${pulse} 2s infinite;
  }
`;

const HeaderTitle = styled(Typography)`
  color: white;
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const HeaderSubtitle = styled(Typography)`
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  font-weight: 400;
`;

const GlassButton = styled(Button)`
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const StatsGrid = styled(Grid.Root)`
  margin-bottom: 32px;
`;

const StatsCard = styled(Box)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 28px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: ${fadeIn} 0.6s ease backwards;
  animation-delay: ${props => props.$delay || '0s'};
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 
      0 20px 40px -12px rgba(0, 0, 0, 0.15),
      0 0 0 1px rgba(102, 126, 234, 0.1);
    
    .icon-wrapper {
      transform: rotate(-5deg) scale(1.1);
    }
    
    .stat-value {
      transform: scale(1.1);
    }
  }
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle, 
      ${props => props.$gradientColor || 'rgba(102, 126, 234, 0.08)'} 0%, 
      transparent 70%
    );
    pointer-events: none;
  }
`;

const IconWrapper = styled(Box)`
  padding: 18px;
  border-radius: 18px;
  display: inline-flex;
  transition: all 0.3s ease;
  background: ${props => props.$bgColor || 'rgba(102, 126, 234, 0.1)'};
  
  svg {
    width: 32px;
    height: 32px;
    color: ${props => props.$iconColor || '#667eea'};
  }
`;

const StatValue = styled(Typography)`
  font-size: 42px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: transform 0.3s ease;
  margin: 16px 0 8px;
`;

const TabContainer = styled(Flex)`
  margin-bottom: 32px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07);
`;

const TabButton = styled(Button)`
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  ${props => props.$active && `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    transform: scale(1.05);
    box-shadow: 0 8px 16px -4px rgba(102, 126, 234, 0.4);
    
    &:hover {
      transform: scale(1.08);
    }
  `}
  
  ${props => !props.$active && `
    background: transparent;
    color: #4a5568;
    
    &:hover {
      background: rgba(102, 126, 234, 0.08);
      transform: translateY(-2px);
    }
  `}
`;

const StyledTable = styled(Table)`
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07);
  background: white;
  
  thead {
    background: linear-gradient(135deg, #f7f9fc 0%, #f1f3f8 100%);
    
    th {
      font-weight: 600;
      color: #2d3748;
      border-bottom: 2px solid #e2e8f0;
      padding: 16px;
    }
  }
  
  tbody tr {
    transition: all 0.2s ease;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    
    &:hover {
      background: linear-gradient(90deg, 
        rgba(102, 126, 234, 0.02) 0%, 
        rgba(102, 126, 234, 0.04) 50%,
        rgba(102, 126, 234, 0.02) 100%
      );
      transform: translateX(4px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }
    
    td {
      padding: 16px;
    }
  }
`;

const AnimatedBadge = styled(Badge)`
  animation: ${fadeIn} 0.4s ease;
  transition: all 0.2s ease;
  font-weight: 600;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const EmptyStateWrapper = styled(Box)`
  background: linear-gradient(135deg, #f7f9fc 0%, #ffffff 100%);
  border-radius: 24px;
  padding: 80px 40px;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '🎯';
    position: absolute;
    top: 30px;
    right: 30px;
    font-size: 60px;
    opacity: 0.05;
    animation: ${rotate} 20s linear infinite;
  }
  
  &::after {
    content: '✨';
    position: absolute;
    bottom: 30px;
    left: 30px;
    font-size: 60px;
    opacity: 0.05;
    animation: ${pulse} 2s ease infinite;
  }
`;

const LoadingWrapper = styled(Flex)`
  min-height: 400px;
  justify-content: center;
  align-items: center;
  
  .loader {
    animation: ${rotate} 1s linear infinite;
  }
`;

const ActionIconButton = styled(IconButton)`
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: scale(1.2) rotate(5deg);
    background: rgba(102, 126, 234, 0.1);
  }
`;

// ================ HAUPTKOMPONENTE ================
const TokensRedesign = () => {
  const { get, post, del } = useFetchClient();
  const { toggleNotification } = useNotification();
  
  // States
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('magic-links');
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: '',
    ttl: 24,
    sendEmail: true
  });
  
  // Stats berechnen
  const stats = {
    total: tokens.length,
    active: tokens.filter(t => !t.expired && !t.used).length,
    expired: tokens.filter(t => t.expired).length,
    used: tokens.filter(t => t.used).length,
  };
  
  // Stat Cards Konfiguration
  const statCards = [
    {
      title: 'Alle Tokens',
      value: stats.total,
      icon: Server,
      bgColor: 'rgba(102, 126, 234, 0.1)',
      iconColor: '#667eea',
      delay: '0s'
    },
    {
      title: 'Aktive Tokens',
      value: stats.active,
      icon: ChartBubble,
      bgColor: 'rgba(52, 211, 153, 0.1)',
      iconColor: '#10b981',
      delay: '0.1s'
    },
    {
      title: 'Abgelaufene',
      value: stats.expired,
      icon: Clock,
      bgColor: 'rgba(147, 51, 234, 0.1)',
      iconColor: '#8b5cf6',
      delay: '0.2s'
    },
    {
      title: 'Verwendet',
      value: stats.used,
      icon: Check,
      bgColor: 'rgba(251, 146, 60, 0.1)',
      iconColor: '#f59e0b',
      delay: '0.3s'
    }
  ];
  
  // Fetch Tokens
  useEffect(() => {
    fetchTokens();
  }, []);
  
  const fetchTokens = async () => {
    setIsLoading(true);
    try {
      const response = await get('/magic-link/tokens');
      setTokens(response?.data?.data || response?.data || []);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toggleNotification({
        type: 'warning',
        message: 'Fehler beim Laden der Tokens'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = () => {
    fetchTokens();
    toggleNotification({
      type: 'success',
      message: 'Daten wurden aktualisiert! 🎉'
    });
  };
  
  const handleCreateToken = async () => {
    try {
      if (!createFormData.email) {
        toggleNotification({
          type: 'warning',
          message: 'Bitte gib eine E-Mail-Adresse ein'
        });
        return;
      }
      
      // API-Aufruf zum Erstellen eines neuen Tokens
      const response = await post('/magic-link/tokens', {
        email: createFormData.email,
        send_email: createFormData.sendEmail,
        context: {
          ttl: createFormData.ttl
        }
      });
      
      if (response?.data) {
        toggleNotification({
          type: 'success',
          message: `Token erfolgreich erstellt! 🎉 ${createFormData.sendEmail ? 'E-Mail wurde gesendet.' : ''}`,
        });
        
        // Modal schließen und Formular zurücksetzen
        setShowCreateModal(false);
        setCreateFormData({
          email: '',
          ttl: 24,
          sendEmail: true
        });
        
        // Token-Liste aktualisieren
        await fetchTokens();
      }
    } catch (error) {
      console.error('Error creating token:', error);
      toggleNotification({
        type: 'warning',
        message: error?.response?.data?.error?.message || 'Fehler beim Erstellen des Tokens'
      });
    }
  };
  
  const handleDelete = async (tokenId) => {
    try {
      await del(`/magic-link/tokens/${tokenId}`);
      await fetchTokens();
      toggleNotification({
        type: 'success',
        message: 'Token wurde gelöscht! 🗑️'
      });
    } catch (error) {
      toggleNotification({
        type: 'warning',
        message: 'Fehler beim Löschen des Tokens'
      });
    }
  };
  
  if (isLoading) {
    return (
      <Main>
        <LoadingWrapper>
          <Box className="loader">
            <Loader>Loading...</Loader>
          </Box>
        </LoadingWrapper>
      </Main>
    );
  }
  
  return (
    <Main>
      <PageWrapper paddingBottom={10}>
        {/* Gradient Header */}
        <GradientHeader>
          <Flex justifyContent="space-between" alignItems="center">
            <Box>
              <HeaderTitle as="h1">
                ✨ Token-Verwaltung
              </HeaderTitle>
              <HeaderSubtitle>
                Verwalte deine Magic Link Tokens und JWT-Sessions mit Style
              </HeaderSubtitle>
            </Box>
            <Flex gap={2}>
              <GlassButton
                onClick={() => setShowCreateModal(true)}
                startIcon={<PaintBrush />}
                size="L"
              >
                Token erstellen
              </GlassButton>
              <GlassButton
                onClick={handleRefresh}
                startIcon={<ArrowClockwise />}
                size="L"
              >
                Aktualisieren
              </GlassButton>
              <GlassButton
                onClick={() => window.history.back()}
                startIcon={<ArrowLeft />}
                size="L"
              >
                Zurück
              </GlassButton>
            </Flex>
          </Flex>
        </GradientHeader>
        
        {/* Tab Navigation */}
        <TabContainer gap={2} justifyContent="center">
          <TabButton
            $active={activeTab === 'magic-links'}
            onClick={() => setActiveTab('magic-links')}
            startIcon={<Key />}
            size="L"
          >
            Magic Link Tokens
          </TabButton>
          <TabButton
            $active={activeTab === 'jwt-sessions'}
            onClick={() => setActiveTab('jwt-sessions')}
            startIcon={<Shield />}
            size="L"
          >
            JWT Sessions
          </TabButton>
          <TabButton
            $active={activeTab === 'ip-bans'}
            onClick={() => setActiveTab('ip-bans')}
            startIcon={<Earth />}
            size="L"
          >
            IP-Sperren
          </TabButton>
        </TabContainer>
        
        {/* Statistik Cards */}
        <StatsGrid gap={4}>
          {statCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Grid.Item col={3} key={index}>
                <StatsCard 
                  $gradientColor={stat.bgColor} 
                  $delay={stat.delay}
                >
                  <Flex direction="column" alignItems="center">
                    <IconWrapper 
                      className="icon-wrapper"
                      $bgColor={stat.bgColor}
                      $iconColor={stat.iconColor}
                    >
                      <IconComponent />
                    </IconWrapper>
                    <StatValue className="stat-value">
                      {stat.value}
                    </StatValue>
                    <Typography variant="epsilon" textColor="neutral600">
                      {stat.title}
                    </Typography>
                  </Flex>
                </StatsCard>
              </Grid.Item>
            );
          })}
        </StatsGrid>
        
        {/* Tabellen Bereich */}
        {activeTab === 'magic-links' && (
          <Box>
            {tokens.length === 0 ? (
              <EmptyStateWrapper>
                <EmptyStateLayout
                  icon={<Eye style={{ width: '64px', height: '64px', color: '#667eea' }} />}
                  content={
                    <Box>
                      <Typography variant="alpha" style={{ marginBottom: '12px' }}>
                        Keine Magic Link Tokens vorhanden
                      </Typography>
                      <Typography variant="omega" textColor="neutral600">
                        Erstelle dein erstes Token oder aktualisiere die Ansicht
                      </Typography>
                    </Box>
                  }
                  action={
                    <Flex gap={3} justifyContent="center">
                      <Button
                        onClick={() => setShowCreateModal(true)}
                        startIcon={<Plus />}
                        size="L"
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          fontWeight: '600',
                        }}
                      >
                        Erstes Token erstellen
                      </Button>
                      <Button
                        onClick={handleRefresh}
                        variant="secondary"
                        size="L"
                      >
                        Aktualisieren
                      </Button>
                    </Flex>
                  }
                />
              </EmptyStateWrapper>
            ) : (
              <StyledTable>
                <Thead>
                  <Tr>
                    <Th>
                      <Checkbox />
                    </Th>
                    <Th>Email</Th>
                    <Th>Token</Th>
                    <Th>Status</Th>
                    <Th>Erstellt</Th>
                    <Th>Gültig bis</Th>
                    <Th>Aktionen</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {tokens.map((token) => (
                    <Tr key={token.id}>
                      <Td>
                        <Checkbox
                          value={selectedTokens.includes(token.id)}
                          onCheckedChange={(value) => {
                            if (value) {
                              setSelectedTokens([...selectedTokens, token.id]);
                            } else {
                              setSelectedTokens(selectedTokens.filter(id => id !== token.id));
                            }
                          }}
                        />
                      </Td>
                      <Td>
                        <Flex alignItems="center" gap={2}>
                          <Mail style={{ color: '#667eea' }} />
                          <Typography fontWeight="semiBold">
                            {token.email}
                          </Typography>
                        </Flex>
                      </Td>
                      <Td>
                        <Typography variant="pi" textColor="neutral600">
                          {token.login_token?.substring(0, 20)}...
                        </Typography>
                      </Td>
                      <Td>
                        {token.used ? (
                          <AnimatedBadge variant="secondary">
                            Verwendet
                          </AnimatedBadge>
                        ) : token.expired ? (
                          <AnimatedBadge variant="warning">
                            Abgelaufen
                          </AnimatedBadge>
                        ) : (
                          <AnimatedBadge variant="success">
                            Aktiv
                          </AnimatedBadge>
                        )}
                      </Td>
                      <Td>
                        <Flex alignItems="center" gap={1}>
                          <Calendar style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                          <Typography variant="pi">
                            {new Date(token.created_at).toLocaleDateString('de-DE')}
                          </Typography>
                        </Flex>
                      </Td>
                      <Td>
                        <Flex alignItems="center" gap={1}>
                          <Clock style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
                          <Typography variant="pi">
                            {new Date(token.expires_at).toLocaleDateString('de-DE')}
                          </Typography>
                        </Flex>
                      </Td>
                      <Td>
                        <Flex gap={2}>
                          <Tooltip content="Details">
                            <ActionIconButton
                              icon={<Eye />}
                              variant="ghost"
                            />
                          </Tooltip>
                          <Tooltip content="Bearbeiten">
                            <ActionIconButton
                              icon={<Pencil />}
                              variant="ghost"
                            />
                          </Tooltip>
                          <Tooltip content="Löschen">
                            <ActionIconButton
                              onClick={() => handleDelete(token.id)}
                              icon={<Trash />}
                              variant="ghost"
                            />
                          </Tooltip>
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </StyledTable>
            )}
          </Box>
        )}
        
        {/* Andere Tabs */}
        {activeTab === 'jwt-sessions' && (
          <EmptyStateWrapper>
            <Typography variant="alpha">JWT Sessions</Typography>
            <Typography variant="omega" textColor="neutral600" style={{ marginTop: '12px' }}>
              Kommt bald... 🚀
            </Typography>
          </EmptyStateWrapper>
        )}
        
        {activeTab === 'ip-bans' && (
          <EmptyStateWrapper>
            <Typography variant="alpha">IP-Sperren</Typography>
            <Typography variant="omega" textColor="neutral600" style={{ marginTop: '12px' }}>
              Kommt bald... 🔒
            </Typography>
          </EmptyStateWrapper>
        )}
        
        {/* Create Modal */}
        <CreateTokenModal 
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setCreateFormData({
              email: '',
              ttl: 24,
              sendEmail: true
            });
          }}
          onSubmit={handleCreateToken}
          formData={createFormData}
          setFormData={setCreateFormData}
        />
      </PageWrapper>
    </Main>
  );
};

export default TokensRedesign;
