'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uploadTranslations = exports.fetchSource = exports.fetchTranslations = exports.assertCredentials = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _got = require('got');

var _got2 = _interopRequireDefault(_got);

var _gettextParser = require('gettext-parser');

var _feedback = require('../feedback.js');

var feedback = _interopRequireWildcard(_feedback);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var API_URL = 'https://www.transifex.com/api/2';

/**
 * Asserts that all necessary credentials are provided.
 */
var assertCredentials = exports.assertCredentials = function assertCredentials(_ref) {
  var username = _ref.username,
      password = _ref.password;

  if (!username || !password) {
    console.log('You need to provide credentials in the form of username and password.\n\nYou can provide a password by either:\n\n      * passing a vendor.credentials.password option in the function call;\n      * providing a --password argument to the CLI; or\n      * setting a NARP_VENDOR_PASSWORD environment variable\n\nSee https://github.com/laget-se/narp#readme for more info.');
    process.exit(0);
  }
};

/**
 * Returns a request headers object
 */
var getHeaders = function getHeaders(_ref2) {
  var username = _ref2.username,
      password = _ref2.password;
  return {
    Authorization: 'Basic ' + new Buffer(username + ':' + password).toString('base64')
  };
};

/**
 * Fetches all languages for which there are translations to fetch.
 */
var fetchLanguages = function fetchLanguages(_ref3, _ref4) {
  var project = _ref3.project;
  var username = _ref4.username,
      password = _ref4.password;

  var url = API_URL + '/project/' + project + '/languages';
  var headers = getHeaders({ username: username, password: password });

  return (0, _got2.default)(url, { headers: headers }).then(function (_ref5) {
    var body = _ref5.body;

    var langs = JSON.parse(body).map(function (x) {
      return x.language_code;
    });
    return langs;
  });
};

/**
 * Fetches and returns translations for a given project, resource and language.
 */
var fetchTranslationsForLang = function fetchTranslationsForLang(_ref6, _ref7) {
  var project = _ref6.project,
      resource = _ref6.resource,
      language = _ref6.language;
  var username = _ref7.username,
      password = _ref7.password;

  var url = API_URL + '/project/' + project + '/resource/' + resource + '/translation/' + language;
  var headers = getHeaders({ username: username, password: password });

  return _got2.default.get(url, { headers: headers }).then(function (_ref8) {
    var body = _ref8.body;

    var potContents = JSON.parse(body).content;
    feedback.rant('Got translations for ' + language, potContents);
    return _gettextParser.po.parse(potContents);
  });
};

/**
 * Fetches all translations available and parses them into one big
 * object with locales as keys and gettext-parser PO JSON as values.
 */
var fetchTranslations = exports.fetchTranslations = function fetchTranslations(options) {
  var credentials = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var project = options.project,
      resource = options.resource,
      sourceLanguage = options.sourceLanguage;


  feedback.step('Fetching available languages from Transifex...');

  return fetchLanguages(options, credentials).then(function (languages) {
    feedback.step('Fetching translations for languages: ' + languages + ' ...');
    return languages;
  }).then(function (languages) {
    return languages.concat(sourceLanguage);
  }).then(function (languages) {
    return Promise.all(languages.map(function (language) {
      return fetchTranslationsForLang({ project: project, resource: resource, language: language }, credentials);
    }));
  }).then(function (translations) {
    return translations.reduce(function (aggr, poJson) {
      return _extends({}, aggr, _defineProperty({}, poJson.headers.language, poJson));
    }, {});
  }).catch(function (err) {
    return feedback.kill(err);
  });
};

/**
 * Fetches and returns the current source POT.
 */
var fetchSource = exports.fetchSource = function fetchSource(options) {
  var credentials = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var project = options.project,
      resource = options.resource;


  var url = API_URL + '/project/' + project + '/resource/' + resource + '/content?file';
  var headers = getHeaders(credentials);

  return _got2.default.get(url, { headers: headers }).then(function (_ref9) {
    var body = _ref9.body;
    return body;
  });
};

/**
 * Uploads a new POT to be the new source.
 */
var uploadTranslations = exports.uploadTranslations = function uploadTranslations(pot, options) {
  var credentials = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var project = options.project,
      resource = options.resource;


  var url = API_URL + '/project/' + project + '/resource/' + resource + '/content/';
  var requestOptions = {
    headers: _extends({}, getHeaders(credentials), {
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({ content: pot })
  };

  return _got2.default.put(url, requestOptions);
};