import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@strapi/design-system': resolve(__dirname, '../../node_modules/@strapi/design-system'),
      '@strapi/helper-plugin': resolve(__dirname, '../../node_modules/@strapi/helper-plugin'),
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
        '@strapi/helper-plugin',
        '@strapi/design-system',
        '@strapi/icons',
        /^@strapi\/design-system\/.*/,
        /^@strapi\/design-system\/v2.*/,
        /^@strapi\/helper-plugin\/.*/,
        /^@strapi\/icons\/.*/,
        /^@strapi\/.*/,
      ],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}); 