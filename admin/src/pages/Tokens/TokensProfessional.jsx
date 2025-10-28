import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { useIntl } from 'react-intl';
import CreateTokenModal from './CreateTokenModal';
import ExtendTokenModal from './ExtendTokenModal';
import JWTSessions from './JWTSessions';
import IPBans from './IPBans';
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
  Grid,
  VisuallyHidden,
  Searchbar,
  SingleSelect,
  SingleSelectOption,
  Pagination,
  PreviousLink,
  PageLink,
  NextLink,
  Checkbox,
  IconButton,
} from '@strapi/design-system';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { 
  Plus, 
  ArrowLeft, 
  ArrowRight,
  Key, 
  Shield, 
  Earth,
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
  ArrowClockwise,
  Filter,
  Download,
  Upload,
  Search,
  Duplicate,
  Link,
  Sparkle,
  CaretDown,
  Cog,
} from '@strapi/icons';
import getTrad from '../../utils/getTrad';
import { usePluginLanguage } from '../../components/LanguageProvider';

// ================ DESIGN TOKENS ================
const theme = {
  colors: {
    primary: {
      50: '#F0F9FF',
      100: '#E0F2FE',
      200: '#BAE6FD',
      300: '#7DD3FC',
      400: '#38BDF8',
      500: '#0EA5E9',
      600: '#0284C7',
      700: '#0369A1',
      800: '#075985',
      900: '#0C4A6E',
    },
    secondary: {
      50: '#FAF5FF',
      100: '#F3E8FF',
      200: '#E9D5FF',
      300: '#D8B4FE',
      400: '#C084FC',
      500: '#A855F7',
      600: '#9333EA',
      700: '#7E22CE',
      800: '#6B21A8',
      900: '#581C87',
    },
    success: {
      50: '#F0FDF4',
      100: '#DCFCE7',
      200: '#BBF7D0',
      300: '#86EFAC',
      400: '#4ADE80',
      500: '#22C55E',
      600: '#16A34A',
      700: '#15803D',
      800: '#166534',
      900: '#14532D',
    },
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },
    danger: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444',
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },
    neutral: {
      0: '#FFFFFF',
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
      1000: '#030712',
    }
  },
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  }
};

// ================ ANIMATIONEN ================
const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0%, 100% { 
    transform: scale(1);
    opacity: 1;
  }
  50% { 
    transform: scale(0.95);
    opacity: 0.85;
  }
`;

const shimmer = keyframes`
  0% { 
    background-position: -200% 0; 
  }
  100% { 
    background-position: 200% 0; 
  }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
`;

// ================ RESPONSIVE BREAKPOINTS ================
const breakpoints = {
  mobile: '768px',
  tablet: '1024px',
};

// ================ STYLED COMPONENTS ================
const Container = styled(Box)`
  animation: ${fadeIn} ${theme.transitions.slow};
  min-height: 100vh;
  max-width: 1440px;
  margin: 0 auto;
  padding: ${theme.spacing.xl} ${theme.spacing.lg} 0;
  background: transparent;

  @media (max-width: ${breakpoints.mobile}) {
    padding: ${theme.spacing.md} ${theme.spacing.sm} 0;
  }
`;

const Header = styled(Box)`
  background: linear-gradient(135deg, 
    ${theme.colors.primary[600]} 0%, 
    ${theme.colors.secondary[600]} 100%
  );

  @media (max-width: ${breakpoints.mobile}) {
    padding: ${theme.spacing.lg} ${theme.spacing.md} !important;
    border-radius: ${theme.borderRadius.md} !important;
  }
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.xl} ${theme.spacing['2xl']};
  margin-bottom: ${theme.spacing.xl};
  position: relative;
  overflow: hidden;
  box-shadow: ${theme.shadows.xl};
  
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
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(circle at 20% 80%, transparent 50%, rgba(255, 255, 255, 0.1) 50%);
    background-size: 15px 15px;
    opacity: 0.3;
  }
`;

const HeaderContent = styled(Flex)`
  position: relative;
  z-index: 1;
`;

const Title = styled(Typography)`
  color: ${theme.colors.neutral[0]};
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  
  svg {
    width: 28px;
    height: 28px;
    animation: ${float} 3s ease-in-out infinite;
  }
`;

const Subtitle = styled(Typography)`
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  font-weight: 400;
  margin-top: ${theme.spacing.xs};
  letter-spacing: 0.01em;
