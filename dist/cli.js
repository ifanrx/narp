'use strict';

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _read = require('read');

var _read2 = _interopRequireDefault(_read);

var _confighelpers = require('./confighelpers.js');

var _constants = require('./constants.js');

var _index = require('./index.js');

var api = _interopRequireWildcard(_index);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Adds a password option to the yargs object
var sharedOptions = function sharedOptions(yargsObj) {
  return yargsObj.option('password', {
    alias: 'p',
    type: 'string',
    description: '[Transifex] Password'
  }).option('token', {
    alias: 't',
    type: 'string',
    description: '[POEditor] API token'
  }).option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'More verbose output'
  });
};

// Construct the CLI
var args = _yargs2.default.command('pull', 'Get stuff', sharedOptions).command('push', 'Push stuff', sharedOptions).help('help').alias('help', 'h').argv;

var configs = (0, _confighelpers.getConfig)();

var buildOptions = function buildOptions(credentials, verbose) {
  return {
    vendor: { credentials: credentials },
    verbose: verbose
  };
};

var askForPassword = function askForPassword(fn) {
  (0, _read2.default)({ prompt: 'Password: ', silent: true }, function (er, password) {
    fn(password);
  });
};

var askForToken = function askForToken(fn) {
  (0, _read2.default)({ prompt: 'API Token: ', silent: true }, function (er, token) {
    fn(token);
  });
};

if (args._[0] === 'pull') {
  if (configs.vendor.name === _constants.Vendors.TRANSIFEX && !configs.vendor.credentials.password && !args.password) {
    askForPassword(function (password) {
      api.pull(buildOptions({ password: password }, args.verbose));
    });
  } else if (configs.vendor.name === _constants.Vendors.POEDITOR && !configs.vendor.credentials.token && !args.token) {
    askForToken(function (token) {
      api.pull(buildOptions({ token: token }, args.verbose));
    });
  } else {
    api.pull(buildOptions({
      password: args.password || configs.vendor.credentials.password,
      token: args.token || configs.vendor.credentials.token
    }, args.verbose));
  }
}

if (args._[0] === 'push') {
  if (configs.vendor.name === _constants.Vendors.TRANSIFEX && !configs.vendor.credentials.password && !args.password) {
    askForPassword(function (password) {
      api.push(buildOptions({ password: password }, args.verbose));
    });
  } else if (configs.vendor.name === _constants.Vendors.POEDITOR && !configs.vendor.credentials.token && !args.token) {
    askForToken(function (token) {
      api.push(buildOptions({ token: token }, args.verbose));
    });
  } else {
    api.push(buildOptions({
      password: args.password || configs.vendor.credentials.password,
      token: args.token || configs.vendor.credentials.token
    }, args.verbose));
  }
}

if (args._[0] === 'extract') {
  api.extract(buildOptions(null, args.verbose), args._[1]);
}