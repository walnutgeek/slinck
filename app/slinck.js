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

    function applyOnAll(obj, action) {
      for ( var k in obj) {
        if (obj.hasOwnProperty(k)) {
          action(obj[k], k, obj);
        }
      }
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

    function assert(provided, expected, message) {
      function checkAnyAgainstExpected() {
        for ( var i = 0; i < expected.length; i++) {
          if (provided === expected[i]) {
            return false;
          }
        }
        return true;
      }
      if (!isArray(expected) ? provided !== expected
          : checkAnyAgainstExpected()) {
        throw error({
          message : message || ("Unexpected entry: " + provided),
          expected : expected,
          provided : provided,
        });
      }
    }

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

    return {
      "isArray" : isArray,
      "append" : append,
      "size" : size,
      "join" : join,
      "error" : error,
      "applyOnAll" : applyOnAll,
      "assert" : assert,
      "Tokenator" : Tokenator,
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
        var t = $_.utils.Tokenator(s, "/");
        var d = t.nextDelimiter();
        $_.utils.assert("", d);
        var elems = [];
        var endDelimiter = extractPathElements(t, elems);
        $_.utils.assert(endDelimiter, null);
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
      var t = $_.utils.Tokenator(s, ":/?&=");
      var d = t.nextDelimiter();
      $_.utils.assert(d, [ "", "/" ]);
      var p = t.getPosition();
      var v = t.nextValue();
      d = t.nextDelimiter();
      iuc.host = iuc.path = null;
      iuc.bounds = {};
      if (v === "slinck" && d === "://") {
        iuc.host = t.nextValue();
        $_.utils.assert(t.nextDelimiter(), "/");
      } else {
        t.setPosition(p);
      }
      var sectionElements = [];
      d = extractPathElements(t, sectionElements);
      $_.utils.assert(d, [ "", "//", null ]);
      iuc.section = new Path(sectionElements);
      iuc.bounds = {};
      if (d === "//") {
        var pathElements = [];
        d = extractPathElements(t, pathElements);
        if (d === "?") {
          do {
            v = t.nextValue();
            $_.utils.assert(typeof Slinck.CONDITION[v], 'function',
                "Unknown condition:" + v);
            $_.utils.assert(t.nextDelimiter(), "=");
            var conditionPath = [];
            d = extractPathElements(t, conditionPath);
            iuc.bounds[v] = new Bound(v, conditionPath);
            $_.utils.assert(d, [ "", "&", null ]);
          } while (d === "&");
        }
        var bounds_size = $_.utils.size(iuc.bounds);
        if (pathElements.length > 1) {
          $_.utils.assert(bounds_size, 0,
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

    var DIRECTION = {
      up : function(node) {
        return node.upstreams;
      },
      down : function(node) {
        return node.downstreams;
      },
    };

    function Node(k, parent) {
      $_.utils.assert(this instanceof Node, true);
      this.k = k;
      this.upstreams = {};
      this.downstreams = {};
      this.graph = parent;
    }

    $_.utils.append(Node.prototype, {
      edges : function(direction) {
        return DIRECTION[direction](this);
      },
      isEnd : function(direction) {
        return $_.utils.size(this.edges(direction)) === 0;
      },
      remove : function() {
        var keyToDelete = this.k;
        $_.utils.applyOnAll(this.upstreams, function(node) {
          delete node.downstreams[keyToDelete];
        });
        $_.utils.applyOnAll(this.downstreams, function(node) {
          delete node.upstreams[keyToDelete];
        });
        delete this.parent.nodes[keyToDelete];
      },
      ends : function(direction) {
        var ends = {};
        for ( var k in this.nodes) {
          if (this.nodes[k].isEnd(direction)) {
            ends[k] = this.nodes[k];
          }
        }
        return ends;
      },
      search : function(key, direction) {
        var found = false;
        Graph.visit([this],direction,function(node){
          if(node.k == key){
            found = true;
          }
          return !found;
        });
        return found;
      },
    });

    function Graph() {
      $_.utils.assert(this instanceof Graph, true,
          "please use this function with new");
      this.nodes = {};
    }

    $_.utils.append(Graph.prototype, {
      get : function(k) {
        return this.nodes[k];
      },
      ensure : function(k) {
        var n = this.nodes[k];
        if (!n) {
          this.nodes[k] = n = new Node(k, this);
        }
        return n;
      },
      addEdge : function(downstream, upstream) {
        var un = this.ensure(upstream);
        var dn = this.ensure(downstream);
        un.downstreams[downstream] = dn;
        dn.upstreams[upstream] = un;
        return this;
      },
      ends : function(direction) {
        var ends = {};
        for ( var k in this.nodes) {
          if (this.nodes[k].isEnd(direction)) {
            ends[k] = this.nodes[k];
          }
        }
        return ends;
      },
      toString : function() {
        var s = '';
        var visited = {};
        var ends = this.ends("down");
        $_.Graph.visit(ends, "up", function(node, direction, context) {
          s += node.k;
          var notVisited = !visited[node.k];
          if (notVisited) {
            visited[node.k] = true;
            if ($_.utils.size(context.edges) > 0) {
              context.parentheses = true;
              s += "=(";
            }
          }
          return notVisited;
        }, function(node, edges, context) {
          if (context.parentheses) {
            s += ")";
          }
          if (!context.lastOne) {
            s += ',';
          }
        });
        return s;
      }
    });

    function visit(nodes, direction, before, after) {
      var i = 0;
      var size = $_.utils.size(nodes);
      for ( var k in nodes) {
        (function() {
          var node = nodes[k];
          var context = {
            k : k,
            i : i,
            size : size,
            edges : node.edges(direction),
            parentheses : false,
            firstOne : i === 0,
            lastOne : i === (size - 1),
          };
          if (before(node, direction, context)) {
            visit(context.edges, direction, before, after);
            if (after) {
              after(node, direction, context);
            }
          }
          i++;
        })();

      }
    }

    Graph.visit = visit;
    function parse(s) {
      var t = new $_.utils.Tokenator(s, "=(),");
      var g = new Graph();
      var k, path = [];
      try {
        while (k = t.nextValue()) {
          if (path.length > 0) {
            g.addEdge(path[path.length - 1], k);
          } else {
            g.ensure(k);
          }
          var d = t.nextDelimiter();
          if (d === "=(") {
            path.push(k);
          } else if (d === "" || d === ",") {
            // do nothing
          } else {
            for ( var i = 0; i < d.length; i++) {
              var c = d.charAt(i);
              if (c === ')') {
                if(path.length===0){
                  throw $_.utils.error({
                    message : "unbalanced parenthesis"
                  });
                }
                path.pop();
              }else if (c === ',' & d.length === (i + 1)) {
                // do nothing
              } else {
                throw $_.utils.error({
                  message : "Unexpected delimiter",
                  c : c,
                  i : i
                });
              }
            }
          }
        }
        if (path.length !== 0) {
          throw $_.utils.error({
            path : path,
            message : "unbalanced parenthesis"
          });
        }
        if (t.getPosition() !== s.length) {
          throw $_.utils.error({
            k : k,
            message : "have to parse all charectes"
          });
        }
        return g;
      } catch (e) {
        throw $_.utils.error({
          t : t.toString()
        }, e);
      }
    }
    Graph.parse = parse;

    return {
      "Slinck" : Slinck,
      "Path" : Path,
      "Graph" : Graph,
    };
  })());

})();