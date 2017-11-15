'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getConfig = undefined;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _reactGettextParser = require('react-gettext-parser');

var _deepExtend = require('deep-extend');

var _deepExtend2 = _interopRequireDefault(_deepExtend);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultConfig = {
  vendor: {},
  extract: {
    componentPropsMap: _reactGettextParser.GETTEXT_COMPONENT_PROPS_MAP,
    funcArgumentsMap: _reactGettextParser.GETTEXT_FUNC_ARGS_MAP
  },
  merge: {},
  output: 'messages.json'
};

var getConfig = exports.getConfig = function getConfig() {
  var fileConfigContent = _fs2.default.readFileSync(_path2.default.join(process.cwd(), '.narprc'), 'utf-8');
  var configs = (0, _deepExtend2.default)(defaultConfig, JSON.parse(fileConfigContent));

  if (configs.vendor && configs.vendor.credentials) {
    if (configs.vendor.credentials.password === undefined) {
      configs.vendor.credentials.password = process.env.NARP_VENDOR_PASSWORD;
    }
    if (configs.vendor.credentials.token === undefined) {
      configs.vendor.credentials.token = process.env.NARP_VENDOR_TOKEN;
    }
  }

  return configs;
};