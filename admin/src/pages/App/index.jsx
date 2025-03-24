import React, { useEffect } from 'react';
import { Switch, Route, useLocation } from 'react-router-dom';
import { SkipToContent } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { AnErrorOccurred } from '@strapi/helper-plugin';
import HomePage from '../HomePage';
import PLUGIN_ID from '../../pluginId';
import { Helmet } from 'react-helmet';
import SettingsPage from '../Settings';
import TokensPage from '../Tokens';
import getTrad from '../../utils/getTrad';

const App = () => {
  const { formatMessage } = useIntl();
  const location = useLocation();
  const currentPath = location.pathname;
  const isTokensPage = 
    currentPath.includes(`/plugins/strapi-plugin-magic-link-v5/tokens`);
  const isSettingsPage = (
    currentPath.includes(`/plugins/strapi-plugin-magic-link-v5`)) && !isTokensPage;

  return (
    <div>
      <Helmet title={formatMessage({ id: getTrad('Header.title'), defaultMessage: 'Magic Link' })} />
      <SkipToContent>
        {formatMessage({ id: getTrad('Header.title'), defaultMessage: 'Magic Link' })}
      </SkipToContent>
      <Switch>
        <Route path={`/plugins/${PLUGIN_ID}/tokens`} component={TokensPage} exact />
        <Route path={`/settings/${PLUGIN_ID}`} component={SettingsPage} exact />
        <Route path={`/plugins/${PLUGIN_ID}`} component={HomePage} exact />
        <Route component={AnErrorOccurred} />
      </Switch>
    </div>
  );
};

export default App; 