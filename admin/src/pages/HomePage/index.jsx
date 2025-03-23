import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from '@strapi/strapi/admin';
import { 
  Box, 
  Typography, 
  LinkButton, 
  Flex, 
  Main,
  Card,
  Grid,
  Icon,
  Divider
} from '@strapi/design-system';
import { Cog, User, Lock, Key, Shield, ArrowRight } from '@strapi/icons';
import pluginId from '../../pluginId';
import getTrad from '../../utils/getTrad';

const HomePage = () => {
  const { formatMessage } = useIntl();

  return (
    <Main>
      <Box 
        background="neutral100" 
        padding={8} 
        shadow="tableShadow" 
        hasRadius
        borderColor="neutral200"
        borderWidth="1px"
        borderStyle="solid"
        marginBottom={6}
      >
        <Flex direction="column" gap={3}>
          <Typography variant="alpha" textColor="neutral800">
            {formatMessage({ id: 'plugin.name', defaultMessage: 'Magic Link' })}
          </Typography>
          
          <Divider />
          
          <Typography variant="epsilon">
            {formatMessage({
              id: getTrad('pages.HomePage.header.description'),
              defaultMessage: 'Configure your passwordless login through the Settings page.'
            })}
          </Typography>

          <Typography variant="omega" textColor="neutral600">
            Ermöglichen Sie Ihren Benutzern eine sichere und passwortlose Anmeldung über einmalige Magic Links, 
            die per E-Mail versendet werden. Verwalten Sie aktive Tokens für maximale Sicherheit.
          </Typography>
        </Flex>
      </Box>

      <Grid gap={6}>
        <Grid.Item col={4} s={6} xs={12}>
          <Card 
            shadow="tableShadow" 
            style={{ height: '100%' }}
            borderColor="primary200"
            borderWidth="1px"
            borderStyle="solid"
            background="neutral0"
            hasRadius
          >
            <Card.Content>
              <Flex direction="column" alignItems="center" gap={5} paddingBottom={2}>
                <Box 
                  background="primary100" 
                  borderRadius="50%" 
                  width={64} 
                  height={64} 
                  shadow="filterShadow"
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                  <Icon as={Cog} width="2rem" height="2rem" color="primary600" />
                </Box>
                
                <Typography variant="delta" textAlign="center" fontWeight="bold">
                  {formatMessage({
                    id: getTrad('pages.HomePage.settings'),
                    defaultMessage: 'Konfiguration'
                  })}
                </Typography>
                
                <Typography textAlign="center">
                  Konfigurieren Sie E-Mail-Vorlagen, Token-Einstellungen und Benutzerregistrierungen nach Ihren Anforderungen.
                </Typography>
                
                <LinkButton
                  variant="secondary"
                  to={`/settings/${pluginId}`}
                  startIcon={<Cog fill="neutral600" />}
                  endIcon={<ArrowRight fill="neutral600" />}
                  fullWidth
                >
                  {formatMessage({
                    id: getTrad('pages.HomePage.settings.cta'),
                    defaultMessage: 'Zu den Einstellungen'
                  })}
                </LinkButton>
              </Flex>
            </Card.Content>
          </Card>
        </Grid.Item>

        <Grid.Item col={4} s={6} xs={12}>
          <Card 
            shadow="tableShadow" 
            style={{ height: '100%' }}
            borderColor="success200"
            borderWidth="1px"
            borderStyle="solid"
            background="neutral0"
            hasRadius
          >
            <Card.Content>
              <Flex direction="column" alignItems="center" gap={5} paddingBottom={2}>
                <Box 
                  background="success100" 
                  borderRadius="50%" 
                  width={64} 
                  height={64} 
                  shadow="filterShadow"
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                  <Icon as={Key} width="2rem" height="2rem" color="success600" />
                </Box>
                
                <Typography variant="delta" textAlign="center" fontWeight="bold">
                  {formatMessage({
                    id: getTrad('pages.HomePage.tokens'),
                    defaultMessage: 'Token-Verwaltung'
                  })}
                </Typography>
                
                <Typography textAlign="center">
                  Überwachen und verwalten Sie aktive Anmelde-Tokens. Sperren Sie verdächtige Aktivitäten und behalten Sie den Überblick.
                </Typography>
                
                <LinkButton
                  variant="secondary"
                  to={`/plugins/${pluginId}/tokens`}
                  startIcon={<Lock fill="success600" />}
                  endIcon={<ArrowRight fill="success600" />}
                  fullWidth
                >
                  {formatMessage({
                    id: getTrad('pages.HomePage.tokens.cta'),
                    defaultMessage: 'Tokens verwalten'
                  })}
                </LinkButton>
              </Flex>
            </Card.Content>
          </Card>
        </Grid.Item>

        <Grid.Item col={4} s={6} xs={12}>
          <Card 
            shadow="tableShadow" 
            style={{ height: '100%' }}
            borderColor="neutral200"
            borderWidth="1px"
            borderStyle="solid"
            background="neutral0"
            hasRadius
          >
            <Card.Content>
              <Flex direction="column" alignItems="center" gap={5} paddingBottom={2}>
                <Box 
                  background="neutral100" 
                  borderRadius="50%" 
                  width={64} 
                  height={64} 
                  shadow="filterShadow"
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                  <Icon as={User} width="2rem" height="2rem" color="neutral600" />
                </Box>
                
                <Typography variant="delta" textAlign="center" fontWeight="bold">
                  {formatMessage({
                    id: getTrad('pages.HomePage.users'),
                    defaultMessage: 'Benutzerverwaltung'
                  })}
                </Typography>
                
                <Typography textAlign="center">
                  Verwalten Sie Benutzerkonten und -berechtigungen in der integrierten Benutzerverwaltung von Strapi.
                </Typography>
                
                <LinkButton
                  variant="secondary"
                  to="/admin/settings/user-management"
                  startIcon={<User fill="neutral600" />}
                  endIcon={<ArrowRight fill="neutral600" />}
                  fullWidth
                >
                  {formatMessage({
                    id: getTrad('pages.HomePage.users.cta'),
                    defaultMessage: 'Benutzer verwalten'
                  })}
                </LinkButton>
              </Flex>
            </Card.Content>
          </Card>
        </Grid.Item>
      </Grid>

      <Box
        background="neutral100"
        padding={4}
        marginTop={6}
        hasRadius
        borderColor="neutral200"
        borderWidth="1px"
        borderStyle="solid"
      >
        <Flex alignItems="center" gap={2}>
          <Shield fill="primary600" />

        </Flex>
      </Box>
    </Main>
  );
};

export default HomePage; 