(function() {
  
  var WUN = 653826927654; // weird unique number
  
  var $_ = new Object();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = $_;
  }
  this.$_ = $_;

  // convert list to object, assumes that all element of list has property name

  $_.utils = (function() {
    function isArray(o) {
      return Object.prototype.toString.call(o) === '[object Array]';
    }

    function convertListToObject(list, nameProperty) {
      if (!nameProperty) {
        nameProperty = "name";
      }
      var obj = new Object();
      for ( var i = 0; i < list.length; i++) {
        obj[list[i][nameProperty]] = list[i];
      }
      return obj;
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

    function isString(a) {
      return typeof a === "string" || a instanceof String;
    }

    function stringify(x) {
      return x === undefined ? "undefined" : x === null ? "null"
          : isString(x) ? "'" + x + "'" : isArray(x) ? "["
              + join(x, ",", stringify) + "]" : x.toString();
    }

    function ensureDate(a) {
      return a instanceof Date ? a : new Date(a);
    }

    function ensureString(a) {
      return isString(a) ? a : String(a);
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
            msg += k + ":" + stringify(e.params[k]) + ", ";
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

    function padWith(what, pad) {
      var r = String(what);
      if (r.length !== pad.length) {
        r = (pad + r).substr(r.length, pad.length);
      }
      return r;
    }

    function dateToIsoString(date) {
      return date.getUTCFullYear() + '-'
          + padWith(date.getUTCMonth() + 1, '00') + '-'
          + padWith(date.getUTCDate(), '00') + 'T'
          + padWith(date.getUTCHours(), '00') + ':'
          + padWith(date.getUTCMinutes(), '00') + ':'
          + padWith(date.getUTCSeconds(), '00') + '.'
          + padWith(date.getUTCMilliseconds(), '0000') + 'Z';
    }

    if (!Date.prototype.toISOString) {
      Date.prototype.toISOString = function() {
        return dateToIsoString(this);
      };
    }

    function Tokenizer(s, delimiters) {
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
    return convertListToObject([ convertListToObject, isArray, append, size,
        join, error, applyOnAll, assert, Tokenizer, isString, stringify,
        padWith, dateToIsoString, ensureDate, ensureString ]);
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

    return $_.utils.convertListToObject([ encode, decode ]);
  })();

  /**
   * Slinck amalgamation of words: slick link
   * 
   * Can represens section: slinck://host/branch/sec/ti/on
   * 
   * Can represent file: slinck://host/branch/sec/ti/on//fi/le/pa/th
   * 
   * Can represent fragment of ordered table
   * slinck://host/branch/sec/ti/on/db//a/b/c
   * 
   * or you can write same query as 'eq' condition to:
   * slinck://host/branch/sec/ti/ondb//?eq=a/b/c
   * 
   * Can represent fragment as range between two keys:
   * slinck://host/branch/sec/ti/ondb//?gte=a1/b1/c1&lt=a2/b2/c3
   * 
   * uses $_.percent_encoding to escape symbols
   * http://en.wikipedia.org/wiki/Percent-encoding
   */
  $_.utils.append($_, (function() {

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
        var t = $_.utils.Tokenizer(s, "/");
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
      var t = $_.utils.Tokenizer(s, ":/?&=");
      var d = t.nextDelimiter();
      try {
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
        $_.utils.assert(d, [ "", "//", "?", null ]);
        iuc.section = new Path(sectionElements);
        iuc.bounds = {};
        if (d === "//") {
          var pathElements = [];
          d = extractPathElements(t, pathElements);
          if (pathElements.length > 0) {
            iuc.pathBound = new Bound("eq", pathElements);
          }
          iuc.path = new Path(pathElements);
        } else if (d === "?") {
          do {
            v = t.nextValue();
            if (v === null || v === "") {
              d = t.nextDelimiter();
              break;
            }
            $_.utils.assert(typeof Slinck.CONDITION[v], 'function',
                "Unknown condition:" + v);
            $_.utils.assert(t.nextDelimiter(), "=");
            var conditionPath = [];
            d = extractPathElements(t, conditionPath);
            iuc.bounds[v] = new Bound(v, conditionPath);
            $_.utils.assert(d, [ "", "&", null ]);
          } while (d === "&");
        }
        $_.utils.assert(d, [ "", null ]);
      } catch (e) {
        throw $_.utils.error({
          tokenator : t.toString()
        }, e);
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
      up : function(vertex) {
        return vertex.upstreams;
      },
      down : function(vertex) {
        return vertex.downstreams;
      },
    };

    function visit(vertices, direction, before, after) {
      var i = 0;
      var size = $_.utils.size(vertices);
      for ( var k in vertices) {
        (function() {
          var vertex = vertices[k];
          var context = {
            k : k,
            i : i,
            size : size,
            edges : vertex.edges(direction),
            parentheses : false,
            firstOne : i === 0,
            lastOne : i === (size - 1),
          };
          if (before(vertex, direction, context)) {
            visit(context.edges, direction, before, after);
            if (after) {
              after(vertex, direction, context);
            }
          }
          i++;
        })();

      }
    }

    function Vertex(k, parent) {
      $_.utils.assert(this instanceof Vertex, true);
      this.k = k;
      this.upstreams = {};
      this.downstreams = {};
      this.graph = parent;
    }

    $_.utils.append(Vertex.prototype, {
      edges : function(direction) {
        return DIRECTION[direction](this);
      },
      isEnd : function(direction) {
        return $_.utils.size(this.edges(direction)) === 0;
      },
      remove : function() {
        var keyToDelete = this.k;
        $_.utils.applyOnAll(this.upstreams, function(vertex) {
          delete vertex.downstreams[keyToDelete];
        });
        $_.utils.applyOnAll(this.downstreams, function(vertex) {
          delete vertex.upstreams[keyToDelete];
        });
        delete this.parent.vertices[keyToDelete];
      },
      ends : function(direction) {
        var ends = {};
        for ( var k in this.vertices) {
          if (this.vertices[k].isEnd(direction)) {
            ends[k] = this.vertices[k];
          }
        }
        return ends;
      },
      setOfOne : function() {
        var r = {};
        r[this.k] = this;
        return r;
      },
      search : function(key, direction) {
        var found = false;
        visit(this.setOfOne(), direction, function(vertex) {
          if (vertex.k == key) {
            found = true;
          }
          return !found;
        });
        return found;
      },
    });

    /** Type */

    function Type(name, sortFunction) {
      this.name = name;
      this.compare = Type.nullsCompare(sortFunction);
      Type[name] = this;
      $_.utils.assert(Type[name],this,"Type is frozen for changes. Cannot add:"+name);
    }

    Type.nullsCompare = function(f) {
      function isUndef(x) {
        return x === undefined;
      }
      function isNull(x) {
        return x === null;
      }
      function exculdeIs(is, doIt) {
        return function(a, b) {
          return is(a) ? (is(b) ? 0 : 1) : (is(b) ? -1 : doIt(a, b));
        };
      }
      return exculdeIs(isUndef, exculdeIs(isNull, f));
    };

    Type.inverse = function(f) {
      return function(a, b) {
        return f(b, a);
      };
    };

    new Type("string", function(a, b) {
      var aStr = $_.utils.ensureString(a);
      var bStr = $_.utils.ensureString(b);
      return aStr === bStr ? 0 : aStr < bStr ? -1 : 1;
    });

    new Type("number", function(a, b) {
      return a - b;
    });

    new Type("boolean", function(a, b) {
      return a ? (b ? 0 : 1) : (b ? -1 : 0);
    });

    new Type("date", function(a, b) {
      var aDateValueOf = $_.utils.ensureDate(a).valueOf();
      var bDateValueOf = $_.utils.ensureDate(b).valueOf();
      return aDateValueOf === bDateValueOf ? 0
          : aDateValueOf < bDateValueOf ? -1 : 1;
    });

    new Type("blob", Type.string.compare);
    Object.freeze(Type);

    
    function ColumnRole(name) {
      this.name = name;
      ColumnRole[name] = this;
    }

    new ColumnRole("key");
    new ColumnRole("data");
    new ColumnRole("attachment");
    
    Object.freeze(ColumnRole);

    /** /Type */

    /**
     * Graph - directed acyclic graph,
     * 
     * upstream and downstream indicates direction from upstream to downstream
     * (think flow)
     * 
     * 
     */
    function Graph() {
      $_.utils.assert(this instanceof Graph, true,
          "please use this function with new");
      this.vertices = {};
    }

    $_.utils.append(Graph.prototype, {
      get : function(k) {
        return this.vertices[k];
      },
      ensure : function(k) {
        var n = this.vertices[k];
        if (!n) {
          this.vertices[k] = n = new Vertex(k, this);
        }
        return n;
      },
      addEdge : function(downstream, upstream) {
        var un = upstream instanceof Vertex ? upstream : this.ensure(upstream);
        var dn = downstream instanceof Vertex ? downstream : this
            .ensure(downstream);
        if (un.search(downstream, "up") || dn.search(upstream, "down")) {
          throw $_.utils.error({
            message : "circular reference",
            downstream : downstream,
            upstream : upstream,
          });
        }
        un.downstreams[downstream] = dn;
        dn.upstreams[upstream] = un;
        return this;
      },
      ends : function(direction) {
        var r = {};
        for ( var k in this.vertices) {
          if (this.vertices[k].isEnd(direction)) {
            r[k] = this.vertices[k];
          }
        }
        return r;
      },
      visitBreadthFirst : function(vertexKeys, direction, onVisit, compare) {
        if (!compare)
          compare = Type.string.compare;
        var queue = $_.utils.isArray(vertexKeys) ? vertexKeys.slice(0) : Object
            .keys(vertexKeys);
        queue.sort(compare);
        while (queue.length > 0) {
          var k = queue.shift();
          var vertex = this.vertices[k];
          var context = {
            k : k,
            edges : vertex.edges(direction),
          };
          if (onVisit(vertex, direction, context)) {
            var childrenKeys = Object.keys(context.edges);
            if (childrenKeys.length > 0) {
              queue = queue.concat(childrenKeys.sort(compare));
            }
          }
        }
      },
      sort : function() {
        var visited = {};
        var sorted = [];
        this.visitBreadthFirst(this.ends("up"), "down", function(vertex) {
          var alreadySeen = visited[vertex.k];
          var store = !alreadySeen;
          if (store) {
            for ( var dkey in vertex.upstreams) {
              if (!visited[dkey]) {
                store = false;
              }
            }
            if (store) {
              sorted.push(vertex.k);
              visited[vertex.k] = 1;
            }
          }
          return !alreadySeen;
        });
        return sorted;
      },
      visitDepthFirst : function(vertixKeys, direction, before, after) {
        var verticesToSearch = {};
        if ($_.utils.isArray(vertixKeys)) {
          for ( var i = 0; i < vertixKeys.length; i++) {
            verticesToSearch[vertixKeys[i]] = this.vertices[vertixKeys[i]];
          }
        } else {
          verticesToSearch = vertixKeys;
        }
        visit(verticesToSearch, direction, before, after);
      },
      toString : function() {
        var s = '';
        var visited = {};
        var ends = this.ends("down");
        visit(ends, "up", function(vertex, direction, context) {
          s += vertex.k;
          var notVisited = !visited[vertex.k];
          if (notVisited) {
            visited[vertex.k] = true;
            if ($_.utils.size(context.edges) > 0) {
              context.parentheses = true;
              s += "=(";
            }
          }
          return notVisited;
        }, function(vertex, edges, context) {
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

    Graph.parse = function(s) {
      var t = new $_.utils.Tokenizer(s, "=(),");
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
                if (path.length === 0) {
                  throw $_.utils.error({
                    message : "unbalanced parenthesis"
                  });
                }
                path.pop();
              } else if (c === ',' && d.length === (i + 1)) {
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
    };

    /** /Graph */

    /** Table */

    function Column(name, title, type, key) {
      $_.utils.assert(this instanceof Column, true,
          "please use new, when calling this function");
      this.name = name;
      this.title = title;
      this.type = type;
      this.key = key;
    }

    function Table(sl, columns, data, version) {
      $_.utils.assert(this instanceof Table, true,
          "please use new, when calling this function");
      this.sl = sl;
      this.columns = columns ? columns : [];
      this.data = data ? data : [];
      this.version = version ? version : null;
    }

    $_.utils.append(Table.prototype, {
      newRow : function(values) {
        var row = {};
        for ( var colIdx = 0; colIdx < columns.length; colIdx++) {
          var n = this.columns[colIdx].name;
          row[n] = values ? values[n] : null;
        }
        return row;
      },
      addRow : function(row) {
        this.data.push(row);
      },
      addColumn : function(name, title, type, key) {
        this.columns.push(new Column(name, title, type, key));
      }
    });

    Column.Type = Type;
    Column.Role = ColumnRole;
    Table.Column = Column;

    /** /Table */

    return $_.utils.convertListToObject([ Slinck, Path, Graph, Table, Column,
        Type, ColumnRole ]);
  })());

})();