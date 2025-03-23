import React from 'react';
import pluginId from './pluginId';

const routes = [
  {
    path: `/plugins/${pluginId}`,
    async Component() {
      const { default: Component } = await import('./pages/HomePage');
      return (
        <React.Suspense fallback={<div>Loading...</div>}>
          <Component />
        </React.Suspense>
      );
    },
  },
  {
    path: `/plugins/${pluginId}/tokens`,
    async Component() {
      const { default: Component } = await import('./pages/Tokens');
      return (
        <React.Suspense fallback={<div>Loading...</div>}>
          <Component />
        </React.Suspense>
      );
    },
  },
  {
    path: `/settings/${pluginId}`,
    async Component() {
      const { default: Component } = await import('./pages/Settings');
      return (
        <React.Suspense fallback={<div>Loading...</div>}>
          <Component />
        </React.Suspense>
      );
    },
  },
];

export default routes; 