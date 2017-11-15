'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extract = exports.push = exports.pull = undefined;

var _reactGettextParser = require('react-gettext-parser');

var _potMerge = require('pot-merge');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _deepExtend = require('deep-extend');

var _deepExtend2 = _interopRequireDefault(_deepExtend);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _confighelpers = require('./confighelpers');

var _constants = require('./constants.js');

var _feedback = require('./feedback.js');

var feedback = _interopRequireWildcard(_feedback);

var _transifex = require('./vendors/transifex.js');

var transifex = _interopRequireWildcard(_transifex);

var _poeditor = require('./vendors/poeditor.js');

var poeditor = _interopRequireWildcard(_poeditor);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var assertVendor = function assertVendor(vendorName) {
  if ([_constants.Vendors.TRANSIFEX, _constants.Vendors.POEDITOR].indexOf(vendorName) === -1) {
    console.log('A vendor with name ' + vendorName + ' is not supported. ' + ('You can currently choose between "' + _constants.Vendors.TRANSIFEX + '" and "' + _constants.Vendors.POEDITOR + '".'));
    process.exit(0);
  }
};

var getVendor = function getVendor(vendorName) {
  if (vendorName === _constants.Vendors.TRANSIFEX) {
    return transifex;
  } else if (vendorName === _constants.Vendors.POEDITOR) {
    return poeditor;
  }

  return null;
};

/**
 * Fetches all translations available through the configurated
 * vendor and writes the whole parsed shebang to the configurated
 * output path.
 */
var pull = function pull() {
  var configs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var conf = (0, _deepExtend2.default)((0, _confighelpers.getConfig)(), configs);

  feedback.setVerbose(conf.verbose);
  feedback.begin('pull');

  var _conf$vendor = conf.vendor,
      name = _conf$vendor.name,
      credentials = _conf$vendor.credentials,
      options = _conf$vendor.options;


  assertVendor(name);

  var vendor = getVendor(name);
  vendor.assertCredentials(credentials);

  // Fetch translations
  return vendor.fetchTranslations(options, credentials).then(function (translations) {
    feedback.step('Writing all translations to', _path2.default.resolve(conf.output));

    // Make sure the output directory exists
    _mkdirp2.default.sync(_path2.default.dirname(conf.output));

    // Write the JSON translations file
    _fs2.default.writeFileSync(conf.output, JSON.stringify(translations, null, 2));

    feedback.finish('Translations pulled.');
  });
};

/**
 * Extracts translatable strings from the source code, merges them
 * with the upstream source and uploads the result to the configurated
 * vendor.
 */
var push = function push() {
  var configs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var conf = (0, _deepExtend2.default)((0, _confighelpers.getConfig)(), configs);

  feedback.setVerbose(conf.verbose);
  feedback.begin('push');

  var _conf$vendor2 = conf.vendor,
      name = _conf$vendor2.name,
      credentials = _conf$vendor2.credentials,
      options = _conf$vendor2.options;


  assertVendor(name);

  var vendor = getVendor(name);
  vendor.assertCredentials(credentials);

  feedback.step('Extracting messages from source code...');
  var messages = (0, _reactGettextParser.extractMessagesFromGlob)(conf.extract.source);
  var pot = (0, _reactGettextParser.toPot)(messages);
  feedback.rant('Extracted pot:', pot);

  feedback.step('Fetching upstream POT source...');

  return vendor.fetchSource(options, credentials).then(function (sourcePot) {
    feedback.rant('...got POT source:', sourcePot);
    feedback.step('Merging upstream and extracted POT files...');
    return sourcePot.trim().length > 0 ? (0, _potMerge.mergePotContents)(sourcePot, pot) : pot;
  }).then(function (mergedPot) {
    feedback.rant('...merged POT into:', mergedPot);
    feedback.step('Uploading new POT...');
    return vendor.uploadTranslations(mergedPot, options, credentials);
  }).then(function () {
    return feedback.finish('Source file updated and uploaded.');
  }).catch(function (err) {
    return feedback.kill(err);
  });
};

/**
 * Extracts translatable strings from the source code and outputs
 * them to the console.
 */
var extract = function extract() {
  var configs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var inputSource = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  var conf = (0, _deepExtend2.default)((0, _confighelpers.getConfig)(), configs);

  feedback.setVerbose(true);
  feedback.begin('extraction');

  // extract strings from source => extract
  var source = inputSource.length > 0 ? [inputSource + '/**/{*.js,*.jsx}'] : conf.extract.source;

  feedback.step('Extracting messages from source code...');
  var messages = (0, _reactGettextParser.extractMessagesFromGlob)(source);

  messages.forEach(function (msg) {
    var reference = msg.comments.reference;

    var refs = reference.map(function (r) {
      return inputSource.length ? r.replace(inputSource, '') : r;
    });
    feedback.rant(refs.join(', ') + ' -> ' + msg.msgid);
  });

  feedback.finish('Extracted all messages for you.');
};

exports.pull = pull;
exports.push = push;
exports.extract = extract;