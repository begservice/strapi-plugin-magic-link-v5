import React from 'react';
import { Main, Box, Typography } from '@strapi/design-system';
import pluginId from '../../pluginId';
import HomePage from '../HomePage';
import TokensPage from '../Tokens';

const App = () => {
  console.log("Magic Link App-Root-Komponente wird geladen");
  
  // Ermittle den aktuellen Pfad, um zu sehen, welche Route angezeigt werden soll
  const currentPath = window.location.pathname;
  console.log("Aktueller Pfad:", currentPath);
  console.log("Plugin ID:", pluginId);
  
  // Einfachere Bedingungen, die nur prüfen, ob der Pfad bestimmte Segmente enthält
  const isTokensPage = currentPath.includes(`/plugins/${pluginId}/tokens`) || 
                      currentPath.includes(`/plugins/magic-link/tokens`);
  const isHomePage = (currentPath.includes(`/plugins/${pluginId}`) || 
                     currentPath.includes(`/plugins/magic-link`)) && !isTokensPage;

  console.log("isTokensPage:", isTokensPage);
  console.log("isHomePage:", isHomePage);
  
  let content;
  if (isTokensPage) {
    console.log("Zeige TokensPage an");
    content = <TokensPage />;
  } else if (isHomePage) {
    console.log("Zeige HomePage an");
    content = <HomePage />;
  } else {
    console.log("Zeige 404 Seite an");
    content = (
      <Box padding={8} background="neutral100">
        <Typography variant="alpha">
          404 - Route nicht gefunden: {currentPath}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Main>
      {content}
    </Main>
  );
};

export { App };
export default App; 