import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@strapi/design-system': resolve(__dirname, '../../node_modules/@strapi/design-system'),
      '@strapi/icons': resolve(__dirname, '../../node_modules/@strapi/icons'),
    },
  },
  build: {
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react-router-dom',
        'react-intl',
        'styled-components',
        'formik',
        'react-query',
        'prop-types',
        'yup',
        '@strapi/strapi',
        '@strapi/design-system',
        '@strapi/icons',
        /^@strapi\/design-system\/.*/,
      ],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}); 