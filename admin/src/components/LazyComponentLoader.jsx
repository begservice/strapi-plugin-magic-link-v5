import React from 'react';

// This helper ensures the component module structure that Strapi v5 expects
// for lazy-loaded components
const LazyComponentLoader = (importComponent) => {
  return React.lazy(() => {
    return importComponent().then(module => {
      // If the module has a default export, use it
      if (module.default) {
        return { default: module.default };
      }
      
      // Otherwise, use the named export if available
      const firstExport = Object.keys(module)[0];
      if (firstExport && module[firstExport]) {
        return { default: module[firstExport] };
      }
      
      // If no suitable export is found, return a fallback component
      return { 
        default: () => <div>Component loading error</div> 
      };
    });
  });
};

export default LazyComponentLoader; 