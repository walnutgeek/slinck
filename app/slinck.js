(function() {
  var $_ = new Object();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = $_;
  }
  this.$_ = $_;

  $_.utils = (function() {
    function isArray(o) {
      return Object.prototype.toString.call(o) === '[object Array]';
    }

    function append(object, params) {
      for ( var propertyName in params) {
        if (params.hasOwnProperty(propertyName)) {
          object[propertyName] = params[propertyName];
        }
      }
      return object;
    }

    function size(obj) {
      var size = 0;
      for ( var key in obj) {
        if (obj.hasOwnProperty(key))
          size++;
      }
      return size;
    }

    function join(array, delimiter, toString) {
      var s = '';
      if (!toString) {
        toString = function(s) {
          return s;
        };
      }
      if (!delimiter) {
        delimiter = ',';
      }
      var delimit = (typeof delimiter === 'function') ? delimiter : function(
          array, i, j) {
        return (i < 0 || j <= 0) ? '' : delimiter;
      };
      var i = -1;
      var j = array.length;
      while (i < array.length) {
        if (i >= 0) {
          s += toString(array[i]);
        }
        s += delimit(array, i, j);
        i++;
        j--;
      }
      return s;
    }

    function error(params, input) {
      var e;
      if (input instanceof Error) {
        e = input;
      } else {
        e = new Error();
        if (input) {
          e.params = {
            cause : input
          };
        }
      }
      if (!e._message) {
        if (e.message) {
          e._message = e.message;
        } else if (params || params.message) {
          e._message = params.message;
          delete params['message'];
        }
      }
      var msg = e._message;
      if (!e.params) {
        e.params = {};
      }
      if (params) {
        append(e.params, params);
      }
      if (size(e.params)) {
        msg += "  ";
        for ( var k in e.params) {
          if (e.params.hasOwnProperty(k)) {
            msg += k + ":" + e.params[k] + ", ";
          }
        }
        msg = msg.substring(0, msg.length - 2);
      }
      e.message = msg;
      return e;
    }

    return {
      "isArray" : isArray,
      "append" : append,
      "size" : size,
      "join" : join,
      "error" : error,
    };
  })();

  $_.tokenator = (function() {

    function Tokenator(s, delimiters) {
      var i = 0;

      function isValueChar() {
        return delimiters.indexOf(s.charAt(i)) < 0;
      }

      function next(condition) {
        var start = i;
        while (i < s.length && condition())
          i++;
        var next = s.substring(start, i);
        return next;
      }

      return {
        getText : function() {
          return s;
        },
        nextValue : function() {
          return next(isValueChar);
        },
        nextDelimiter : function() {
          return next(function() {
            return !isValueChar();
          });
        },
        toString : function() {
          return s.substring(0, i) + " <-i-> " + s.substring(i);
        },
        getPosition : function() {
          return i;
        },
        setPosition : function(_i) {
          i = _i;
        }
      };
    }

    function assert(provided, expected, message) {
      function checkAnyAgainstExpected() {
        for ( var i = 0; i < expected.length; i++) {
          if (provided === expected[i]) {
            return false;
          }
        }
        return true;
      }
      if (!$_.utils.isArray(expected) ? provided !== expected
          : checkAnyAgainstExpected()) {
        throw $_.utils.error({
          message : message || ("Unexpected entry: " + provided),
          expected : expected,
          provided : provided,
        });
      }
    }

    return {
      "Tokenator" : Tokenator,
      "assert" : assert,
    };
  })();

  $_.percent_encoding = (function() {
    var escape_chars = "%+/?&=:";

    function toEscape(d) {
      var hex = Number(d).toString(16).toUpperCase();
      return '%' + (hex.length < 2 ? "0" + hex : hex);
    }

    function toDecimal(hex) {
      return parseInt(hex, 16);
    }

    function encode(text) {
      var data = "";
      for ( var n = 0; n < text.length; n++) {
        var c = text.charCodeAt(n);
        var ch = text.charAt(n);
        if (c < 32 || escape_chars.indexOf(ch) >= 0) {
          data += toEscape(c);
        } else if (c == 32) {
          data += "+";
        } else if (c < 128) {
          data += String.fromCharCode(c);
        } else if ((c > 127) && (c < 2048)) {
          data += toEscape((c >> 6) | 192);
          data += toEscape((c & 63) | 128);
        } else {
          data += toEscape((c >> 12) | 224);
          data += toEscape(((c >> 6) & 63) | 128);
          data += toEscape((c & 63) | 128);
        }
      }
      return data;
    }

    function decode(data) {
      var text = "";
      var i = 0;
      var b0, b1, b2;
      var c;

      function next(count) {
        if (!count)
          count = 1;
        var s = data.substr(i, count);
        i += count;
        return s;
      }

      function expectEscapeSequence() {
        c = next();
        if (c === '%') {
          return toDecimal(next(2));
        } else {
          throw {
            msg : "expected escape sequence"
          };
        }
      }

      while (i < data.length) {
        b0 = b1 = b2 = 0;
        c = next(1);
        if (c === '+') {
          text += ' ';
        } else if (c === '%') {
          b0 = toDecimal(next(2));
          if (b0 < 128) {
            text += String.fromCharCode(b0);
          } else if ((b0 > 191) && (b0 < 224)) {
            b1 = expectEscapeSequence();
            text += String.fromCharCode(((b0 & 31) << 6) | (b1 & 63));
          } else {
            next();
            b1 = expectEscapeSequence();
            b2 = expectEscapeSequence();
            text += String.fromCharCode(((b0 & 15) << 12) | ((b1 & 63) << 6)
                | (b2 & 63));
          }
        } else {
          text += c;
        }
      }
      return text;
    }

    return {
      "encode" : encode,
      "decode" : decode,
    };
  })();

  /**
   * Slinck amalgamation of words: slick link Can represens section: c
   * 
   * Can represent file: slinck://host/branch/sec/ti/on//fi/le/pa/th
   * 
   * Can represent fragment of ordered table
   * slinck://host/branch/sec/ti/ondb//index/a/b/c
   * 
   * or you can write same query as 'eq' condition to:
   * slinck://host/branch/sec/ti/ondb//index?eq=a/b/c
   * 
   * Can represent fragment as range between two keys:
   * slinck://host/branch/sec/ti/ondb//index?gte=a1/b1/c1&lt=a2/b2/c3
   * 
   * percent_encoding.js to escape symbols
   * http://en.wikipedia.org/wiki/Percent-encoding
   */
  $_.utils.append($_, (function() {

    var WUN = 653826927654; // weird unique number

    function extractPathElements(t, elems) {
      for (;;) {
        var v = t.nextValue();
        if (!v)
          return null;
        elems.push($_.percent_encoding.decode(v));
        var d = t.nextDelimiter();
        if (!d)
          return null;
        if (d && d !== "/") {
          return d;
        }
      }
    }

    function Path(path) {
      if (path === WUN)
        return this;
      var iuc = this instanceof Path ? this : new Path(WUN);
      iuc.elements = $_.utils.isArray(path) ? path : (function(s) {
        var t = $_.tokenator.Tokenator(s, "/");
        var d = t.nextDelimiter();
        $_.tokenator.assert("", d);
        var elems = [];
        var endDelimiter = extractPathElements(t, elems);
        $_.tokenator.assert(endDelimiter, null);
        return elems;
      })(path);
      return iuc;
    }

    Path.prototype.toString = function() {
      return $_.utils.join(this.elements, "/", $_.percent_encoding.encode);
    };

    function Bound(condition, path) {
      if (condition === WUN)
        return this;
      var iuc = this instanceof Bound ? this : new Bound(WUN);
      iuc.condition = condition;
      iuc.path = (path instanceof Path) ? path : new Path(path);
      return iuc;
    }
    ;

    Bound.prototype.toString = function() {
      return this.condition + '=' + this.path.toString();
    };

    Path.Bound = Bound;
    Path.extractPathElements = extractPathElements;

    function Slinck(s) {
      if (s === WUN)
        return this;
      var iuc = this instanceof Slinck ? this : new Slinck(WUN);
      var t = $_.tokenator.Tokenator(s, ":/?&=");
      var d = t.nextDelimiter();
      $_.tokenator.assert(d, [ "", "/" ]);
      var p = t.getPosition();
      var v = t.nextValue();
      d = t.nextDelimiter();
      iuc.host = iuc.path = null;
      iuc.bounds = {};
      if (v === "slinck" && d === "://") {
        iuc.host = t.nextValue();
        $_.tokenator.assert(t.nextDelimiter(), "/");
      } else {
        t.setPosition(p);
      }
      var sectionElements = [];
      d = extractPathElements(t, sectionElements);
      $_.tokenator.assert(d, [ "", "//", null ]);
      iuc.section = new Path(sectionElements);
      iuc.bounds = {};
      if (d === "//") {
        var pathElements = [];
        d = extractPathElements(t, pathElements);
        if (d === "?") {
          do {
            v = t.nextValue();
            $_.tokenator.assert(typeof Slinck.CONDITION[v], 'function',
                "Unknown condition:" + v);
            $_.tokenator.assert(t.nextDelimiter(), "=");
            var conditionPath = [];
            d = extractPathElements(t, conditionPath);
            iuc.bounds[v] = new Bound(v, conditionPath);
            $_.tokenator.assert(d, [ "", "&", null ]);
          } while (d === "&");
        }
        var bounds_size = $_.utils.size(iuc.bounds);
        if (pathElements.length > 1) {
          $_.tokenator.assert(bounds_size, 0,
              "path has implied bounds that conflicts with explicit bounds");
          iuc.pathBound = new Bound("eq", pathElements.slice(1));
        }
        iuc.path = new Path(pathElements);
      }
      return iuc;
    }

    Slinck.prototype.boundKeys = function() {
      var keys = [];
      if (this.pathBound) {
        keys.push("eq");
      } else {
        for ( var key in this.bounds) {
          if (this.bounds.hasOwnProperty(key)) {
            keys.push(key);
          }
        }
      }
      return keys;
    };

    Slinck.CONDITION = {
      eq : function(r) {
        return r === 0;
      },
      ne : function(r) {
        return r !== 0;
      },
      lte : function(r) {
        return r <= 0;
      },
      gte : function(r) {
        return r >= 0;
      },
      lt : function(r) {
        return r < 0;
      },
      gt : function(r) {
        return r > 0;
      },
    };

    Slinck.prototype.bound = function(k) {
      if (this.pathBound && k === "eq") {
        return this.pathBound;
      }
      return this.bounds[k];
    };

    return {
      "Slinck" : Slinck,
      "Path" : Path,
    };
  })());

})();