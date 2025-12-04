import { useState, useEffect, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  Box,
  Button,
  Typography,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Badge,
  IconButton,
  Searchbar,
  SingleSelect,
  SingleSelectOption,
  Checkbox,
  VisuallyHidden,
} from '@strapi/design-system';
import { 
  Trash, 
  ArrowClockwise, 
  Check, 
  Cross, 
  Server,
  Sparkle,
  Clock,
  Eye,
  Mail,
  CaretDown,
} from '@strapi/icons';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import pluginId from '../../pluginId';
import getTrad from '../../utils/getTrad';

// ================ DESIGN TOKENS ================
const theme = {
  colors: {
    primary: {
      100: '#E0F2FE',
      500: '#0EA5E9',
      600: '#0284C7',
    },
    secondary: {
      100: '#F3E8FF',
      600: '#9333EA',
    },
    success: {
      100: '#DCFCE7',
      600: '#16A34A',
    },
    warning: {
      100: '#FEF3C7',
      600: '#D97706',
    },
    neutral: {
      0: '#FFFFFF',
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      600: '#4B5563',
      800: '#1F2937',
    }
  },
  shadows: {
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    md: '8px',
    lg: '12px',
    xl: '16px',
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

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
`;

// ================ STYLED COMPONENTS ================
const StatsGrid = styled(Box)`
  margin-bottom: ${theme.spacing.xl};
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: center;
  flex-wrap: wrap;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: ${theme.spacing.sm};
    max-width: 100%;
    margin-bottom: ${theme.spacing.md};
  }
`;

const StatCard = styled(Box)`
  background: ${props => props.theme.colors.neutral0};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  position: relative;
  overflow: hidden;
  transition: all ${theme.transitions.normal};
  animation: ${fadeIn} ${theme.transitions.normal} backwards;
  animation-delay: ${props => props.$delay || '0s'};
  box-shadow: ${theme.shadows.sm};
  border: 1px solid ${props => props.theme.colors.neutral200};
  min-width: 220px;
  max-width: 260px;
  flex: 1;

  @media (max-width: 768px) {
    min-width: unset;
    max-width: unset;
    width: 100%;
    padding: ${theme.spacing.md};
  }
  
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
    }
    
    td {
      padding: ${theme.spacing.md};
      color: ${props => props.theme.colors.neutral800};
    }
  }

  @media screen and (max-width: 768px) {
    display: block !important;
    width: 100% !important;
    
    thead {
      display: none !important;
    }
    
    tbody {
      display: block !important;
      width: 100% !important;
    }
    
    tr {
      display: block !important;
      margin-bottom: 16px !important;
      border: 2px solid #E5E7EB !important;
      border-radius: 12px !important;
      padding: 16px !important;
      background: white !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
      width: 100% !important;
    }
    
    td {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      padding: 8px 0 !important;
      border: none !important;
      width: 100% !important;
      
      &:not(:last-child) {
        border-bottom: 1px solid #E5E7EB !important;
        padding-bottom: 8px !important;
        margin-bottom: 8px !important;
      }
      
      &::before {
        content: attr(data-label) !important;
        font-weight: 600 !important;
        color: #6B7280 !important;
        font-size: 11px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        display: block !important;
        flex-shrink: 0 !important;
      }
      
      &[data-label=""]::before {
        display: none !important;
      }
    }
  }
