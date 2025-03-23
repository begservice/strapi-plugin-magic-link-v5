'use strict';

const contentApi = require('./content-api');
const admin = require('./admin');

module.exports = {
  admin,
  'content-api': contentApi,
};
