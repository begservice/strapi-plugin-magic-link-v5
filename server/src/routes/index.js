'use strict';

const contentApi = require('./content-api');
const admin = require('./admin');
const compatibility = require('./compatibility');

module.exports = {
  admin,
  'content-api': contentApi,
  // Passwordless compatibility routes (enabled via settings)
  'passwordless-compat': compatibility,
};