`;

const ActionButton = styled(Button)`
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-weight: 600;
  transition: all ${theme.transitions.normal};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width ${theme.transitions.slow}, height ${theme.transitions.slow};
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.xl};
    
    &::before {
      width: 300px;
      height: 300px;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const TabsWrapper = styled(Box)`
  background: ${theme.colors.neutral[0]};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.xs};
  box-shadow: ${theme.shadows.sm};
  margin-bottom: ${theme.spacing.xl};
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
`;

const TabButton = styled(Button)`
  border-radius: ${theme.borderRadius.lg};
  font-weight: 600;
  transition: all ${theme.transitions.normal};
  position: relative;
  
  ${props => props.$active ? css`
    background: ${props.theme.colors.primary600};
    color: ${props.theme.colors.neutral0};
    box-shadow: ${theme.shadows.sm};
    
    &:hover {
      background: ${props.theme.colors.primary700};
      transform: translateY(-1px);
      box-shadow: ${theme.shadows.md};
    }
  ` : css`
    background: ${props.theme.colors.neutral100};
    color: ${props.theme.colors.neutral700};
    border: 1px solid ${props.theme.colors.neutral300};
    
    &:hover {
      background: ${props.theme.colors.neutral200};
      color: ${props.theme.colors.neutral900};
      border-color: ${props.theme.colors.neutral400};
    }
  `}
`;

const StatsGrid = styled(Box)`
  margin-bottom: ${theme.spacing.xl};
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: center;
  flex-wrap: wrap;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
`;

const StatCard = styled(Box)`
  background: ${props => props.theme.colors.neutral0};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  position: relative;
  overflow: hidden;
  transition: all ${theme.transitions.normal};
  animation: ${fadeIn} ${theme.transitions.slow} backwards;
  animation-delay: ${props => props.$delay || '0s'};
  box-shadow: ${theme.shadows.sm};
  border: 1px solid ${props => props.theme.colors.neutral200};
  min-width: 220px;
  max-width: 260px;
  flex: 1;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${theme.shadows.xl};
    border-color: ${props => props.$color || theme.colors.primary[500]};
    
    .stat-icon {
      transform: rotate(10deg) scale(1.1);
    }
    
    .stat-value {
      transform: scale(1.05);
    }
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 120px;
    height: 120px;
    background: radial-gradient(
      circle at center,
      ${props => props.$color || theme.colors.primary[500]}15,
      transparent 70%
    );
    transform: translate(40%, -40%);
  }
`;

const StatIcon = styled(Box)`
  width: 48px;
  height: 48px;
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$bg || theme.colors.primary[100]};
  transition: all ${theme.transitions.normal};
  
  svg {
    width: 24px;
    height: 24px;
    color: ${props => props.$color || theme.colors.primary[600]};
  }
`;

const StatValue = styled(Typography)`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.neutral800};
  line-height: 1;
  margin: ${theme.spacing.sm} 0 ${theme.spacing.xs};
  transition: transform ${theme.transitions.normal};
`;

const StatLabel = styled(Typography)`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.neutral600};
  font-weight: 500;
  letter-spacing: 0.025em;
`;

const DataTable = styled(Box)`
  background: ${props => props.theme.colors.neutral0};
  border-radius: ${theme.borderRadius.xl};
  overflow: hidden;
  box-shadow: ${theme.shadows.sm};
  border: 1px solid ${props => props.theme.colors.neutral200};
`;

const StyledTable = styled(Table)`
  
  thead {
    background: ${props => props.theme.colors.neutral50};
    border-bottom: 1px solid ${props => props.theme.colors.neutral200};
    
    th {
      font-weight: 600;
      color: ${props => props.theme.colors.neutral800};
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: ${theme.spacing.md};
    }
  }
  
  tbody tr {
    transition: all ${theme.transitions.fast};
    border-bottom: 1px solid ${props => props.theme.colors.neutral100};
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background: ${props => props.theme.colors.primary100};
      
      .action-buttons {
        opacity: 1;
      }
    }
    
    td {
      padding: ${theme.spacing.md};
      color: ${props => props.theme.colors.neutral800};
    }
  }
`;

const StyledBadgeWrapper = styled.span`
  display: inline-block;
  animation: ${slideIn} ${theme.transitions.normal};
  
  &:hover {
    transform: scale(1.05);
  }
`;

const AnimatedBadge = ({ variant, children }) => (
  <StyledBadgeWrapper>
    <Badge variant={variant} style={{ fontWeight: 600, padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}>
      {children}
    </Badge>
  </StyledBadgeWrapper>
);

const EmptyState = styled(Box)`
  background: ${props => props.theme.colors.neutral0};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing['3xl']};
  text-align: center;
  border: 2px dashed ${props => props.theme.colors.neutral300};
  position: relative;
  overflow: hidden;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      ${theme.colors.primary[50]} 0%, 
      ${theme.colors.secondary[50]} 100%
    );
    opacity: 0.3;
    z-index: 0;
  }
  
  &::after {
    content: '✨';
    position: absolute;
    bottom: 40px;
    right: 40px;
    font-size: 72px;
    opacity: 0.08;
    animation: ${float} 4s ease-in-out infinite;
  }
  
  > * {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 600px;
  }
`;

const LoadingOverlay = styled(Flex)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  z-index: 9999;
  justify-content: center;
  align-items: center;
  
  .loader-icon {
    animation: ${rotate} 1s linear infinite;
  }
`;

const FilterBar = styled(Flex)`
  background: ${props => props.theme.colors.neutral0};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.sm};
  border: 1px solid ${props => props.theme.colors.neutral200};
`;

const ActionBar = styled(Flex)`
  padding: ${theme.spacing.md};
  background: ${props => props.theme.colors.primary100};
  border-radius: ${theme.borderRadius.lg};
  margin-bottom: ${theme.spacing.md};
  animation: ${slideIn} ${theme.transitions.normal};
`;

// ================ HELPER FUNKTIONEN ================
const formatDate = (dateString) => {
  if (!dateString) return '—';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// ================ HAUPTKOMPONENTE ================
const TokensProfessional = () => {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const { get, post, del, put } = useFetchClient();
  const { toggleNotification } = useNotification();
  
  // States
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('magic-links');
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTokenDetails, setSelectedTokenDetails] = useState(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedTokenToExtend, setSelectedTokenToExtend] = useState(null);
  const [extendDays, setExtendDays] = useState(7);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Create Token Form State
  const [newToken, setNewToken] = useState({
    email: '',
    ttl: 24,
    context: {},
    sendEmail: true,
  });
  
  // Stats berechnen
  const stats = useMemo(() => ({
    total: tokens.length,
    active: tokens.filter(t => {
      const isExpired = t.expires_at && new Date(t.expires_at) < new Date();
      return t.is_active && !isExpired;
    }).length,
    expired: tokens.filter(t => {
      const isExpired = t.expires_at && new Date(t.expires_at) < new Date();
      return isExpired;
    }).length,
    used: tokens.filter(t => !t.is_active).length,
  }), [tokens]);
  
  // Gefilterte und sortierte Tokens
  const filteredAndSortedTokens = useMemo(() => {
    let filtered = tokens;
    
    // Search Filter
    if (searchQuery) {
      filtered = filtered.filter(token => 
        token.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.token?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Status Filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(token => {
        const isExpired = token.expires_at && new Date(token.expires_at) < new Date();
        switch (filterStatus) {
          case 'active':
            return token.is_active && !isExpired;
          case 'expired':
            return isExpired;
          case 'used':
            return !token.is_active;
          default:
            return true;
        }
      });
    }
    
    // Sortierung
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [tokens, searchQuery, filterStatus, sortBy, sortOrder]);
  
  // Pagination
  const paginatedTokens = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredAndSortedTokens.slice(start, end);
  }, [filteredAndSortedTokens, currentPage, pageSize]);
  
  const totalPages = Math.ceil(filteredAndSortedTokens.length / pageSize);
  
  // Stat Cards Konfiguration
  const statCards = [
    {
      title: formatMessage({ id: getTrad('tokens.stats.total') }),
      value: stats.total,
      icon: Server,
      color: theme.colors.primary[600],
      bg: theme.colors.primary[100],
      delay: '0s'
    },
    {
      title: formatMessage({ id: getTrad('tokens.stats.active') }),
      value: stats.active,
      icon: Sparkle,
      color: theme.colors.success[600],
      bg: theme.colors.success[100],
      delay: '0.1s'
    },
    {
      title: formatMessage({ id: getTrad('tokens.stats.expired') }),
      value: stats.expired,
      icon: Clock,
      color: theme.colors.warning[600],
      bg: theme.colors.warning[100],
      delay: '0.2s'
    },
    {
      title: formatMessage({ id: getTrad('tokens.stats.used') }),
      value: stats.used,
      icon: Check,
      color: theme.colors.secondary[600],
      bg: theme.colors.secondary[100],
      delay: '0.3s'
    }
  ];
  
  // Fetch Functions
  const fetchTokens = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await get('/magic-link/tokens');
      setTokens(response?.data?.data || response?.data || []);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toggleNotification({
        type: 'warning',
        message: formatMessage({ id: getTrad('tokens.notifications.loadError') }),
        title: formatMessage({ id: getTrad('tokens.notifications.error') })
      });
    } finally {
      setIsLoading(false);
    }
  }, [get, toggleNotification]);
  
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);
  
  // Handlers
  const handleRefresh = () => {
    fetchTokens();
    toggleNotification({
      type: 'success',
      message: formatMessage({ id: getTrad('tokens.notifications.refreshed') }),
      title: formatMessage({ id: getTrad('tokens.notifications.success') })
    });
  };
  
  const handleDelete = async (tokenId) => {
    try {
      await del(`/magic-link/tokens/${tokenId}`);
      await fetchTokens();
      toggleNotification({
        type: 'success',
        message: formatMessage({ id: getTrad('tokens.notifications.deleted') }),
        title: formatMessage({ id: getTrad('tokens.notifications.success') })
      });
    } catch (error) {
      toggleNotification({
        type: 'warning',
        message: formatMessage({ id: getTrad('tokens.notifications.deleteError') }),
        title: formatMessage({ id: getTrad('tokens.notifications.error') })
      });
    }
  };
  
  const handleBulkDelete = async () => {
    if (selectedTokens.length === 0) return;
    
    try {
      await Promise.all(
        selectedTokens.map(tokenId => del(`/magic-link/tokens/${tokenId}`))
      );
      await fetchTokens();
      setSelectedTokens([]);
      toggleNotification({
        type: 'success',
        message: formatMessage({ id: getTrad('tokens.notifications.bulkDeleted') }, { count: selectedTokens.length }),
        title: formatMessage({ id: getTrad('tokens.notifications.bulkDeleteSuccess') })
      });
    } catch (error) {
      toggleNotification({
        type: 'warning',
        message: formatMessage({ id: getTrad('tokens.notifications.deleteError') }),
        title: formatMessage({ id: getTrad('tokens.notifications.error') })
      });
    }
  };
  
  const handleCreateToken = async () => {
    if (!newToken.email) {
      toggleNotification({
        type: 'warning',
        message: formatMessage({ id: getTrad('tokens.notifications.validationError') }),
        title: formatMessage({ id: getTrad('tokens.notifications.validation') })
      });
      return;
    }
    
    try {
      await post('/magic-link/tokens', {
        email: newToken.email,
        send_email: newToken.sendEmail,
        context: {
          ...newToken.context,
          ttl: newToken.ttl
        }
      });
      
      await fetchTokens();
      setShowCreateModal(false);
      setNewToken({ email: '', ttl: 24, context: {}, sendEmail: true });
      setSearchQuery(''); // Explizit Suchfeld leeren
      
      toggleNotification({
        type: 'success',
        message: formatMessage({ id: getTrad('tokens.notifications.created') }, { email: newToken.email }),
        title: formatMessage({ id: getTrad('tokens.notifications.createSuccess') })
      });
    } catch (error) {
      toggleNotification({
        type: 'warning',
        message: formatMessage({ id: getTrad('tokens.notifications.createError') }),
        title: formatMessage({ id: getTrad('tokens.notifications.error') })
      });
    }
  };
  
  const handleExtend = async (tokenId) => {
    try {
      await post(`/magic-link/tokens/${tokenId}/extend`, {
        days: extendDays
      });
      
      await fetchTokens();
      setShowExtendModal(false);
      setSelectedTokenToExtend(null);
      setExtendDays(7); // Reset to default
      
      toggleNotification({
        type: 'success',
        message: formatMessage({ id: getTrad('tokens.notifications.extended') }, { days: extendDays }),
        title: formatMessage({ id: getTrad('tokens.notifications.extendSuccess') })
      });
    } catch (error) {
      toggleNotification({
        type: 'warning',
        message: formatMessage({ id: getTrad('tokens.notifications.extendError') }),
        title: formatMessage({ id: getTrad('tokens.notifications.error') })
      });
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTokens(paginatedTokens.map(token => token.id));
    } else {
      setSelectedTokens([]);
    }
  };
  
  const handleSelectToken = (tokenId, checked) => {
    if (checked) {
      setSelectedTokens([...selectedTokens, tokenId]);
    } else {
      setSelectedTokens(selectedTokens.filter(id => id !== tokenId));
    }
  };
  
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  const getStatusBadge = (token) => {
    // Prüfe zuerst is_active - wenn false, wurde der Token verwendet oder blockiert
    if (!token.is_active) {
      return <AnimatedBadge variant="secondary">{formatMessage({ id: getTrad('tokens.status.used') })}</AnimatedBadge>;
    }
    // Prüfe ob abgelaufen
    const isExpired = token.expires_at && new Date(token.expires_at) < new Date();
    if (isExpired) {
      return <AnimatedBadge variant="warning">{formatMessage({ id: getTrad('tokens.status.expired') })}</AnimatedBadge>;
    }
    // Token ist aktiv und nicht abgelaufen
    return <AnimatedBadge variant="success">{formatMessage({ id: getTrad('tokens.status.active') })}</AnimatedBadge>;
  };
  
  // Loading State
  if (isLoading) {
    return (
      <LoadingOverlay>
        <Box className="loader-icon">
          <Loader>{formatMessage({ id: getTrad('tokens.loading') })}</Loader>
        </Box>
      </LoadingOverlay>
    );
  }
  
  return (
    <Main>
      <Container paddingBottom={10}>
        {/* Professional Header */}
        <Header>
          <HeaderContent justifyContent="space-between" alignItems="center">
            <Box>
              <Title as="h1">
                <Sparkle /> {formatMessage({ id: getTrad('tokens.page.title') })}
              </Title>
              <Subtitle>
                {formatMessage({ id: getTrad('tokens.page.subtitle') })}
              </Subtitle>
            </Box>
            <Flex gap={2}>
              <ActionButton
                onClick={() => setShowCreateModal(true)}
                startIcon={<Sparkle />}
                size="L"
              >
                {formatMessage({ id: getTrad('tokens.actions.newToken') })}
              </ActionButton>
              <ActionButton
                onClick={handleRefresh}
                startIcon={<ArrowClockwise />}
                size="L"
              >
                {formatMessage({ id: getTrad('tokens.actions.refresh') })}
              </ActionButton>
              <ActionButton
                onClick={() => navigate('/settings/magic-link/config')}
                startIcon={<Cog />}
                size="L"
              >
                {formatMessage({ id: getTrad('tokens.actions.settings') })}
              </ActionButton>
            </Flex>
          </HeaderContent>
        </Header>
        
        {/* Tab Navigation */}
        <TabsWrapper>
          <Flex gap={1}>
            <TabButton
              $active={activeTab === 'magic-links'}
              onClick={() => setActiveTab('magic-links')}
              startIcon={<Key />}
              size="L"
              fullWidth
            >
              {formatMessage({ id: getTrad('tokens.tabs.magicLinks') })}
            </TabButton>
            <TabButton
              $active={activeTab === 'jwt-sessions'}
              onClick={() => setActiveTab('jwt-sessions')}
              startIcon={<Shield />}
              size="L"
              fullWidth
            >
              {formatMessage({ id: getTrad('tokens.tabs.jwtSessions') })}
            </TabButton>
            <TabButton
              $active={activeTab === 'ip-bans'}
              onClick={() => setActiveTab('ip-bans')}
              startIcon={<Earth />}
              size="L"
              fullWidth
            >
              {formatMessage({ id: getTrad('tokens.tabs.ipBans') })}
            </TabButton>
          </Flex>
        </TabsWrapper>
        
        {/* Statistik Cards */}
        {activeTab === 'magic-links' && (
          <StatsGrid>
            {statCards.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <StatCard 
                  key={index}
                  $color={stat.color}
                  $delay={stat.delay}
                >
                  <Flex direction="column" alignItems="center">
                    <StatIcon 
                      className="stat-icon"
                      $bg={stat.bg}
                      $color={stat.color}
                    >
                      <IconComponent />
                    </StatIcon>
                    <StatValue className="stat-value">
                      {stat.value}
                    </StatValue>
                    <StatLabel>{stat.title}</StatLabel>
                  </Flex>
                </StatCard>
              );
            })}
          </StatsGrid>
        )}
        
        {/* Filter Bar */}
        {activeTab === 'magic-links' && (
          <FilterBar gap={3} alignItems="center">
            <Box flex="1">
              <Searchbar
                key={`searchbar-${tokens.length}`}
                name="token-search"
                id="token-search"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={formatMessage({ id: getTrad('tokens.search.placeholder') })}
                clearLabel={formatMessage({ id: getTrad('tokens.search.clear') })}
                onClear={() => setSearchQuery('')}
              />
            </Box>
            <SingleSelect
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder={formatMessage({ id: getTrad('tokens.filter.status') })}
            >
              <SingleSelectOption value="all">{formatMessage({ id: getTrad('tokens.filter.all') })}</SingleSelectOption>
              <SingleSelectOption value="active">{formatMessage({ id: getTrad('tokens.filter.active') })}</SingleSelectOption>
              <SingleSelectOption value="expired">{formatMessage({ id: getTrad('tokens.filter.expired') })}</SingleSelectOption>
              <SingleSelectOption value="used">{formatMessage({ id: getTrad('tokens.filter.used') })}</SingleSelectOption>
            </SingleSelect>
            <SingleSelect
              value={pageSize.toString()}
              onChange={(value) => setPageSize(parseInt(value))}
              placeholder={formatMessage({ id: getTrad('tokens.pageSize.label') })}
            >
              <SingleSelectOption value="10">{formatMessage({ id: getTrad('tokens.pageSize.10') })}</SingleSelectOption>
              <SingleSelectOption value="25">{formatMessage({ id: getTrad('tokens.pageSize.25') })}</SingleSelectOption>
              <SingleSelectOption value="50">{formatMessage({ id: getTrad('tokens.pageSize.50') })}</SingleSelectOption>
              <SingleSelectOption value="100">{formatMessage({ id: getTrad('tokens.pageSize.100') })}</SingleSelectOption>
            </SingleSelect>
          </FilterBar>
        )}
        
        {/* Action Bar für Bulk Actions */}
        {selectedTokens.length > 0 && (
          <ActionBar justifyContent="space-between" alignItems="center">
            <Typography fontWeight="semiBold">
              {formatMessage({ id: getTrad('tokens.selected') }, { count: selectedTokens.length })}
            </Typography>
            <Flex gap={2}>
              <Button
                onClick={() => setSelectedTokens([])}
                variant="tertiary"
                size="S"
              >
                {formatMessage({ id: getTrad('tokens.actions.clearSelection') })}
              </Button>
              <Button
                onClick={handleBulkDelete}
                startIcon={<Trash />}
                variant="danger"
                size="S"
              >
                {formatMessage({ id: getTrad('tokens.actions.bulkDelete') })}
              </Button>
            </Flex>
          </ActionBar>
        )}
        
        {/* Data Table */}
        {activeTab === 'magic-links' && (
          <DataTable>
            {filteredAndSortedTokens.length === 0 ? (
              <EmptyState>
                <Flex direction="column" alignItems="center" gap={6}>
                  {/* Icon */}
                  <Box
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${theme.colors.primary[100]} 0%, ${theme.colors.secondary[100]} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: theme.shadows.xl,
                    }}
                  >
                    <Eye style={{ width: '60px', height: '60px', color: theme.colors.primary[600] }} />
                  </Box>
                  
                  {/* Titel */}
                  <Typography 
                    variant="alpha" 
                    style={{ 
                      fontSize: '1.75rem',
                      fontWeight: '700',
                      color: theme.colors.neutral[800],
                      marginBottom: '8px',
                    }}
                  >
                    {formatMessage({ id: getTrad('tokens.empty.title') })}
                  </Typography>
                  
                  {/* Beschreibung */}
                  <Typography 
                    variant="omega" 
                    textColor="neutral600"
                    style={{
                      fontSize: '1rem',
                      maxWidth: '400px',
                      lineHeight: '1.6',
                    }}
                  >
                    {formatMessage({ id: getTrad('tokens.empty.description') })}
                  </Typography>
                  
                  {/* Aktionen */}
                  <Flex gap={3} justifyContent="center" style={{ marginTop: '16px' }}>
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      startIcon={<Plus />}
                      size="L"
                      style={{
                        background: `linear-gradient(135deg, ${theme.colors.primary[600]} 0%, ${theme.colors.secondary[600]} 100%)`,
                        color: 'white',
                        border: 'none',
                        fontWeight: '600',
                        padding: '12px 24px',
                      }}
                    >
                      {formatMessage({ id: getTrad('tokens.empty.createFirst') })}
                    </Button>
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterStatus('all');
                      }}
                      variant="secondary"
                      size="L"
                    >
                      {formatMessage({ id: getTrad('tokens.empty.resetFilters') })}
                    </Button>
                  </Flex>
                </Flex>
              </EmptyState>
            ) : (
              <>
                <StyledTable>
                  <Thead>
                    <Tr>
                      <Th>
                        <Checkbox
                          checked={selectedTokens.length === paginatedTokens.length && paginatedTokens.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </Th>
                      <Th action={<IconButton label={formatMessage({ id: getTrad('tokens.table.sortBy') })} onClick={() => handleSort('email')} variant="ghost" withTooltip={false}><CaretDown /></IconButton>}>
                        {formatMessage({ id: getTrad('tokens.table.email') })}
                      </Th>
                      <Th>{formatMessage({ id: getTrad('tokens.table.token') })}</Th>
                      <Th action={<IconButton label={formatMessage({ id: getTrad('tokens.table.sortBy') })} onClick={() => handleSort('status')} variant="ghost" withTooltip={false}><CaretDown /></IconButton>}>
                        {formatMessage({ id: getTrad('tokens.table.status') })}
                      </Th>
                      <Th action={<IconButton label={formatMessage({ id: getTrad('tokens.table.sortBy') })} onClick={() => handleSort('createdAt')} variant="ghost" withTooltip={false}><CaretDown /></IconButton>}>
                        {formatMessage({ id: getTrad('tokens.table.created') })}
                      </Th>
                      <Th action={<IconButton label={formatMessage({ id: getTrad('tokens.table.sortBy') })} onClick={() => handleSort('expires_at')} variant="ghost" withTooltip={false}><CaretDown /></IconButton>}>
                        {formatMessage({ id: getTrad('tokens.table.expiresAt') })}
                      </Th>
                      <Th>
                        <VisuallyHidden>{formatMessage({ id: getTrad('tokens.table.actions') })}</VisuallyHidden>
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {paginatedTokens.map((token) => (
                      <Tr key={token.id}>
                        <Td>
                          <Checkbox
                            checked={selectedTokens.includes(token.id)}
                            onCheckedChange={(checked) => handleSelectToken(token.id, checked)}
                          />
                        </Td>
                        <Td>
                          <Flex alignItems="center" gap={2}>
                            <Box
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: theme.borderRadius.full,
                                background: `linear-gradient(135deg, ${theme.colors.primary[500]} 0%, ${theme.colors.secondary[500]} 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <User style={{ width: '18px', height: '18px', color: 'white' }} />
                            </Box>
                            <Flex direction="column" alignItems="flex-start" gap={0}>
                              <Typography fontWeight="semiBold" ellipsis>
                                {token.email}
                              </Typography>
                              <Typography variant="omega" textColor="neutral600">
                                {token.user_id ? formatMessage({ id: getTrad('tokens.user.id') }, { id: token.user_id }) : formatMessage({ id: getTrad('tokens.user.new') })}
                              </Typography>
                            </Flex>
                          </Flex>
                        </Td>
                        <Td>
                          <Box style={{ maxWidth: '200px' }}>
                            <Typography 
                              variant="pi" 
                              textColor="neutral600" 
                              ellipsis
                              title={`Token: ${token.token} (Klicken zum Kopieren)`}
                              style={{ 
                                fontFamily: 'monospace', 
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                navigator.clipboard.writeText(token.token);
                                toggleNotification({
                            type: 'success',
                            message: formatMessage({ id: getTrad('tokens.notifications.tokenCopied') }),
                            title: formatMessage({ id: getTrad('tokens.notifications.success') })
                                });
                              }}
                            >
                              {token.token}
                            </Typography>
                          </Box>
                        </Td>
                        <Td>
                          {getStatusBadge(token)}
                        </Td>
                        <Td>
                          <Flex alignItems="center" gap={1}>
                            <Calendar style={{ width: '14px', height: '14px', color: theme.colors.neutral[500] }} />
                  <Typography variant="pi">
                    {formatDate(token.createdAt)}
                  </Typography>
                          </Flex>
                        </Td>
                        <Td>
                          <Flex alignItems="center" gap={1}>
                            <Clock style={{ width: '14px', height: '14px', color: theme.colors.warning[500] }} />
                            {(() => {
                              const formattedDate = formatDate(token.expires_at);
                              if (formattedDate === '—') {
                                return (
                                  <Typography variant="pi" textColor="success600">
                                    {formatMessage({ id: getTrad('tokens.details.never') })}
                                  </Typography>
                                );
                              }
                              const isExpired = token.expires_at && new Date(token.expires_at) < new Date();
                              return (
                                <Typography 
                                  variant="pi" 
                                  textColor={isExpired ? 'danger600' : 'neutral800'}
                                  fontWeight={isExpired ? 'semiBold' : 'normal'}
                                >
                                  {formattedDate}
                                  {isExpired && formatMessage({ id: getTrad('tokens.details.expiredSuffix') })}
                                </Typography>
                              );
                            })()}
                          </Flex>
                        </Td>
                        <Td>
                          <Flex gap={1} justifyContent="flex-end">
                            <IconButton
                              label="Details anzeigen"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTokenDetails(token);
                                setShowDetailsModal(true);
                              }}
                              withTooltip={false}
                            >
                              <Eye />
                            </IconButton>
                            <IconButton
                              label="Token kopieren"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(token.token);
                                toggleNotification({
                            type: 'success',
                            message: formatMessage({ id: getTrad('tokens.notifications.tokenCopied') }),
                            title: formatMessage({ id: getTrad('tokens.notifications.success') })
                                });
                              }}
                              withTooltip={false}
                            >
                              <Link />
                            </IconButton>
                            <IconButton
                              label="Token verlängern"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTokenToExtend(token);
                                setShowExtendModal(true);
                              }}
                              withTooltip={false}
                            >
                              <Clock />
                            </IconButton>
                            <IconButton
                              label="Löschen"
                              variant="danger-ghost"
                              onClick={() => handleDelete(token.id)}
                              withTooltip={false}
                            >
                              <Trash />
                            </IconButton>
                          </Flex>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </StyledTable>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <Box paddingTop={4} paddingBottom={4}>
                    <Flex justifyContent="center">
                      <Pagination activePage={currentPage} pageCount={totalPages}>
                        <PreviousLink onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>
                          {formatMessage({ id: getTrad('tokens.pagination.previous') })}
                        </PreviousLink>
                        {[...Array(totalPages)].map((_, i) => (
                          <PageLink
                            key={i + 1}
                            number={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </PageLink>
                        ))}
                        <NextLink onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}>
                          {formatMessage({ id: getTrad('tokens.pagination.next') })}
                        </NextLink>
                      </Pagination>
                    </Flex>
                  </Box>
                )}
              </>
            )}
          </DataTable>
        )}
        
        {/* JWT Sessions Tab */}
        {activeTab === 'jwt-sessions' && (
          <JWTSessions />
        )}
        
        {/* IP-Bans Tab */}
        {activeTab === 'ip-bans' && (
          <IPBans />
        )}
        
        {/* Token Details Modal */}
        {showDetailsModal && selectedTokenDetails && (
          <>
            {/* Backdrop */}
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(4, 28, 47, 0.45)',
                backdropFilter: 'blur(3px)',
                zIndex: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
              }}
              onClick={() => setShowDetailsModal(false)}
            >
              {/* Modal Content */}
              <Box
                background="neutral0"
                shadow="filterShadow"
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '600px',
                  maxHeight: 'calc(100vh - 40px)',
                  overflow: 'auto',
                  borderRadius: '8px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <Box
                  padding={6}
                  style={{
                    borderBottom: '1px solid #E9E9F0',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    position: 'relative',
                  }}
                >
                  <Flex direction="column" alignItems="stretch" gap={2}>
                    <Flex justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="alpha" style={{ 
                        color: 'white', 
                        fontSize: '24px', 
                        fontWeight: '700',
                        letterSpacing: '-0.025em',
                      }}>
                        {formatMessage({ id: getTrad('tokens.details.title') })}
                      </Typography>
                      <IconButton
                        onClick={() => setShowDetailsModal(false)}
                        label={formatMessage({ id: getTrad('tokens.details.close') })}
                        withTooltip={false}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          color: 'white',
                        }}
                      >
                        <Cross />
                      </IconButton>
                    </Flex>
                    <Typography variant="epsilon" style={{ 
                      color: 'rgba(255,255,255,0.9)', 
                      fontSize: '16px',
                      fontWeight: '400',
                    }}>
                      {selectedTokenDetails.email}
                    </Typography>
                  </Flex>
                </Box>

                {/* Body */}
                <Box padding={7}>
                  <Flex direction="column" alignItems="stretch" gap={5}>
                    {/* Token */}
                    <Box>
                      <Typography variant="sigma" fontWeight="semiBold" textColor="neutral800" style={{ marginBottom: '8px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}>
                        {formatMessage({ id: getTrad('tokens.details.token') })}
                      </Typography>
                      <Box
                        padding={4}
                        background="neutral100"
                        style={{
                          borderRadius: '6px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s',
                          border: '1px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f0f0f7';
                          e.currentTarget.style.border = '1px solid #d0d0e0';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f6f6f9';
                          e.currentTarget.style.border = '1px solid transparent';
                        }}
                        onClick={() => {
                          navigator.clipboard.writeText(selectedTokenDetails.token);
                          toggleNotification({
                            type: 'success',
                            message: 'Token kopiert!',
                          });
                        }}
                      >
                        <Typography 
                          variant="pi" 
                          style={{ 
                            fontFamily: 'monospace', 
                            fontSize: '13px',
                            wordBreak: 'break-all',
                            display: 'block',
                            marginBottom: '8px',
                            color: '#32324d',
                          }}
                        >
                          {selectedTokenDetails.token}
                        </Typography>
                        <Typography variant="pi" textColor="neutral500" style={{ fontSize: '11px', fontStyle: 'italic' }}>
                          {formatMessage({ id: getTrad('tokens.details.clickToCopy') })}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Magic Link */}
                    <Box>
                      <Typography variant="sigma" fontWeight="semiBold" textColor="neutral800" style={{ marginBottom: '8px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}>
                        {formatMessage({ id: getTrad('tokens.details.magicLink') })}
                      </Typography>
                      <Box
                        padding={4}
                        background="primary100"
                        style={{
                          borderRadius: '6px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s',
                          border: '1px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#e0e0ff';
                          e.currentTarget.style.border = '1px solid #c0c0ff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f0f0ff';
                          e.currentTarget.style.border = '1px solid transparent';
                        }}
                        onClick={() => {
                          const magicLink = `${window.location.origin}/api/magic-link/login?loginToken=${selectedTokenDetails.token}`;
                          navigator.clipboard.writeText(magicLink);
                          toggleNotification({
                            type: 'success',
                            message: formatMessage({ id: getTrad('tokens.notifications.linkCopied') }),
                          });
                        }}
                      >
                        <Typography 
                          variant="pi" 
                          style={{ 
                            fontSize: '13px',
                            wordBreak: 'break-all',
                            display: 'block',
                            marginBottom: '8px',
                            lineHeight: '1.6',
                            color: '#271fe0',
                          }}
                        >
                          {`${window.location.origin}/api/magic-link/login?loginToken=${selectedTokenDetails.token}`}
                        </Typography>
                        <Typography variant="pi" textColor="primary600" style={{ fontSize: '11px', fontStyle: 'italic' }}>
                          {formatMessage({ id: getTrad('tokens.details.clickToCopy') })}
                        </Typography>
                      </Box>
                    </Box>

                    {/* cURL Command */}
                    <Box>
                      <Typography variant="sigma" fontWeight="semiBold" textColor="neutral800" style={{ marginBottom: '8px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}>
                        {formatMessage({ id: getTrad('tokens.details.curlCommand') })}
                      </Typography>
                      <Box
                        padding={4}
                        background="neutral100"
                        style={{
                          borderRadius: '6px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s',
                          border: '1px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f0f0f7';
                          e.currentTarget.style.border = '1px solid #d0d0e0';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f6f6f9';
                          e.currentTarget.style.border = '1px solid transparent';
                        }}
                        onClick={() => {
                          const curlCommand = `curl -X GET "${window.location.origin}/api/magic-link/login?loginToken=${selectedTokenDetails.token}"`;
                          navigator.clipboard.writeText(curlCommand);
                          toggleNotification({
                            type: 'success',
                            message: formatMessage({ id: getTrad('tokens.notifications.curlCopied') }),
                          });
                        }}
                      >
                        <Typography 
                          variant="pi" 
                          style={{ 
                            fontFamily: 'monospace', 
                            fontSize: '12px',
                            wordBreak: 'break-all',
                            display: 'block',
                            marginBottom: '8px',
                            color: '#32324d',
                            lineHeight: '1.5',
                          }}
                        >
                          {`curl -X GET "${window.location.origin}/api/magic-link/login?loginToken=${selectedTokenDetails.token}"`}
                        </Typography>
                        <Typography variant="pi" textColor="neutral500" style={{ fontSize: '11px', fontStyle: 'italic' }}>
                          {formatMessage({ id: getTrad('tokens.details.clickToCopyCurl') })}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Status & Dates Grid */}
                    <Box
                      padding={4}
                      background="neutral100"
                      style={{
                        borderRadius: '6px',
                        border: '1px solid #e0e0e8',
                      }}
                    >
                      <Flex direction="column" gap={3}>
                        {/* Status */}
                        <Flex alignItems="center" justifyContent="space-between">
                          <Typography variant="omega" textColor="neutral600" style={{ fontSize: '12px' }}>
                            {formatMessage({ id: getTrad('tokens.details.status') })}
                          </Typography>
                          {getStatusBadge(selectedTokenDetails)}
                        </Flex>
                        
                        {/* Divider */}
                        <Box style={{ height: '1px', background: '#e0e0e8', margin: '4px 0' }} />
                        
                        {/* Created Date */}
                        <Flex alignItems="center" justifyContent="space-between">
                          <Typography variant="omega" textColor="neutral600" style={{ fontSize: '12px' }}>
                            {formatMessage({ id: getTrad('tokens.details.created') })}
                          </Typography>
                          <Typography variant="pi" style={{ fontSize: '13px', fontWeight: '500' }}>
                            {formatDate(selectedTokenDetails.createdAt)}
                          </Typography>
                        </Flex>
                        
                        {/* Expiry Date */}
                        <Flex alignItems="center" justifyContent="space-between">
                          <Typography variant="omega" textColor="neutral600" style={{ fontSize: '12px' }}>
                            {formatMessage({ id: getTrad('tokens.details.expiresAt') })}
                          </Typography>
                          <Typography 
                            variant="pi" 
                            style={{ 
                              fontSize: '13px', 
                              fontWeight: '500',
                              color: selectedTokenDetails.expires_at && new Date(selectedTokenDetails.expires_at) < new Date() ? '#d02b20' : '#32324d'
                            }}
                          >
                            {formatDate(selectedTokenDetails.expires_at) || formatMessage({ id: getTrad('tokens.details.unlimited') })}
                          </Typography>
                        </Flex>
                        
                        {/* Used Date (if applicable) */}
                        {selectedTokenDetails.used_at && (
                          <>
                            <Flex alignItems="center" justifyContent="space-between">
                              <Typography variant="omega" textColor="neutral600" style={{ fontSize: '12px' }}>
                                {formatMessage({ id: getTrad('tokens.details.usedAt') })}
                              </Typography>
                              <Typography variant="pi" style={{ fontSize: '13px', fontWeight: '500', color: '#8e4b10' }}>
                                {formatDate(selectedTokenDetails.used_at)}
                              </Typography>
                            </Flex>
                          </>
                        )}
                      </Flex>
                    </Box>
                  </Flex>
                </Box>

                {/* Footer */}
                <Box
                  paddingTop={5}
                  paddingBottom={5}
                  paddingLeft={7}
                  paddingRight={7}
                  style={{
                    borderTop: '1px solid #E9E9F0',
                    background: '#fafafa',
                    borderBottomLeftRadius: '8px',
                    borderBottomRightRadius: '8px',
                  }}
                >
                  <Flex justifyContent="flex-end">
                    <Button 
                      onClick={() => setShowDetailsModal(false)}
                      size="M"
                      variant="tertiary"
                    >
                      {formatMessage({ id: getTrad('tokens.details.close') })}
                    </Button>
                  </Flex>
                </Box>
              </Box>
            </div>
          </>
        )}
        
        {/* Extend Token Modal */}
        <ExtendTokenModal
          isOpen={showExtendModal}
          onClose={() => {
            setShowExtendModal(false);
            setSelectedTokenToExtend(null);
          }}
          onSubmit={handleExtend}
          selectedToken={selectedTokenToExtend}
          extendDays={extendDays}
          setExtendDays={setExtendDays}
          formatDate={formatDate}
        />
        
        {/* Create Token Modal */}
        <CreateTokenModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateToken}
          formData={newToken}
          setFormData={setNewToken}
        />
      </Container>
    </Main>
  );
};

export default TokensProfessional;
