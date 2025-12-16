'use strict';

const passwordlessCompat = require('./middlewares/passwordless-compat');

module.exports = ({ strapi }) => {
  // Register passwordless compatibility middleware globally
  // This intercepts /api/passwordless/* requests and redirects to /api/magic-link/*
  strapi.server.use(passwordlessCompat({}, { strapi }));
  
  strapi.log.info('[Magic-Link] Passwordless compatibility middleware registered');
};
