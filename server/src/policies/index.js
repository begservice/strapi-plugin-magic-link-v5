'use strict';

const licenseCheck = require('./license-check');
const compatibilityCheck = require('./compatibility-check');

module.exports = {
  'license-check': licenseCheck,
  'compatibility-check': compatibilityCheck,
};
