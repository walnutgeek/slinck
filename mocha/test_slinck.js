var assert = require("assert");
var $_ = require("../app/slinck");

describe('pecent_encoding', function() {
  describe('#decode', function() {
    function scenario1(p, encoded) {
      var encodeToTest = $_.percent_encoding.encode(p);
      assert.equal(encodeToTest, encoded);
      var decodedEncode = $_.percent_encoding.decode(encodeToTest);
      assert.equal(decodedEncode, p);
    }
    ;
    it('basic', function() {
      scenario1("Abc/dlkdd?dldl=zz z", "Abc%2Fdlkdd%3Fdldl%3Dzz+z");
      scenario1("Abc/dlk\ndd\t?d\rldl=zz+z%",
          "Abc%2Fdlk%0Add%09%3Fd%0Dldl%3Dzz%2Bz%25");
    });
    it('utf-8', function() {
      scenario1("У попа", "%D0%A3+%D0%BF%D0%BE%D0%BF%D0%B0");
      scenario1("\u0423 \u043F\u043E\u043F\u0430",
          "%D0%A3+%D0%BF%D0%BE%D0%BF%D0%B0");
    });
  });
});

describe('slinck', function() {
  describe('#Path', function() {
    it(' - simple case', function() {
      var p = $_.Path("a/b/c");
      var p2 = new $_.Path("a/b/c");

      assert.ok(p instanceof $_.Path);
      assert.ok(p2 instanceof $_.Path);

      assert.equal(p.toString(), p2.toString());
      assert.equal(p.toString(), "a/b/c");
    });
    it(' - check unexpected entry logic', function() {
      try {
        new $_.Path("a/b/c//");
        assert.fail("it not supposed get here and choke on '//'");
      } catch (e) {
        assert.equal(e.params.expected, null);
        assert.equal(e.params.provided, "//");
      }
    });
    it(' - check wierd character and array constructor', function() {
      var p3 = new $_.Path([ "a", "b/", "c" ]);
      var p4 = $_.Path("a/b%2F/c/");
      assert.ok(p3 instanceof $_.Path);
      assert.ok(p4 instanceof $_.Path);
      assert.equal(p4.toString(), p3.toString());
      assert.equal(p4.toString(), "a/b%2F/c");
    });
  });

  function doSlinck(tests, sl) {
    for ( var i = 0; i < tests.length; i++) {
      tests[i](sl);
    }
  }

  function hostCheck(snk) {
    assert.equal("host", snk.host);
  }
  function noHostCheck(snk) {
    assert.equal(null, snk.host);
  }
  function sectionCheck(snk) {
    assert.equal("branch/sec/ti/on", snk.section.toString());
  }
  function sectionDbCheck(snk) {
    assert.equal("branch/sec/ti/ondb", snk.section.toString());
  }
  function pathCheck(snk) {
    assert.equal("index/a/b/c", snk.path.toString());
  }
  function indexCheck(snk) {
    assert.equal("index", snk.path.toString());
  }

  function boundXCheck(snk, x, v) {
    assert.equal(x + "=" + v, snk.bound(x).toString());
  }
  function boundEqCheck(snk) {
    boundXCheck(snk, "eq", "a/b/c");
  }
  function boundGteCheck(snk) {
    boundXCheck(snk, "gte", "a1/b1/c1");
  }
  function boundLtCheck(snk) {
    boundXCheck(snk, "lt", "a2/b2/c3");
  }

  var testCases = {
    "slinck://host/branch/sec/ti/on//" : {
      description : "section",
      tests : [ hostCheck, sectionCheck ]
    },
    "slinck://host/branch/sec/ti/ondb//index/a/b/c" : {
      description : "fragment of ordered table",
      tests : [ hostCheck, sectionDbCheck, pathCheck, boundEqCheck ]
    },
    "slinck://host/branch/sec/ti/ondb//index?eq=a/b/c" : {
      description : "fragment of ordered table using 'eq' bound",
      tests : [ hostCheck, sectionDbCheck, indexCheck, boundEqCheck ]
    },
    "slinck://host/branch/sec/ti/ondb//index?gte=a1/b1/c1&lt=a2/b2/c3" : {
      description : "fragment as range between two keys",
      tests : [ hostCheck, sectionDbCheck, indexCheck, boundGteCheck,
          boundLtCheck ]
    },
    "branch/sec/ti/on//" : {
      description : "hostless section",
      tests : [ noHostCheck, sectionCheck ]
    },
    "branch/sec/ti/ondb//index/a/b/c" : {
      description : "hostless fragment of ordered table",
      tests : [ noHostCheck, sectionDbCheck, pathCheck, boundEqCheck ]
    },
    "branch/sec/ti/ondb//index?eq=a/b/c" : {
      description : "hostless fragment of ordered table using 'eq' bound",
      tests : [ noHostCheck, sectionDbCheck, indexCheck, boundEqCheck ]
    },
    "branch/sec/ti/ondb//index?gte=a1/b1/c1&lt=a2/b2/c3" : {
      description : "hostless fragment as range between two keys",
      tests : [ noHostCheck, sectionDbCheck, indexCheck, boundGteCheck,
          boundLtCheck ]
    },
    "/branch/sec/ti/on//" : {
      description : "hostless section",
      tests : [ noHostCheck, sectionCheck ]
    },
    "/branch/sec/ti/ondb//index/a/b/c" : {
      description : "hostless fragment of ordered table",
      tests : [ noHostCheck, sectionDbCheck, pathCheck, boundEqCheck ]
    },
    "/branch/sec/ti/ondb//index?eq=a/b/c" : {
      description : "hostless fragment of ordered table using 'eq' bound",
      tests : [ noHostCheck, sectionDbCheck, indexCheck, boundEqCheck ]
    },
    "/branch/sec/ti/ondb//index?gte=a1/b1/c1&lt=a2/b2/c3" : {
      description : "hostless fragment as range between two keys",
      tests : [ noHostCheck, sectionDbCheck, indexCheck, boundGteCheck,
          boundLtCheck ]
    },
  };

  describe('#Slinck', function() {
    for ( var sl in testCases) {
      (function() {
        var tests = testCases[sl].tests;
        var slnk = new $_.Slinck(sl);
        it(' - ' + testCases[sl].description + ': ' + sl, function() {
          doSlinck(tests, slnk);
        });
      })();
    }
  });
  describe('#Graph', function() {
    it('check if it will throw exception without new', function() {
      try {
        $_.Graph();
        assert.ok(false);
      } catch (e) {}
    });
    it('assemble graph one edge at the time', function() {
      var g = new $_.Graph()
      .addEdge("x","q")
      .addEdge("a","b")
      .addEdge("b","c")
      .addEdge("x","b")
      .addEdge("x","q")
      .addEdge("c","q") ;
      assert.equal(g.toString(),"x=(q,b=(c=(q))),a=(b)");
    });
    it('parse Graph', function() {
      var g = $_.Graph.parse("x=(q,b=(c=(q))),a=(b)");
      assert.equal(g.toString(),"x=(q,b=(c=(q))),a=(b)");
    });
    it('parse exception: extra parenthesis at the end', function() {
      try{
        $_.Graph.parse("x=(q,b=(c=(q))),a=(b))");
        assert.ok(false);
      }catch (e) {
        assert.equal(e.message, "unbalanced parenthesis  t:x=(q,b=(c=(q))),a=(b)) <-i-> ");
      }
    });
    it('parse exception: missing parenthesis at the end', function() {
      try{
        $_.Graph.parse("x=(q,b=(c=(q))),a=(b");
        assert.ok(false);
      }catch (e) {
        assert.equal(e.message, "unbalanced parenthesis  path:a, t:x=(q,b=(c=(q))),a=(b <-i-> ");
      }
    });
  });
});

