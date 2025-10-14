import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  Flex,
  TextInput,
  Textarea,
  Typography,
  Grid,
  Toggle,
  NumberInput,
  Divider,
  SingleSelect,
  SingleSelectOption,
  Accordion,
  Badge,
} from '@strapi/design-system';
import { Check, Cog, Mail, Shield, Code } from '@strapi/icons';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import getTrad from '../../utils/getTrad';
import { usePluginLanguage } from '../../components/LanguageProvider';

// ================ THEME ================
const theme = {
  colors: {
    primary: { 600: '#0284C7', 700: '#075985', 100: '#E0F2FE', 50: '#F0F9FF' },
    success: { 600: '#16A34A', 700: '#15803D', 50: '#DCFCE7' },
    warning: { 700: '#A16207', 50: '#FEF3C7' },
    neutral: { 0: '#FFFFFF', 50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 400: '#9CA3AF', 600: '#4B5563', 700: '#374151', 800: '#1F2937' }
  },
  shadows: { sm: '0 1px 3px rgba(0,0,0,0.1)', md: '0 4px 6px rgba(0,0,0,0.1)', xl: '0 20px 25px rgba(0,0,0,0.1)' },
  borderRadius: { md: '8px', lg: '12px', xl: '16px' }
};

// ================ ANIMATIONS ================
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// ================ STYLED COMPONENTS ================
const Container = styled(Box)`
  animation: ${fadeIn} 0.5s;
  max-width: 1400px;
  margin: 0 auto;
`;

const ToggleCard = styled(Box)`
  background: ${props => props.$active ? theme.colors.success[50] : theme.colors.neutral[50]};
  border-radius: ${theme.borderRadius.md};
  padding: 20px;
  transition: all 0.3s;
  border: 2px solid ${props => props.$active ? theme.colors.success[600] : theme.colors.neutral[200]};
  box-shadow: ${props => props.$active ? '0 4px 12px rgba(34, 197, 94, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'};
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.$active ? '0 6px 16px rgba(34, 197, 94, 0.3)' : '0 3px 8px rgba(0, 0, 0, 0.15)'};
  }
  
  ${props => props.$active && `
    &::before {
      content: '${props.$statusLabel || ''}';
      position: absolute;
      top: 8px;
      right: 8px;
      background: ${theme.colors.success[600]};
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
    }
  `}
  
  ${props => !props.$active && `
    &::before {
      content: '${props.$statusLabel || ''}';
      position: absolute;
      top: 8px;
      right: 8px;
      background: ${theme.colors.neutral[400]};
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
    }
  `}
`;

const StickySaveBar = styled(Box)`
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  border-bottom: 1px solid ${theme.colors.neutral[200]};
  box-shadow: ${theme.shadows.sm};
`;

