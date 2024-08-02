"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.Mdict = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _lemmatizer = require("lemmatizer");
var _mdictbase = _interopRequireDefault(require("./mdictbase"));
var _utils = _interopRequireDefault(require("./utils"));
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2["default"])(o), (0, _possibleConstructorReturn2["default"])(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2["default"])(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); } /// <reference path="../typings/mdict.d.ts" />
var Mdict = exports.Mdict = /*#__PURE__*/function (_MdictBase) {
  function Mdict(fname, options) {
    var _options$passcode, _options$debug, _options$resort, _options$isStripKey, _options$isCaseSensit;
    var _this;
    (0, _classCallCheck2["default"])(this, Mdict);
    options = options || {};
    options = {
      passcode: (_options$passcode = options.passcode) !== null && _options$passcode !== void 0 ? _options$passcode : '',
      debug: (_options$debug = options.debug) !== null && _options$debug !== void 0 ? _options$debug : false,
      resort: (_options$resort = options.resort) !== null && _options$resort !== void 0 ? _options$resort : true,
      isStripKey: (_options$isStripKey = options.isStripKey) !== null && _options$isStripKey !== void 0 ? _options$isStripKey : true,
      isCaseSensitive: (_options$isCaseSensit = options.isCaseSensitive) !== null && _options$isCaseSensit !== void 0 ? _options$isCaseSensit : true
    };
    var passcode = options.passcode || undefined;
    _this = _callSuper(this, Mdict, [fname, passcode, options]);
    _this.options = options;
    return _this;
  }

  /**
   * lookup 查询 mdx 词
   * @param {string} word the target word
   * @returns definition
   */
  (0, _inherits2["default"])(Mdict, _MdictBase);
  return (0, _createClass2["default"])(Mdict, [{
    key: "lookup",
    value: function lookup(word) {
      if (this.options.resort) {
        var result = this._lookup_key_record(word);
        if (this.header.StyleSheet) {
          return _objectSpread(_objectSpread({}, result), {}, {
            definition: this._substitute_stylesheet(result.definition)
          });
        }
        return result;
      } else {
        throw new Error('depreciated, use `option.resort = true` to find out word');
      }
    }

    /**
     * locate 查询 mdd 资源数据
     * @param {string} resourceKey resource key
     * @returns resource binary data
     */
  }, {
    key: "locate",
    value: function locate(resourceKey) {
      return this._lookup_key_record(resourceKey);
    }
  }, {
    key: "fetch_defination",
    value: function fetch_defination(keyRecord) {
      var rid = this._reduce_record_block(keyRecord.recordStartOffset);
      var data = this._decode_record_block_by_rb_id(rid, keyRecord.keyText, keyRecord.recordStartOffset, keyRecord.nextRecordStartOffset);
      return data;
    }

    /**
     * @deprecated
     * parse the definition by word and ofset
     * @param {string} word the target word
     * @param {number} rstartofset the record start offset (fuzzy_start rofset)
     */
  }, {
    key: "parse_defination",
    value: function parse_defination(word, rstartofset) {
      var keyRecord = this.lookup(word);
      if (!keyRecord) {
        return {
          word: word,
          definition: null
        };
      }
      return this.fetch_defination(keyRecord);
    }

    /**
     * get word prefix words
     * @param {string} phrase the word which needs to find prefix
     */
  }, {
    key: "prefix",
    value: function prefix(phrase) {
      var list = this._locate_prefix_list(phrase);
      if (!list) {
        return [];
      }
      return list.map(function (item) {
        return _objectSpread(_objectSpread({}, item), {}, {
          key: item.keyText,
          rofset: item.recordStartOffset
        });
      });
      // const trie = dart.builder().build(
      //   list.map((keyword) => ({
      //     k: keyword.keyText,
      //     v: keyword.recordStartOffset,
      //   }))
      // );
      // return trie
      //   .commonPrefixSearch(phrase)
      //   .map((item) => ({ key: item.k, rofset: item.v }));
    }

    /**
     * get words associated
     * @param {string} phrase the word which needs to be associated
     */
  }, {
    key: "associate",
    value: function associate(phrase) {
      var matched = this._locate_prefix_list(phrase, 100);
      // to meet the typings
      matched.map(function (item) {
        item.rofset = item.recordStartOffset;
      });
      return matched;
    }

    /**
     * fuzzy_search
     * find latest `fuzzy_size` words, and filter by lavenshtein_distance
     * `fuzzy_size` means find the word's `fuzzy_size` number nabors
     * and filter with `ed_gap`
     *
     * for example, fuzzy_size('hello', 3, 1)
     * first find hello's nabor:
     * hell   --> edit distance: 1
     * hallo  --> edit distance: 1
     * hall   --> edit distance: 2
     * the result is:
     * [hell, hallo]
     *
     * return wordlist struct:
     * [
     * {
     * ed: Number  // word edit distance
     * idx: Number // word dict idx
     * key: string // word key string
     * }
     * ]
     */
  }, {
    key: "fuzzy_search",
    value: function fuzzy_search(word, fuzzy_size, ed_gap) {
      var fuzzy_words = [];
      var count = 0;
      var fn = this._strip_key_or_ingore_case();
      for (var i = 0; i < this.keyList.length; i++) {
        var item = this.keyList[i];
        var key = fn(item.keyText);
        var ed = _utils["default"].levenshteinDistance(key, fn(word));
        if (ed <= ed_gap) {
          count++;
          if (count > fuzzy_size) {
            break;
          }
          fuzzy_words.push(_objectSpread(_objectSpread({}, item), {}, {
            key: item.keyText,
            idx: item.recordStartOffset,
            ed: ed
          }));
        }
      }
      return fuzzy_words;
    }

    /**
     * return word's lemmatizer
     * @param {string} phrase word phrase
     */
  }, {
    key: "lemmer",
    value: function lemmer(phrase) {
      return (0, _lemmatizer.lemmatizer)(phrase);
    }
  }, {
    key: "suggest",
    value: function suggest(phrase) {
      throw new Error('suggest method has been deprecated');
    }
  }, {
    key: "_substitute_stylesheet",
    value: function _substitute_stylesheet(txt) {
      var txtTag = Array.from(txt.matchAll(/`(\d+)`/g));
      var txtList = Array.from(txt.split(/`\d+`/g)).slice(1);
      var styledTxt = '';
      for (var i = 0; i < txtList.length; i++) {
        var style = this.header.StyleSheet[txtTag[i][1]];
        styledTxt += style[0] + txtList[i] + style[1];
      }
      return styledTxt;
    }
  }, {
    key: "_search_key_record",
    value: function _search_key_record(word) {
      var _strip = this._strip_key_or_ingore_case();
      word = _strip(word);
      for (var i = 0; i < this.keyList.length; i++) {
        var keyText = _strip(this.keyList[i].keyText);
        if (word == keyText) {
          return this.keyList[i];
        }
      }
      return undefined;
    }
  }, {
    key: "_lookup_key_record",
    value: function _lookup_key_record(word) {
      var keyRecord = this._search_key_record(word);
      // if not found the key block, return undefined
      if (keyRecord === undefined) {
        return {
          keyText: word,
          definition: null
        };
      }
      var i = keyRecord.original_idx;
      var rid = this._reduce_record_block(keyRecord.recordStartOffset);
      var nextStart = i + 1 >= this.keyList.length ? this._recordBlockStartOffset + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompAccumulator + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompSize : this.keyList[this.keyListRemap[i + 1]].recordStartOffset;
      var data = this._decode_record_block_by_rb_id(rid, keyRecord.keyText, keyRecord.recordStartOffset, nextStart);
      return data;
    }
  }, {
    key: "_locate_prefix",
    value: function _locate_prefix(word) {
      var _strip = this._strip_key_or_ingore_case();
      var end = this.keyList.length;
      word = _strip(word);
      for (var i = 0; i < end; i++) {
        var keyText = _strip(this.keyList[i].keyText);
        if (keyText.startsWith(word)) {
          return i;
        }
      }
      return -1;
    }
  }, {
    key: "_locate_prefix_list",
    value: function _locate_prefix_list(phrase) {
      var max_len = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;
      var max_missed = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 100;
      var record = this._locate_prefix(phrase);
      if (record == -1) {
        return [];
      }
      var fn = this._strip_key_or_ingore_case();
      var list = [];
      var count = 0;
      var missed = 0;
      for (var i = record; i < this.keyList.length; i++) {
        if (this.keyList[i].keyText.startsWith(fn(phrase))) {
          list.push(this.keyList[i]);
          count++;
        } else {
          missed++;
        }
        if (count > max_len) {
          break;
        }
        if (missed > max_missed) {
          break;
        }
      }
      return list;
    }
  }]);
}(_mdictbase["default"]);
var _default = exports["default"] = Mdict;