describe('utils', function() {

  describe('#assert', function() {
    it('check assert success and failure', function() {
      $_.utils.assert("aa", "aa");
      $_.utils.assert("aa", [ "qq", "aa" ]);
      try {
        $_.utils.assert("aa", "bb");
      } catch (x) {
        assert.equal(x.message,
            "Unexpected entry: aa  expected:bb, provided:aa");
        assert.equal(x.params.expected, "bb");
        assert.equal(x.params.provided, "aa");
      }
      var arr = [ "cc", "bb" ];
      try {
        $_.utils.assert("aa", arr);
      } catch (x) {
        assert.equal(x.message,
            "Unexpected entry: aa  expected:cc,bb, provided:aa");
        assert.equal(x.params.expected, arr);
        assert.equal(x.params.provided, "aa");
      }
      try {
        $_.utils.assert("aa", "bb", "haha");
      } catch (x) {
        assert.equal(x.message, "haha  expected:bb, provided:aa");
        assert.equal(x.params.expected, "bb");
        assert.equal(x.params.provided, "aa");
      }
    });
  });
  describe('#applyOnAll', function() {
    it('make sure that it apply on all object own properties', function() {
      $_.utils.applyOnAll({
        a : "b",
        b : "c"
      }, function(v, k, obj) {
        assert.ok(obj instanceof Object);
        if (k === "a") {
          assert.equal(v, "b");
        } else if (k === "b") {
          assert.equal(v, "c");
        } else {
          assert.ok(false, "What the hell is:" + k);
        }
      });
    });
  });
  describe('#Tokenator', function() {
    it('check Tokenator functionality', function() {
      var tt = $_.utils.Tokenator("a/b/c//dd/x/v/l", "/?&=");
      assert.equal(tt.nextDelimiter(), "");
      assert.equal(tt.nextValue(), "a");
      assert.equal(tt.nextDelimiter(), "/");
      assert.equal(tt.nextValue(), "b");
      assert.equal(tt.nextDelimiter(), "/");
      assert.equal(tt.nextValue(), "c");
      assert.equal(tt.nextDelimiter(), "//");
      assert.equal(tt.nextValue(), "dd");
      assert.equal(tt.nextDelimiter(), "/");
      assert.equal(tt.nextValue(), "x");
      assert.equal(tt.nextDelimiter(), "/");
      assert.equal(tt.nextDelimiter(), "");
      assert.equal(tt.nextValue(), "v");
      assert.equal(tt.nextDelimiter(), "/");
      assert.equal(tt.nextValue(), "l");
      assert.equal(tt.nextValue(), "");
      assert.equal(tt.nextDelimiter(), "");
    });
  });
  describe('#isArray()', function() {
    it('', function() {
      assert.ok($_.utils.isArray([ 1, 2, 3 ]));
      assert.ok(!$_.utils.isArray(1));
      assert.ok(!$_.utils.isArray(function() {
      }));
    });
  });
  describe('#append()', function() {
    it('', function() {
      var x = {
        a : "a",
        b : "b"
      };
      $_.utils.append(x, {
        b : "b2",
        c : "c"
      });
      assert.equal(x.a, "a");
      assert.equal(x.b, "b2");
      assert.equal(x.c, "c");
    });
  });
  describe('#size()', function() {
    it('', function() {
      assert.equal($_.utils.size({}), 0);
      assert.equal($_.utils.size({
        a : "a",
        b : "b"
      }), 2);
      assert.equal($_.utils.size({
        a : "a"
      }), 1);
    });
  });
  describe('#join()', function() {
    it('', function() {
      assert.equal($_.utils.join([ 1, 2, 3 ]), "1,2,3");
      assert.equal($_.utils.join([ 1, 2, 3 ], function(array, i, j) {
        return i === -1 ? "[" : j === 0 ? "]" : ",";
      }), "[1,2,3]");
    });
  });
  describe('#stack()', function() {
    it('', function() {
    });
  });
  describe('#error()', function() {
    it('', function() {
      var e = $_.utils.error({
        message : "msg",
        a : "a",
        b : "not b"
      });
      assert.ok(e instanceof Error);
      assert.equal(e.message, "msg  a:a, b:not b");
      $_.utils.error({
        b : "b",
        c : "c"
      }, e);
      assert.ok(e instanceof Error);
      assert.equal(e.message, "msg  a:a, b:b, c:c");
      assert.equal(e.stack.split(/\n/)[0], "Error: msg  a:a, b:b, c:c");
    });
  });
});
