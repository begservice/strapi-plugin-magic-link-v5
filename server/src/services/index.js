'use strict';

const service = require('./service');
const magicLink = require('./magic-link');
const store = require('../../services/store');
const licenseGuard = require('./license-guard');

module.exports = {
  service,
  'magic-link': magicLink,
  magicLink, // Alias für Kompatibilität
  store,
  'license-guard': licenseGuard,
  licenseGuard, // Alias für Kompatibilität
};
