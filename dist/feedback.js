'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.kill = exports.finish = exports.rant = exports.step = exports.begin = exports.setVerbose = undefined;

var _colors = require('colors');

var _colors2 = _interopRequireDefault(_colors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isVerbose = false;

var setVerbose = exports.setVerbose = function setVerbose(verbose) {
  isVerbose = verbose;
};

var begin = exports.begin = function begin() {
  for (var _len = arguments.length, messages = Array(_len), _key = 0; _key < _len; _key++) {
    messages[_key] = arguments[_key];
  }

  console.log('\n- - - - - - - -');
  messages.forEach(function (msg) {
    return console.log('  ' + msg.underline);
  });
  console.log('- - - - - - - -\n');
};

var step = exports.step = function step() {
  for (var _len2 = arguments.length, messages = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    messages[_key2] = arguments[_key2];
  }

  messages.forEach(function (msg) {
    return console.log(msg.yellow);
  });
};

var rant = exports.rant = function rant() {
  for (var _len3 = arguments.length, messages = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    messages[_key3] = arguments[_key3];
  }

  if (isVerbose === true) {
    messages.forEach(function (msg) {
      return console.log(msg.gray);
    });
  }
};

var finish = exports.finish = function finish() {
  for (var _len4 = arguments.length, messages = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    messages[_key4] = arguments[_key4];
  }

  messages.forEach(function (msg) {
    return console.log(msg.bold.green);
  });
};

var kill = exports.kill = function kill() {
  for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
    args[_key5] = arguments[_key5];
  }

  console.log('\n\nKilling due to error:\n'.red);
  console.log.apply(console, args);
  process.exit(1);
};