// ================ COMPONENT ================
const SettingsModern = () => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const { get, put } = useFetchClient();
  const { language, changeLanguage } = usePluginLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    enabled: true,
    createUserIfNotExists: true,
    expire_period: 3600,
    confirmationUrl: '',
    from_name: '',
    from_email: '',
    response_email: '',
    token_length: 20,
    stays_valid: false,
    object: '',
    message_html: '',
    message_text: '',
    max_login_attempts: 5,
    login_path: '/magic-link/login',
    user_creation_strategy: 'email',
    verify_email: false,
    welcome_email: false,
    use_jwt_token: true,
    jwt_token_expires_in: '30d',
    callback_url: '',
    allow_magic_links_on_public_registration: false,
    store_login_info: true,
    ui_language: 'en'
  });

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await get('/magic-link/settings');
      const settingsData = res.data.settings || res.data.data || res.data;
      setSettings(prev => ({ ...prev, ...settingsData }));
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading settings:', error);
        toggleNotification({
          type: 'warning',
          message: formatMessage({ id: getTrad('settings.load.error') })
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [get, toggleNotification, formatMessage]);

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await put('/magic-link/settings', { ...settings, ui_language: language });
      toggleNotification({
        type: 'success',
        message: formatMessage({ id: getTrad('settings.save.success') })
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error saving settings:', error);
        toggleNotification({
          type: 'danger',
          message: formatMessage({ id: getTrad('settings.save.error') })
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleLanguageChange = (newLang) => {
    changeLanguage(newLang);
  };

  if (isLoading) {
    return (
      <Box padding={8}>
        <Typography>{formatMessage({ id: getTrad('settings.load.loading') })}</Typography>
      </Box>
    );
  }

  const statusActive = formatMessage({ id: getTrad('status.active') });
  const statusInactive = formatMessage({ id: getTrad('status.inactive') });

  return (
    <Container as="form" onSubmit={handleSave}>
      {/* Sticky Save Bar */}
      <StickySaveBar paddingTop={5} paddingBottom={5} paddingLeft={6} paddingRight={6}>
        <Flex justifyContent="space-between" alignItems="center">
          <Flex direction="column" gap={1} alignItems="flex-start">
            <Typography variant="alpha" fontWeight="bold" style={{ fontSize: '24px' }}>
              {formatMessage({ id: getTrad('settings.page.title') })}
            </Typography>
            <Typography variant="epsilon" textColor="neutral600">
              {formatMessage({ id: getTrad('settings.page.subtitle') })}
            </Typography>
          </Flex>
          <Button
            type="submit"
            loading={isSaving}
            startIcon={<Check />}
            disabled={isSaving}
            size="L"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: '600',
              padding: '12px 24px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            }}
          >
            {isSaving ? formatMessage({ id: getTrad('settings.save.saving') }) : formatMessage({ id: getTrad('settings.save.button') })}
          </Button>
        </Flex>
      </StickySaveBar>

      {/* Content */}
      <Box paddingTop={6} paddingLeft={6} paddingRight={6} paddingBottom={10}>
        {/* Info Banner */}
        <Box
          background="primary50"
          padding={5}
          style={{ borderRadius: theme.borderRadius.lg, border: '2px solid #BAE6FD', marginBottom: '24px' }}
        >
          <Flex gap={3} alignItems="flex-start">
            <Box
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: theme.colors.primary[600],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Cog style={{ width: '20px', height: '20px', color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="pi" fontWeight="bold" style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                {formatMessage({ id: getTrad('settings.info.header') })}
              </Typography>
              <Typography variant="pi" style={{ lineHeight: '1.6', fontSize: '13px' }}>
                • {formatMessage({ id: getTrad('settings.info.line1') })}<br/>
                • {formatMessage({ id: getTrad('settings.info.line2') })}<br/>
                • {formatMessage({ id: getTrad('settings.info.line3') })}<br/>
                • {formatMessage({ id: getTrad('settings.info.line4') })}
              </Typography>
            </Box>
          </Flex>
        </Box>

        <Accordion.Root type="multiple" defaultValue={['general', 'auth', 'email']}>
          {/* General Settings */}
          <Accordion.Item value="general">
            <Accordion.Header>
              <Accordion.Trigger
                icon={Cog}
                description={formatMessage({ id: getTrad('settings.section.general.description') })}
              >
                {formatMessage({ id: getTrad('settings.section.general') })}
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content>
              <Box padding={6}>
                {/* Language Selector - Compact */}
                <Box background="neutral50" padding={4} style={{ borderRadius: theme.borderRadius.md, border: '2px solid #E5E7EB', marginBottom: '24px' }}>
                  <Flex gap={4} alignItems="center">
                    <Typography variant="pi" fontWeight="bold" style={{ minWidth: '150px' }}>
                      {formatMessage({ id: getTrad('settings.language.label') })}
                    </Typography>
                    <Box style={{ width: '200px' }}>
                      <SingleSelect
                        value={language}
                        onChange={handleLanguageChange}
                        size="S"
                      >
                        <SingleSelectOption value="en">{formatMessage({ id: getTrad('settings.language.en') })}</SingleSelectOption>
                        <SingleSelectOption value="de">{formatMessage({ id: getTrad('settings.language.de') })}</SingleSelectOption>
                      </SingleSelect>
                    </Box>
                    <Typography variant="pi" textColor="neutral600" style={{ fontSize: '11px', flex: 1 }}>
                      {formatMessage({ id: getTrad('settings.language.hint') })}
                    </Typography>
                  </Flex>
                </Box>

                {/* Feature Toggles */}
                <Box background="neutral100" padding={5} style={{ borderRadius: theme.borderRadius.md, marginBottom: '24px' }}>
                  <Typography variant="sigma" fontWeight="bold" style={{ marginBottom: '8px', display: 'block', textAlign: 'center', color: theme.colors.neutral[700] }}>
                    {formatMessage({ id: getTrad('settings.features.title') })}
                  </Typography>
                  <Typography variant="pi" textColor="neutral600" style={{ marginBottom: '20px', display: 'block', textAlign: 'center', fontSize: '12px' }}>
                    {formatMessage({ id: getTrad('settings.features.subtitle') })}
                  </Typography>
                  <Grid.Root gap={4}>
                    <Grid.Item col={4} s={6} xs={12}>
                      <ToggleCard $active={settings.enabled} $statusLabel={settings.enabled ? statusActive : statusInactive}>
                        <Flex direction="column" gap={3}>
                          <Flex justifyContent="center" alignItems="center" style={{ marginBottom: '8px' }}>
                            <Toggle
                              checked={settings.enabled}
                              onChange={(e) => updateSetting('enabled', e.target.checked)}
                              size="L"
                            />
                          </Flex>
                          <Box>
                            <Typography variant="pi" fontWeight="bold" style={{ fontSize: '14px', marginBottom: '6px', display: 'block', textAlign: 'center' }}>
                              {formatMessage({ id: getTrad('settings.feature.enabled.title') })}
                            </Typography>
                            <Typography variant="omega" textColor="neutral600" style={{ fontSize: '12px', lineHeight: '1.4', textAlign: 'center' }}>
                              {formatMessage({ id: getTrad('settings.feature.enabled.description') })}
                            </Typography>
                          </Box>
                        </Flex>
                      </ToggleCard>
                    </Grid.Item>
                    <Grid.Item col={4} s={6} xs={12}>
                      <ToggleCard $active={settings.createUserIfNotExists} $statusLabel={settings.createUserIfNotExists ? statusActive : statusInactive}>
                        <Flex direction="column" gap={3}>
                          <Flex justifyContent="center" alignItems="center" style={{ marginBottom: '8px' }}>
                            <Toggle
                              checked={settings.createUserIfNotExists}
                              onChange={(e) => updateSetting('createUserIfNotExists', e.target.checked)}
                              size="L"
                            />
                          </Flex>
                          <Box>
                            <Typography variant="pi" fontWeight="bold" style={{ fontSize: '14px', marginBottom: '6px', display: 'block', textAlign: 'center' }}>
                              {formatMessage({ id: getTrad('settings.feature.createUser.title') })}
                            </Typography>
                            <Typography variant="omega" textColor="neutral600" style={{ fontSize: '12px', lineHeight: '1.4', textAlign: 'center' }}>
                              {formatMessage({ id: getTrad('settings.feature.createUser.description') })}
                            </Typography>
                          </Box>
                        </Flex>
                      </ToggleCard>
                    </Grid.Item>
                    <Grid.Item col={4} s={6} xs={12}>
                      <ToggleCard $active={settings.stays_valid} $statusLabel={settings.stays_valid ? statusActive : statusInactive}>
                        <Flex direction="column" gap={3}>
                          <Flex justifyContent="center" alignItems="center" style={{ marginBottom: '8px' }}>
                            <Toggle
                              checked={settings.stays_valid}
                              onChange={(e) => updateSetting('stays_valid', e.target.checked)}
                              size="L"
                            />
                          </Flex>
                          <Box>
                            <Typography variant="pi" fontWeight="bold" style={{ fontSize: '14px', marginBottom: '6px', display: 'block', textAlign: 'center' }}>
                              {formatMessage({ id: getTrad('settings.feature.staysValid.title') })}
                            </Typography>
                            <Typography variant="omega" textColor="neutral600" style={{ fontSize: '12px', lineHeight: '1.4', textAlign: 'center' }}>
                              {formatMessage({ id: getTrad('settings.feature.staysValid.description') })}
                            </Typography>
                          </Box>
                        </Flex>
                      </ToggleCard>
                    </Grid.Item>
                  </Grid.Root>
                </Box>

                {/* Basic Settings */}
                <Typography variant="sigma" fontWeight="bold" style={{ marginBottom: '16px', display: 'block', color: theme.colors.neutral[700] }}>
                  {formatMessage({ id: getTrad('settings.time.title') })}
                </Typography>
                <Grid.Root gap={6} style={{ marginBottom: '32px' }}>
                  <Grid.Item col={6} s={12}>
                    <Box>
                      <Typography variant="pi" fontWeight="bold" style={{ marginBottom: '8px', display: 'block' }}>
                        {formatMessage({ id: getTrad('settings.expire.label') })}
                      </Typography>
                      <NumberInput
                        hint={formatMessage({ id: getTrad('settings.expire.hint') })}
                        value={settings.expire_period}
                        onChange={val => updateSetting('expire_period', val)}
                        placeholder={formatMessage({ id: getTrad('settings.expire.placeholder') })}
                      />
                      <Box padding={2} background="primary50" style={{ borderRadius: '4px', marginTop: '8px' }}>
                        <Typography variant="pi" textColor="primary700" style={{ fontSize: '11px' }}>
                          {formatMessage({ id: getTrad('settings.expire.recommendation') })}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid.Item>
                  <Grid.Item col={6} s={12}>
                    <Box>
                      <Typography variant="pi" fontWeight="bold" style={{ marginBottom: '8px', display: 'block' }}>
                        {formatMessage({ id: getTrad('settings.tokenLength.label') })}
                      </Typography>
                      <NumberInput
                        hint={formatMessage({ id: getTrad('settings.tokenLength.hint') })}
                        value={settings.token_length}
                        onChange={val => updateSetting('token_length', val)}
                        placeholder={formatMessage({ id: getTrad('settings.tokenLength.placeholder') })}
                      />
                      <Box padding={2} background="success50" style={{ borderRadius: '4px', marginTop: '8px' }}>
                        <Typography variant="pi" textColor="success700" style={{ fontSize: '11px' }}>
                          {formatMessage({ id: getTrad('settings.tokenLength.recommendation') }, { length: settings.token_length })}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid.Item>
                </Grid.Root>

                <Typography variant="sigma" fontWeight="bold" style={{ marginBottom: '16px', display: 'block', color: theme.colors.neutral[700] }}>
                  {formatMessage({ id: getTrad('settings.security.title') })}
                </Typography>
                <Grid.Root gap={6} style={{ marginBottom: '32px' }}>
                  <Grid.Item col={12}>
                    <Box>
                      <Typography variant="pi" fontWeight="bold" style={{ marginBottom: '8px', display: 'block' }}>
                        {formatMessage({ id: getTrad('settings.maxAttempts.label') })}
                      </Typography>
                      <NumberInput
                        hint={formatMessage({ id: getTrad('settings.maxAttempts.hint') })}
                        value={settings.max_login_attempts}
                        onChange={val => updateSetting('max_login_attempts', val)}
                        placeholder={formatMessage({ id: getTrad('settings.maxAttempts.placeholder') })}
                      />
                      <Box padding={2} background="warning50" style={{ borderRadius: '4px', marginTop: '8px' }}>
                        <Typography variant="pi" textColor="warning700" style={{ fontSize: '11px' }}>
                          {formatMessage({ id: getTrad('settings.maxAttempts.warning') })}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid.Item>
                </Grid.Root>

                <Typography variant="sigma" fontWeight="bold" style={{ marginBottom: '16px', display: 'block', color: theme.colors.neutral[700] }}>
                  {formatMessage({ id: getTrad('settings.api.title') })}
                </Typography>
                <Grid.Root gap={6}>
                  <Grid.Item col={12}>
                    <Box>
                      <Typography variant="pi" fontWeight="bold" style={{ marginBottom: '8px', display: 'block' }}>
                        {formatMessage({ id: getTrad('settings.loginPath.label') })}
                      </Typography>
                      <TextInput
                        hint={formatMessage({ id: getTrad('settings.loginPath.hint') })}
                        value={settings.login_path}
                        onChange={(e) => updateSetting('login_path', e.target.value)}
                        placeholder={formatMessage({ id: getTrad('settings.loginPath.placeholder') })}
                      />
                      <Box padding={2} background="neutral100" style={{ borderRadius: '4px', marginTop: '8px', border: '1px solid #E5E7EB' }}>
                        <Typography variant="pi" textColor="neutral700" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                          {formatMessage({ id: getTrad('settings.loginPath.fullPath') }, { path: settings.login_path })}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid.Item>
                  <Grid.Item col={12}>
                    <Box>
                      <Typography variant="pi" fontWeight="bold" style={{ marginBottom: '8px', display: 'block' }}>
                        {formatMessage({ id: getTrad('settings.confirmationUrl.label') })}
                      </Typography>
                      <TextInput
                        hint={formatMessage({ id: getTrad('settings.confirmationUrl.hint') })}
                        value={settings.confirmationUrl}
                        onChange={(e) => updateSetting('confirmationUrl', e.target.value)}
                        placeholder={formatMessage({ id: getTrad('settings.confirmationUrl.placeholder') })}
                      />
                      <Box padding={2} background="primary50" style={{ borderRadius: '4px', marginTop: '8px' }}>
                        <Typography variant="pi" textColor="primary700" style={{ fontSize: '11px' }}>
                          {formatMessage({ id: getTrad('settings.confirmationUrl.example') }, { url: settings.confirmationUrl || 'https://yourapp.com' })}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid.Item>
                  <Grid.Item col={12}>
                    <Box>
                      <Typography variant="pi" fontWeight="bold" style={{ marginBottom: '8px', display: 'block' }}>
                        {formatMessage({ id: getTrad('settings.callbackUrl.label') })}
                      </Typography>
                      <TextInput
                        hint={formatMessage({ id: getTrad('settings.callbackUrl.hint') })}
                        value={settings.callback_url}
                        onChange={(e) => updateSetting('callback_url', e.target.value)}
                        placeholder={formatMessage({ id: getTrad('settings.callbackUrl.placeholder') })}
                      />
                      <Typography variant="pi" textColor="neutral600" style={{ fontSize: '11px', marginTop: '8px' }}>
                        {formatMessage({ id: getTrad('settings.callbackUrl.note') })}
                      </Typography>
                    </Box>
                  </Grid.Item>
                </Grid.Root>
              </Box>
            </Accordion.Content>
          </Accordion.Item>

          {/* Authentication Settings */}
          <Accordion.Item value="auth">
            <Accordion.Header>
              <Accordion.Trigger
                icon={Shield}
                description={formatMessage({ id: getTrad('settings.section.auth.description') })}
              >
                {formatMessage({ id: getTrad('settings.section.auth') })}
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content>
              <Box padding={6}>
                {/* Auth Toggles */}
                <Box background="neutral100" padding={5} style={{ borderRadius: theme.borderRadius.md, marginBottom: '24px' }}>
                  <Typography variant="sigma" fontWeight="bold" style={{ marginBottom: '8px', display: 'block', textAlign: 'center', color: theme.colors.neutral[700] }}>
                    {formatMessage({ id: getTrad('settings.auth.options.title') })}
                  </Typography>
                  <Typography variant="pi" textColor="neutral600" style={{ marginBottom: '20px', display: 'block', textAlign: 'center', fontSize: '12px' }}>
                    {formatMessage({ id: getTrad('settings.auth.options.subtitle') })}
                  </Typography>
                  <Grid.Root gap={4}>
                    <Grid.Item col={3} s={6} xs={12}>
                      <ToggleCard $active={settings.verify_email} $statusLabel={settings.verify_email ? statusActive : statusInactive}>
                        <Flex direction="column" gap={3}>
                          <Flex justifyContent="center" alignItems="center" style={{ marginBottom: '8px' }}>
                            <Toggle
                              checked={settings.verify_email}
                              onChange={(e) => updateSetting('verify_email', e.target.checked)}
                              size="L"
                            />
                          </Flex>
                          <Box>
                            <Typography variant="pi" fontWeight="bold" style={{ fontSize: '14px', marginBottom: '6px', display: 'block', textAlign: 'center' }}>
                              {formatMessage({ id: getTrad('settings.auth.verifyEmail.title') })}
                            </Typography>
                            <Typography variant="omega" textColor="neutral600" style={{ fontSize: '12px', lineHeight: '1.4', textAlign: 'center' }}>
                              {formatMessage({ id: getTrad('settings.auth.verifyEmail.description') })}
                            </Typography>
                          </Box>
                        </Flex>
                      </ToggleCard>
                    </Grid.Item>
                    <Grid.Item col={3} s={6} xs={12}>
                      <ToggleCard $active={settings.welcome_email} $statusLabel={settings.welcome_email ? statusActive : statusInactive}>
                        <Flex direction="column" gap={3}>
                          <Flex justifyContent="center" alignItems="center" style={{ marginBottom: '8px' }}>
                            <Toggle
                              checked={settings.welcome_email}
                              onChange={(e) => updateSetting('welcome_email', e.target.checked)}
                              size="L"
                            />
                          </Flex>
                          <Box>
                            <Typography variant="pi" fontWeight="bold" style={{ fontSize: '14px', marginBottom: '6px', display: 'block', textAlign: 'center' }}>
                              {formatMessage({ id: getTrad('settings.auth.welcomeEmail.title') })}
                            </Typography>
                            <Typography variant="omega" textColor="neutral600" style={{ fontSize: '12px', lineHeight: '1.4', textAlign: 'center' }}>
                              {formatMessage({ id: getTrad('settings.auth.welcomeEmail.description') })}
                            </Typography>
                          </Box>
                        </Flex>
                      </ToggleCard>
                    </Grid.Item>
                    <Grid.Item col={3} s={6} xs={12}>
                      <ToggleCard $active={settings.use_jwt_token} $statusLabel={settings.use_jwt_token ? statusActive : statusInactive}>
                        <Flex direction="column" gap={3}>
                          <Flex justifyContent="center" alignItems="center" style={{ marginBottom: '8px' }}>
                            <Toggle
                              checked={settings.use_jwt_token}
                              onChange={(e) => updateSetting('use_jwt_token', e.target.checked)}
                              size="L"
                            />
                          </Flex>
                          <Box>
                            <Typography variant="pi" fontWeight="bold" style={{ fontSize: '14px', marginBottom: '6px', display: 'block', textAlign: 'center' }}>
                              {formatMessage({ id: getTrad('settings.auth.useJwt.title') })}
                            </Typography>
                            <Typography variant="omega" textColor="neutral600" style={{ fontSize: '12px', lineHeight: '1.4', textAlign: 'center' }}>
                              {formatMessage({ id: getTrad('settings.auth.useJwt.description') })}
                            </Typography>
                          </Box>
                        </Flex>
                      </ToggleCard>
                    </Grid.Item>
                    <Grid.Item col={3} s={6} xs={12}>
                      <ToggleCard $active={settings.store_login_info} $statusLabel={settings.store_login_info ? statusActive : statusInactive}>
                        <Flex direction="column" gap={3}>
                          <Flex justifyContent="center" alignItems="center" style={{ marginBottom: '8px' }}>
                            <Toggle
                              checked={settings.store_login_info}
                              onChange={(e) => updateSetting('store_login_info', e.target.checked)}
                              size="L"
                            />
                          </Flex>
                          <Box>
                            <Typography variant="pi" fontWeight="bold" style={{ fontSize: '14px', marginBottom: '6px', display: 'block', textAlign: 'center' }}>
                              {formatMessage({ id: getTrad('settings.auth.storeLoginInfo.title') })}
                            </Typography>
                            <Typography variant="omega" textColor="neutral600" style={{ fontSize: '12px', lineHeight: '1.4', textAlign: 'center' }}>
                              {formatMessage({ id: getTrad('settings.auth.storeLoginInfo.description') })}
                            </Typography>
                          </Box>
                        </Flex>
                      </ToggleCard>
                    </Grid.Item>
                  </Grid.Root>
                </Box>

                {/* Auth Settings */}
                <Typography variant="sigma" fontWeight="bold" style={{ marginBottom: '16px', display: 'block', color: theme.colors.neutral[700] }}>
                  {formatMessage({ id: getTrad('settings.auth.management.title') })}
                </Typography>
                <Grid.Root gap={6}>
                  <Grid.Item col={12}>
                    <Box>
                      <Typography variant="pi" fontWeight="bold" style={{ marginBottom: '8px', display: 'block' }}>
                        {formatMessage({ id: getTrad('settings.auth.strategy.label') })}
                      </Typography>
                      <SingleSelect
                        value={settings.user_creation_strategy}
                        onChange={(val) => updateSetting('user_creation_strategy', val)}
                      >
                        <SingleSelectOption value="email">{formatMessage({ id: getTrad('settings.auth.strategy.email') })}</SingleSelectOption>
                        <SingleSelectOption value="emailUsername">{formatMessage({ id: getTrad('settings.auth.strategy.emailUsername') })}</SingleSelectOption>
                        <SingleSelectOption value="manual">{formatMessage({ id: getTrad('settings.auth.strategy.manual') })}</SingleSelectOption>
                      </SingleSelect>
                      <Box padding={2} background="neutral100" style={{ borderRadius: '4px', marginTop: '8px', border: '1px solid #E5E7EB' }}>
                        <Typography variant="pi" textColor="neutral700" style={{ fontSize: '11px' }}>
                          {formatMessage({ id: getTrad('settings.auth.strategy.current') }, { 
                            strategy: settings.user_creation_strategy === 'email' ? formatMessage({ id: getTrad('settings.auth.strategy.email') }) :
                                     settings.user_creation_strategy === 'emailUsername' ? formatMessage({ id: getTrad('settings.auth.strategy.emailUsername') }) :
                                     formatMessage({ id: getTrad('settings.auth.strategy.manual') })
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid.Item>
                  <Grid.Item col={12}>
                    <Box>
                      <Typography variant="pi" fontWeight="bold" style={{ marginBottom: '8px', display: 'block' }}>
                        {formatMessage({ id: getTrad('settings.auth.jwtExpiration.label') })}
                      </Typography>
                      <TextInput
                        hint={formatMessage({ id: getTrad('settings.auth.jwtExpiration.hint') })}
                        value={settings.jwt_token_expires_in}
                        onChange={(e) => updateSetting('jwt_token_expires_in', e.target.value)}
                        placeholder={formatMessage({ id: getTrad('settings.auth.jwtExpiration.placeholder') })}
                      />
                      <Box padding={2} background="success50" style={{ borderRadius: '4px', marginTop: '8px' }}>
                        <Typography variant="pi" textColor="success700" style={{ fontSize: '11px' }}>
                          {formatMessage({ id: getTrad('settings.auth.jwtExpiration.examples') })}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid.Item>
                </Grid.Root>
              </Box>
            </Accordion.Content>
          </Accordion.Item>

          {/* Email Settings */}
          <Accordion.Item value="email">
            <Accordion.Header>
              <Accordion.Trigger
                icon={Mail}
                description={formatMessage({ id: getTrad('settings.section.email.description') })}
              >
                {formatMessage({ id: getTrad('settings.section.email') })}
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content>
              <Box padding={6}>
                {/* Email From Settings */}
                <Typography variant="sigma" fontWeight="bold" style={{ marginBottom: '8px', display: 'block', color: theme.colors.neutral[700] }}>
                  {formatMessage({ id: getTrad('settings.email.sender.title') })}
                </Typography>
                <Typography variant="pi" textColor="neutral600" style={{ marginBottom: '20px', display: 'block', fontSize: '12px' }}>
                  {formatMessage({ id: getTrad('settings.email.sender.subtitle') })}
                </Typography>
                <Grid.Root gap={6} style={{ marginBottom: '32px' }}>
                  <Grid.Item col={4} s={12}>
                    <Box>
                      <Typography variant="pi" fontWeight="bold" style={{ marginBottom: '8px', display: 'block' }}>
                        {formatMessage({ id: getTrad('settings.email.fromName.label') })}
                      </Typography>
                      <TextInput
                        hint={formatMessage({ id: getTrad('settings.email.fromName.hint') })}
                        value={settings.from_name}
                        onChange={(e) => updateSetting('from_name', e.target.value)}
                        placeholder={formatMessage({ id: getTrad('settings.email.fromName.placeholder') })}
                      />
                      <Typography variant="pi" textColor="neutral600" style={{ fontSize: '11px', marginTop: '6px' }}>
                        {formatMessage({ id: getTrad('settings.email.fromName.example') })}
                      </Typography>
                    </Box>
                  </Grid.Item>
                  <Grid.Item col={4} s={12}>
                    <Box>
                      <Typography variant="pi" fontWeight="bold" style={{ marginBottom: '8px', display: 'block' }}>
                        {formatMessage({ id: getTrad('settings.email.fromEmail.label') })}
                      </Typography>
                      <TextInput
                        type="email"
                        hint={formatMessage({ id: getTrad('settings.email.fromEmail.hint') })}
                        value={settings.from_email}
                        onChange={(e) => updateSetting('from_email', e.target.value)}
                        placeholder={formatMessage({ id: getTrad('settings.email.fromEmail.placeholder') })}
                      />
                      <Typography variant="pi" textColor="neutral600" style={{ fontSize: '11px', marginTop: '6px' }}>
                        {formatMessage({ id: getTrad('settings.email.fromEmail.note') })}
                      </Typography>
                    </Box>
                  </Grid.Item>
                  <Grid.Item col={4} s={12}>
                    <Box>
                      <Typography variant="pi" fontWeight="bold" style={{ marginBottom: '8px', display: 'block' }}>
                        {formatMessage({ id: getTrad('settings.email.responseEmail.label') })}
                      </Typography>
                      <TextInput
                        type="email"
                        hint={formatMessage({ id: getTrad('settings.email.responseEmail.hint') })}
                        value={settings.response_email}
                        onChange={(e) => updateSetting('response_email', e.target.value)}
                        placeholder={formatMessage({ id: getTrad('settings.email.responseEmail.placeholder') })}
                      />
                      <Typography variant="pi" textColor="neutral600" style={{ fontSize: '11px', marginTop: '6px' }}>
                        {formatMessage({ id: getTrad('settings.email.responseEmail.note') })}
                      </Typography>
                    </Box>
                  </Grid.Item>
                  <Grid.Item col={12}>
                    <Box>
                      <Typography variant="pi" fontWeight="bold" style={{ marginBottom: '8px', display: 'block' }}>
                        {formatMessage({ id: getTrad('settings.email.subject.label') })}
                      </Typography>
                      <TextInput
                        hint={formatMessage({ id: getTrad('settings.email.subject.hint') })}
                        value={settings.object}
                        onChange={(e) => updateSetting('object', e.target.value)}
                        placeholder={formatMessage({ id: getTrad('settings.email.subject.placeholder') })}
                      />
                      <Typography variant="pi" textColor="neutral600" style={{ fontSize: '11px', marginTop: '6px' }}>
                        {formatMessage({ id: getTrad('settings.email.subject.note') })}
                      </Typography>
                    </Box>
                  </Grid.Item>
                </Grid.Root>

                {/* Email Templates */}
                <Divider style={{ marginBottom: '24px' }} />
                <Typography variant="sigma" fontWeight="bold" style={{ marginBottom: '8px', display: 'block', color: theme.colors.neutral[700] }}>
                  {formatMessage({ id: getTrad('settings.email.templates.title') })}
                </Typography>
                <Typography variant="pi" textColor="neutral600" style={{ marginBottom: '20px', display: 'block', fontSize: '12px' }}>
                  {formatMessage({ id: getTrad('settings.email.templates.subtitle') })}
                </Typography>
                
                {/* Platzhalter Info Box - Kompakt */}
                <Box 
                  background="primary100" 
                  padding={3} 
                  style={{ borderRadius: theme.borderRadius.md, marginBottom: '16px', border: '2px solid #BAE6FD' }}
                >
                  <Typography variant="pi" fontWeight="bold" style={{ marginBottom: '8px', display: 'block', color: theme.colors.primary[700], fontSize: '13px' }}>
                    {formatMessage({ id: getTrad('settings.email.placeholders.title') })}
                  </Typography>
                  <Grid.Root gap={3}>
                    <Grid.Item col={6} s={12}>
                      <Box 
                        padding={3} 
                        background="white" 
                        style={{ 
                          borderRadius: '6px', 
                          cursor: 'pointer', 
                          border: '1px solid #BAE6FD',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(2, 132, 199, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        onClick={() => {
                          navigator.clipboard.writeText('<%= URL %>');
                          toggleNotification({ type: 'success', message: formatMessage({ id: getTrad('settings.email.placeholders.copied') }, { placeholder: '<%= URL %>' }) });
                        }}
                      >
                        <Typography variant="pi" style={{ fontFamily: 'monospace', fontSize: '14px', color: theme.colors.primary[700], fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                          {formatMessage({ id: getTrad('settings.email.placeholders.url') })}
                        </Typography>
                        <Typography variant="omega" textColor="neutral600" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                          {formatMessage({ id: getTrad('settings.email.placeholders.url.description') })}<br/>
                          <span style={{ fontSize: '10px', color: '#999' }}>{formatMessage({ id: getTrad('settings.email.placeholders.url.example') })}</span>
                        </Typography>
                      </Box>
                    </Grid.Item>
                    <Grid.Item col={6} s={12}>
                      <Box 
                        padding={3} 
                        background="white" 
                        style={{ 
                          borderRadius: '6px', 
                          cursor: 'pointer', 
                          border: '1px solid #BAE6FD',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(2, 132, 199, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        onClick={() => {
                          navigator.clipboard.writeText('<%= CODE %>');
                          toggleNotification({ type: 'success', message: formatMessage({ id: getTrad('settings.email.placeholders.copied') }, { placeholder: '<%= CODE %>' }) });
                        }}
                      >
                        <Typography variant="pi" style={{ fontFamily: 'monospace', fontSize: '14px', color: theme.colors.primary[700], fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                          {formatMessage({ id: getTrad('settings.email.placeholders.code') })}
                        </Typography>
                        <Typography variant="omega" textColor="neutral600" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                          {formatMessage({ id: getTrad('settings.email.placeholders.code.description') })}<br/>
                          <span style={{ fontSize: '10px', color: '#999' }}>{formatMessage({ id: getTrad('settings.email.placeholders.code.example') })}</span>
                        </Typography>
                      </Box>
                    </Grid.Item>
                  </Grid.Root>
                </Box>

                <Grid.Root gap={8}>
                  <Grid.Item col={12}>
                    <Box 
                      background="neutral0" 
                      padding={6} 
                      style={{ borderRadius: theme.borderRadius.lg, border: '2px solid #E5E7EB', width: '100%' }}
                    >
                      <Flex justifyContent="space-between" alignItems="center" style={{ marginBottom: '16px' }}>
                        <Flex alignItems="center" gap={2}>
                          <Typography variant="delta" fontWeight="bold" style={{ fontSize: '18px' }}>
                            {formatMessage({ id: getTrad('settings.email.html.title') })}
                          </Typography>
                          <Badge variant="success">{formatMessage({ id: getTrad('settings.email.html.badge') })}</Badge>
                        </Flex>
                        <Button
                          variant="tertiary"
                          size="S"
                          onClick={() => {
                            const defaultTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>Magic Link Login</h2>
  <p>${formatMessage({ id: getTrad('settings.email.placeholders.url.description') })}</p>
  <p><a href="<%= URL %>?loginToken=<%= CODE %>">${language === 'de' ? 'Jetzt anmelden' : 'Sign in now'}</a></p>
  <p style="color: #666; font-size: 14px;">${language === 'de' ? 'Der Link läuft in 1 Stunde ab.' : 'The link expires in 1 hour.'}</p>
</body>
</html>`;
                            updateSetting('message_html', defaultTemplate);
                            toggleNotification({ type: 'success', message: formatMessage({ id: getTrad('settings.email.html.defaultLoaded') }) });
                          }}
                        >
                          {formatMessage({ id: getTrad('settings.email.html.loadDefault') })}
                        </Button>
                      </Flex>
                      <Typography variant="pi" textColor="neutral600" style={{ marginBottom: '16px', display: 'block', fontSize: '14px' }}>
                        {formatMessage({ id: getTrad('settings.email.html.description') })}
                      </Typography>
                      <Box 
                        style={{ 
                          border: '2px solid #E5E7EB', 
                          borderRadius: '6px', 
                          overflow: 'hidden',
                          background: '#1e1e1e',
                          height: '700px',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <Box 
                          padding={2} 
                          background="neutral700" 
                          style={{ borderBottom: '1px solid #333', flexShrink: 0 }}
                        >
                          <Typography variant="omega" style={{ color: '#888', fontSize: '11px', fontFamily: 'monospace' }}>
                            {formatMessage({ id: getTrad('settings.email.html.filename') })}
                          </Typography>
                        </Box>
                        <textarea
                          value={settings.message_html}
                          onChange={(e) => updateSetting('message_html', e.target.value)}
                          style={{ 
                            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                            height: '100%',
                            fontSize: '14px',
                            lineHeight: '1.8',
                            background: '#1e1e1e',
                            color: '#d4d4d4',
                            border: 'none',
                            padding: '20px',
                            resize: 'none',
                            width: '100%',
                            boxSizing: 'border-box',
                            outline: 'none',
                            margin: 0,
                            display: 'block',
                            overflow: 'auto'
                          }}
                          placeholder={formatMessage({ id: getTrad('settings.email.html.placeholder') })}
                        />
                      </Box>
                      <Flex gap={2} style={{ marginTop: '12px' }} wrap="wrap">
                        <Button
                          variant="secondary"
                          size="S"
                          onClick={() => {
                            navigator.clipboard.writeText(settings.message_html);
                            toggleNotification({ type: 'success', message: formatMessage({ id: getTrad('settings.email.html.copy') }) + '!' });
                          }}
                        >
                          {formatMessage({ id: getTrad('settings.email.html.copy') })}
                        </Button>
                        <Button
                          variant="tertiary"
                          size="S"
                          onClick={() => {
                            const lines = settings.message_html.split('\n').length;
                            const chars = settings.message_html.length;
                            toggleNotification({ 
                              type: 'info', 
                              message: formatMessage({ id: getTrad('settings.email.html.stats') }, { lines, chars })
                            });
                          }}
                        >
                          {formatMessage({ id: getTrad('settings.email.html.info') })}
                        </Button>
                      </Flex>
                    </Box>
                  </Grid.Item>
                  
                  <Grid.Item col={12}>
                    <Box 
                      background="neutral0" 
                      padding={6} 
                      style={{ borderRadius: theme.borderRadius.lg, border: '2px solid #E5E7EB', width: '100%' }}
                    >
                      <Flex justifyContent="space-between" alignItems="center" style={{ marginBottom: '16px' }}>
                        <Flex alignItems="center" gap={2}>
                          <Typography variant="delta" fontWeight="bold" style={{ fontSize: '18px' }}>
                            {formatMessage({ id: getTrad('settings.email.text.title') })}
                          </Typography>
                          <Badge variant="secondary">{formatMessage({ id: getTrad('settings.email.text.badge') })}</Badge>
                        </Flex>
                        <Button
                          variant="tertiary"
                          size="S"
                          onClick={() => {
                            const defaultTemplate = `${language === 'de' ? 'Hallo' : 'Hello'},

${language === 'de' ? 'Klicke auf den folgenden Link, um dich anzumelden' : 'Click the following link to sign in'}:

<%= URL %>?loginToken=<%= CODE %>

${language === 'de' ? 'Der Link läuft in 1 Stunde ab.' : 'The link expires in 1 hour.'}`;
                            updateSetting('message_text', defaultTemplate);
                            toggleNotification({ type: 'success', message: formatMessage({ id: getTrad('settings.email.text.defaultLoaded') }) });
                          }}
                        >
                          {formatMessage({ id: getTrad('settings.email.text.loadDefault') })}
                        </Button>
                      </Flex>
                      <Typography variant="pi" textColor="neutral600" style={{ marginBottom: '16px', display: 'block', fontSize: '14px' }}>
                        {formatMessage({ id: getTrad('settings.email.text.description') })}
                      </Typography>
                      <Box 
                        style={{ 
                          border: '2px solid #E5E7EB', 
                          borderRadius: '6px', 
                          overflow: 'hidden',
                          background: '#f5f5f5',
                          height: '500px',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <Box 
                          padding={2} 
                          background="neutral200" 
                          style={{ borderBottom: '1px solid #d1d5db', flexShrink: 0 }}
                        >
                          <Typography variant="omega" style={{ color: '#666', fontSize: '11px', fontFamily: 'monospace' }}>
                            {formatMessage({ id: getTrad('settings.email.text.filename') })}
                          </Typography>
                        </Box>
                        <textarea
                          value={settings.message_text}
                          onChange={(e) => updateSetting('message_text', e.target.value)}
                          style={{ 
                            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                            height: '100%',
                            fontSize: '14px',
                            lineHeight: '1.8',
                            background: '#f5f5f5',
                            color: '#1f2937',
                            border: 'none',
                            padding: '20px',
                            resize: 'none',
                            width: '100%',
                            boxSizing: 'border-box',
                            outline: 'none',
                            margin: 0,
                            display: 'block',
                            overflow: 'auto'
                          }}
                          placeholder={formatMessage({ id: getTrad('settings.email.text.placeholder') })}
                        />
                      </Box>
                      <Flex gap={2} style={{ marginTop: '12px' }} wrap="wrap">
                        <Button
                          variant="secondary"
                          size="S"
                          onClick={() => {
                            navigator.clipboard.writeText(settings.message_text);
                            toggleNotification({ type: 'success', message: formatMessage({ id: getTrad('settings.email.text.copy') }) + '!' });
                          }}
                        >
                          {formatMessage({ id: getTrad('settings.email.text.copy') })}
                        </Button>
                      </Flex>
                    </Box>
                  </Grid.Item>
                </Grid.Root>
              </Box>
            </Accordion.Content>
          </Accordion.Item>

          {/* Advanced Settings */}
          <Accordion.Item value="advanced">
            <Accordion.Header>
              <Accordion.Trigger
                icon={Code}
                description={formatMessage({ id: getTrad('settings.section.advanced.description') })}
              >
                {formatMessage({ id: getTrad('settings.section.advanced') })}
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content>
              <Box padding={6}>
                <Typography variant="sigma" fontWeight="bold" style={{ marginBottom: '8px', display: 'block', color: theme.colors.neutral[700] }}>
                  {formatMessage({ id: getTrad('settings.advanced.title') })}
                </Typography>
                <Typography variant="pi" textColor="neutral600" style={{ marginBottom: '20px', display: 'block', fontSize: '12px' }}>
                  {formatMessage({ id: getTrad('settings.advanced.subtitle') })}
                </Typography>
                <Grid.Root gap={6}>
                  <Grid.Item col={12}>
                    <ToggleCard $active={settings.allow_magic_links_on_public_registration} $statusLabel={settings.allow_magic_links_on_public_registration ? statusActive : statusInactive}>
                      <Flex direction="column" gap={3}>
                        <Flex justifyContent="center" alignItems="center" style={{ marginBottom: '8px' }}>
                          <Toggle
                            checked={settings.allow_magic_links_on_public_registration}
                            onChange={(e) => updateSetting('allow_magic_links_on_public_registration', e.target.checked)}
                            size="L"
                          />
                        </Flex>
                        <Box>
                          <Typography variant="pi" fontWeight="bold" style={{ fontSize: '14px', marginBottom: '6px', display: 'block', textAlign: 'center' }}>
                            {formatMessage({ id: getTrad('settings.advanced.publicRegistration.title') })}
                          </Typography>
                          <Typography variant="omega" textColor="neutral600" style={{ fontSize: '12px', lineHeight: '1.4', textAlign: 'center' }}>
                            {formatMessage({ id: getTrad('settings.advanced.publicRegistration.description') })}
                          </Typography>
                        </Box>
                      </Flex>
                    </ToggleCard>
                  </Grid.Item>
                </Grid.Root>
              </Box>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>

        {/* Info Footer */}
        <Box
          background="success50"
          padding={5}
          style={{ borderRadius: theme.borderRadius.lg, marginTop: '32px', border: '2px solid #BBF7D0' }}
        >
          <Flex gap={3} alignItems="center" justifyContent="center">
            <Check style={{ width: '24px', height: '24px', color: theme.colors.success[600] }} />
            <Box>
              <Typography variant="pi" fontWeight="bold" style={{ marginBottom: '4px', display: 'block' }}>
                {formatMessage({ id: getTrad('settings.footer.quickhelp') })}
              </Typography>
              <Typography variant="pi" textColor="neutral700" style={{ fontSize: '13px' }}>
                <strong>{formatMessage({ id: getTrad('settings.footer.reminder') })}</strong>
              </Typography>
            </Box>
          </Flex>
        </Box>
      </Box>
    </Container>
  );
};

export default SettingsModern;
