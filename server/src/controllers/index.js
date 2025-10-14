'use strict';

/**
 * Controllers
 */
const controller = require('./controller');
const auth = require('./auth');
const tokens = require('./tokens');
const jwt = require('./jwt');
const license = require('./license');

module.exports = {
  controller,
  auth,
  tokens,
  jwt,
  license,
};