`;

const EmptyState = styled(Box)`
  background: ${props => props.theme.colors.neutral0};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.xl} ${theme.spacing.xl} 80px;
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
      ${theme.colors.primary[100]} 0%, 
      ${theme.colors.secondary[100]} 100%
    );
    opacity: 0.3;
    z-index: 0;
  }
  
  &::after {
    content: '🔐';
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

const FilterBar = styled(Flex)`
  background: ${props => props.theme.colors.neutral0};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.sm};
  border: 1px solid ${props => props.theme.colors.neutral200};
`;

const OTPCodes = () => {
  const { formatMessage } = useIntl();
  const { get, del, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  
  // States
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [selectedCodes, setSelectedCodes] = useState([]);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const { data } = await get(`/${pluginId}/otp/codes`, {
        params: {
          page: 1,
          pageSize: 1000 // Fetch all to handle filtering client-side
        }
      });
      
      setCodes(data.codes || []);
    } catch (error) {
      console.error('Error fetching OTP codes:', error);
      toggleNotification({
        type: 'warning',
        message: 'Error loading OTP codes',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this OTP code?')) {
      return;
    }

    try {
      await del(`/${pluginId}/otp/codes/${id}`);
      await fetchCodes();
      toggleNotification({
        type: 'success',
        message: 'OTP code deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting OTP code:', error);
      toggleNotification({
        type: 'warning',
        message: 'Error deleting OTP code',
      });
    }
  };

  const handleCleanup = async () => {
    try {
      await post(`/${pluginId}/otp/cleanup`);
      await fetchCodes();
      toggleNotification({
        type: 'success',
        message: 'Expired codes cleaned up successfully',
      });
    } catch (error) {
      console.error('Error cleaning up OTP codes:', error);
      toggleNotification({
        type: 'warning',
        message: 'Error cleaning up expired codes',
      });
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

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

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  // Stats berechnen
  const stats = useMemo(() => ({
    total: codes.length,
    active: codes.filter(c => !c.used && !isExpired(c.expiresAt)).length,
    expired: codes.filter(c => isExpired(c.expiresAt)).length,
    used: codes.filter(c => c.used).length,
  }), [codes]);

  // Gefilterte und sortierte Codes
  const filteredCodes = useMemo(() => {
    let filtered = codes;
    
    // Search Filter
    if (searchQuery) {
      filtered = filtered.filter(code => 
        code.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.code?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Status Filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(code => {
        switch (filterStatus) {
          case 'active':
            return !code.used && !isExpired(code.expiresAt);
          case 'expired':
            return isExpired(code.expiresAt);
          case 'used':
            return code.used;
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [codes, searchQuery, filterStatus]);

  // Pagination
  const paginatedCodes = useMemo(() => {
    return filteredCodes.slice(0, pageSize);
  }, [filteredCodes, pageSize]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedCodes(paginatedCodes.map(code => code.id));
    } else {
      setSelectedCodes([]);
    }
  };
  
  const handleSelectCode = (codeId, checked) => {
    if (checked) {
      setSelectedCodes([...selectedCodes, codeId]);
    } else {
      setSelectedCodes(selectedCodes.filter(id => id !== codeId));
    }
  };

  // Stat Cards Konfiguration
  const statCards = [
    {
      title: 'Total',
      value: stats.total,
      icon: Server,
      color: theme.colors.primary[600],
      bg: theme.colors.primary[100],
      delay: '0s'
    },
    {
      title: 'Active',
      value: stats.active,
      icon: Sparkle,
      color: theme.colors.success[600],
      bg: theme.colors.success[100],
      delay: '0.1s'
    },
    {
      title: 'Expired',
      value: stats.expired,
      icon: Clock,
      color: theme.colors.warning[600],
      bg: theme.colors.warning[100],
      delay: '0.2s'
    },
    {
      title: 'Used',
      value: stats.used,
      icon: Check,
      color: theme.colors.secondary[600],
      bg: theme.colors.secondary[100],
      delay: '0.3s'
    }
  ];

  if (loading) {
    return (
      <Box padding={8}>
        <Flex justifyContent="center" alignItems="center" style={{ minHeight: '400px' }}>
          <Typography>Loading...</Typography>
        </Flex>
      </Box>
    );
  }

  return (
    <Box>
      {/* Statistik Cards */}
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

      {/* Filter Bar */}
      <FilterBar gap={3} alignItems="center">
        <Box flex="1">
          <Searchbar
            name="otp-search"
            id="otp-search"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email or code..."
            clearLabel="Clear"
            onClear={() => setSearchQuery('')}
          />
        </Box>
        <SingleSelect
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Filter by status"
        >
          <SingleSelectOption value="all">Show All</SingleSelectOption>
          <SingleSelectOption value="active">Active Only</SingleSelectOption>
          <SingleSelectOption value="expired">Expired Only</SingleSelectOption>
          <SingleSelectOption value="used">Used Only</SingleSelectOption>
        </SingleSelect>
        <SingleSelect
          value={pageSize.toString()}
          onChange={(value) => setPageSize(parseInt(value))}
          placeholder="Entries per page"
        >
          <SingleSelectOption value="10">10 entries</SingleSelectOption>
          <SingleSelectOption value="25">25 entries</SingleSelectOption>
          <SingleSelectOption value="50">50 entries</SingleSelectOption>
          <SingleSelectOption value="100">100 entries</SingleSelectOption>
        </SingleSelect>
        <Button
          onClick={fetchCodes}
          startIcon={<ArrowClockwise />}
          variant="secondary"
        >
          Refresh
        </Button>
        {codes.filter(c => isExpired(c.expiresAt)).length > 0 && (
          <Button
            startIcon={<Trash />}
            onClick={handleCleanup}
            variant="danger-light"
          >
            Cleanup ({codes.filter(c => isExpired(c.expiresAt)).length})
          </Button>
        )}
      </FilterBar>

      {/* Data Table */}
      <DataTable>
        {filteredCodes.length === 0 ? (
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
                No OTP codes yet
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
                Start by triggering a magic link login that requires OTP verification. Codes will appear here immediately.
              </Typography>
            </Flex>
          </EmptyState>
        ) : (
          <>
            <StyledTable>
              <Thead>
                <Tr>
                  <Th>
                    <Checkbox
                      checked={selectedCodes.length === paginatedCodes.length && paginatedCodes.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </Th>
                  <Th>Code</Th>
                  <Th>Email</Th>
                  <Th>Type</Th>
                  <Th>Status</Th>
                  <Th>Attempts</Th>
                  <Th>Created</Th>
                  <Th>Expires</Th>
                  <Th>
                    <VisuallyHidden>Actions</VisuallyHidden>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginatedCodes.map((code) => (
                  <Tr key={code.id}>
                    <Td data-label="">
                      <Checkbox
                        checked={selectedCodes.includes(code.id)}
                        onCheckedChange={(checked) => handleSelectCode(code.id, checked)}
                      />
                    </Td>
                    <Td data-label="Code">
                      <Typography
                        variant="omega"
                        fontWeight="bold"
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '16px',
                          letterSpacing: '2px'
                        }}
                      >
                        {code.code}
                      </Typography>
                    </Td>
                    <Td data-label="Email">
                      <Flex alignItems="center" gap={2}>
                        <Box
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: theme.borderRadius.full,
                            background: `linear-gradient(135deg, ${theme.colors.primary[500]} 0%, ${theme.colors.secondary[600]} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Mail style={{ width: '18px', height: '18px', color: 'white' }} />
                        </Box>
                        <Typography variant="omega" ellipsis>
                          {code.email}
                        </Typography>
                      </Flex>
                    </Td>
                    <Td data-label="Type">
                      <Badge>
                        {code.type === 'email' && '📧 Email'}
                        {code.type === 'sms' && '📱 SMS'}
                        {code.type === 'totp' && '🔐 TOTP'}
                      </Badge>
                    </Td>
                    <Td data-label="Status">
                      {code.used ? (
                        <Badge variant="secondary">Used</Badge>
                      ) : isExpired(code.expiresAt) ? (
                        <Badge variant="warning">Expired</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </Td>
                    <Td data-label="Attempts">
                      <Typography variant="omega">{code.attempts || 0}</Typography>
                    </Td>
                    <Td data-label="Created">
                      <Typography variant="pi">
                        {formatDate(code.createdAt)}
                      </Typography>
                    </Td>
                    <Td data-label="Expires">
                      <Typography
                        variant="pi"
                        textColor={isExpired(code.expiresAt) ? 'danger600' : 'neutral800'}
                        fontWeight={isExpired(code.expiresAt) ? 'semiBold' : 'normal'}
                      >
                        {formatDate(code.expiresAt)}
                      </Typography>
                    </Td>
                    <Td data-label="Actions">
                      <Flex gap={1} justifyContent="flex-end">
                        <IconButton
                          label="Delete"
                          variant="danger-ghost"
                          onClick={() => handleDelete(code.id)}
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
          </>
        )}
      </DataTable>
    </Box>
  );
};

export default OTPCodes;

