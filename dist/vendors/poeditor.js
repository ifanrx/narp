'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uploadTranslations = exports.fetchSource = exports.fetchTranslations = exports.assertCredentials = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _gettextParser = require('gettext-parser');

var _got = require('got');

var _got2 = _interopRequireDefault(_got);

var _qs = require('qs');

var _qs2 = _interopRequireDefault(_qs);

var _formData = require('form-data');

var _formData2 = _interopRequireDefault(_formData);

var _stringToStream = require('string-to-stream');

var _stringToStream2 = _interopRequireDefault(_stringToStream);

var _feedback = require('../feedback.js');

var feedback = _interopRequireWildcard(_feedback);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var API_URL = 'https://api.poeditor.com/v2';

/**
 * Asserts that all necessary credentials are provided.
 */
var assertCredentials = exports.assertCredentials = function assertCredentials(_ref) {
  var token = _ref.token;

  if (!token) {
    console.log('You need to provide a POEditor API token by either:\n\n      * passing a vendor.credentials.token option in the function call;\n      * providing a --token argument to the CLI; or\n      * setting a NARP_VENDOR_TOKEN environment variable\n\nSee https://github.com/laget-se/narp#readme for more info.');
    process.exit(0);
  }
};

/**
 * Fetches all languages for which there are translations to fetch.
 */
var fetchLanguages = function fetchLanguages(_ref2, _ref3) {
  var project = _ref2.project;
  var token = _ref3.token;

  var options = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: _qs2.default.stringify({
      api_token: token,
      id: project
    })
  };

  return (0, _got2.default)(API_URL + '/languages/list', options).then(function (_ref4) {
    var body = _ref4.body;

    var _JSON$parse = JSON.parse(body),
        response = _JSON$parse.response,
        result = _JSON$parse.result;

    return response.status === 'success' ? result.languages.map(function (x) {
      return x.code;
    }) : [];
  });
};

/**
 * Fetches and returns a URL to a PO resource for a given
 * project and language.
 */
var fetchPoUrl = function fetchPoUrl(_ref5, _ref6) {
  var project = _ref5.project,
      language = _ref5.language;
  var token = _ref6.token;
  return _got2.default.post(API_URL + '/projects/export', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: _qs2.default.stringify({
      api_token: token,
      id: project,
      language: language,
      type: 'po'
    })
  }).then(function (res) {
    var _JSON$parse2 = JSON.parse(res.body),
        response = _JSON$parse2.response,
        result = _JSON$parse2.result;

    return response.status === 'success' ? result.url : null;
  });
};

/**
 * Fetches and returns translations for a given project and language.
 */
var fetchTranslationsForLang = function fetchTranslationsForLang(_ref7, _ref8) {
  var project = _ref7.project,
      language = _ref7.language;
  var token = _ref8.token;
  return fetchPoUrl({ project: project, language: language }, { token: token }).then(function (poUrl) {
    return poUrl ? _got2.default.get(poUrl).then(function (results) {
      return results.body;
    }) : '';
  }).then(function (potContents) {
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
  var project = options.project;


  feedback.step('Fetching available languages from POEditor...');

  return fetchLanguages({ project: project }, credentials).then(function (languages) {
    feedback.step('Fetching translations for languages: ' + languages + ' ...');
    return languages;
  }).then(function (languages) {
    return Promise.all(languages.map(function (language) {
      return fetchTranslationsForLang({ project: project, language: language }, credentials);
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
      sourceLanguage = options.sourceLanguage;


  return fetchPoUrl({ project: project, language: sourceLanguage }, credentials).then(function (poUrl) {
    return poUrl ? _got2.default.get(poUrl).then(function (res) {
      return res.body;
    }) : '';
  });
};

/**
 * Uploads a new POT to be the new source.
 */
var uploadTranslations = exports.uploadTranslations = function uploadTranslations(pot, options) {
  var credentials = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var project = options.project,
      sourceLanguage = options.sourceLanguage;


  var potStream = (0, _stringToStream2.default)(pot);

  // Prevent the POEditor API from complaining about file extension
  potStream.path = project + '.pot';

  var form = new _formData2.default();
  form.append('api_token', credentials.token);
  form.append('id', project);
  form.append('updating', 'terms_translations');
  form.append('language', sourceLanguage);
  form.append('file', potStream);
  form.append('sync_terms', '1');

  var url = API_URL + '/projects/upload';
  var requestOptions = {
    headers: form.getHeaders(),
    body: form
  };

  return _got2.default.post(url, requestOptions);
};