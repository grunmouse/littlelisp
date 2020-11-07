const assert = require('assert');

var t = require('./littlelisp');

var is = function(input, type) {
  return Object.prototype.toString.call(input) === '[object ' + type + ']';
};

// takes an AST and replaces type annotated nodes with raw values
var unannotate = function(input) {
  if (is(input, 'Array')) {
    if (input[0] === undefined) {
      return [];
    } else if (is(input[0], 'Array')) {
      return [unannotate(input[0])].concat(unannotate(input.slice(1)));
    } else {
      return unannotate(input[0]).concat(unannotate(input.slice(1)));
    }
  } else {
    return [input.value];
  }
};

describe('littleLisp', function() {
  describe('parse', function() {
    it('should lex a single atom', function() {
      assert.deepEqual(t.parse("a").value, "a");
    });

    it('should lex an atom in a list', function() {
      assert.deepEqual(unannotate(t.parse("()")), []);
    });

    it('should lex multi atom list', function() {
      assert.deepEqual(unannotate(t.parse("(hi you)")), ["hi", "you"]);
    });

    it('should lex list containing list', function() {
      assert.deepEqual(unannotate(t.parse("((x))")), [["x"]]);
    });

    it('should lex list containing list', function() {
      assert.deepEqual(unannotate(t.parse("(x (x))")), ["x", ["x"]]);
    });

    it('should lex list containing list', function() {
      assert.deepEqual(unannotate(t.parse("(x y)")), ["x", "y"]);
    });

    it('should lex list containing list', function() {
      assert.deepEqual(unannotate(t.parse("(x (y) z)")), ["x", ["y"], "z"]);
    });

    it('should lex list containing list', function() {
      assert.deepEqual(unannotate(t.parse("(x (y) (a b c))")), ["x", ["y"], ["a", "b", "c"]]);
    });

    describe('atoms', function() {
      it('should parse out numbers', function() {
        assert.deepEqual(unannotate(t.parse("(1 (a 2))")), [1, ["a", 2]]);
      });
    });
  });

  describe('interpret', function() {
    describe('lists', function() {
      it('should return empty list', function() {
        assert.deepEqual(t.interpret(t.parse('()')), []);
      });

      it('should return list of strings', function() {
        assert.deepEqual(t.interpret(t.parse('("hi" "mary" "rose")')), ['hi', "mary", "rose"]);
      });

      it('should return list of numbers', function() {
        assert.deepEqual(t.interpret(t.parse('(1 2 3)')), [1, 2, 3]);
      });

      it('should return list of numbers in strings as strings', function() {
        assert.deepEqual(t.interpret(t.parse('("1" "2" "3")')), ["1", "2", "3"]);
      });
    });

    describe('atoms', function() {
      it('should return string atom', function() {
        assert.deepEqual(t.interpret(t.parse('"a"')), "a");
      });

      it('should return string with space atom', function() {
        assert.deepEqual(t.interpret(t.parse('"a b"')), "a b");
      });

      it('should return string with opening paren', function() {
        assert.deepEqual(t.interpret(t.parse('"(a"')), "(a");
      });

      it('should return string with closing paren', function() {
        assert.deepEqual(t.interpret(t.parse('")a"')), ")a");
      });

      it('should return string with parens', function() {
        assert.deepEqual(t.interpret(t.parse('"(a)"')), "(a)");
      });

      it('should return number atom', function() {
        assert.deepEqual(t.interpret(t.parse('123')), 123);
      });
    });

    describe('invocation', function() {
      it('should run print on an int', function() {
        assert.deepEqual(t.interpret(t.parse("(print 1)")), 1);
      });

      it('should return first element of list', function() {
        assert.deepEqual(t.interpret(t.parse("(first (1 2 3))")), 1);
      });

      it('should return rest of list', function() {
        assert.deepEqual(t.interpret(t.parse("(rest (1 2 3))")), [2, 3]);
      });
    });

    describe('lambdas', function() {
      it('should return correct result when invoke lambda w no params', function() {
        assert.deepEqual(t.interpret(t.parse("((lambda () (rest (1 2))))")), [2]);
      });

      it('should return correct result for lambda that takes and returns arg', function() {
        assert.deepEqual(t.interpret(t.parse("((lambda (x) x) 1)")), 1);
      });

      it('should return correct result for lambda that returns list of vars', function() {
        assert.deepEqual(t.interpret(t.parse("((lambda (x y) (x y)) 1 2)")), [1, 2]);
      });

      it('should get correct result for lambda that returns list of lits + vars', function() {
        assert.deepEqual(t.interpret(t.parse("((lambda (x y) (0 x y)) 1 2)")), [0, 1, 2]);
      });

      it('should return correct result when invoke lambda w params', function() {
        assert.deepEqual(t.interpret(t.parse("((lambda (x) (first (x))) 1)")), 1);
      });
    });

    describe('let', function() {
      it('should eval inner expression w names bound', function() {
        assert.deepEqual(t.interpret(t.parse("(let ((x 1) (y 2)) (x y))")), [1, 2]);
      });

      it('should not expose parallel bindings to each other', function() {
        // Expecting undefined for y to be consistent with normal
        // identifier resolution in littleLisp.
        assert.deepEqual(t.interpret(t.parse("(let ((x 1) (y x)) (x y))")), [1, undefined]);
      });

      it('should accept empty binding list', function() {
        assert.deepEqual(t.interpret(t.parse("(let () 42)")), 42);
      });
    });

    describe('if', function() {
      it('should choose the right branch', function() {
        assert.deepEqual(t.interpret(t.parse("(if 1 42 4711)")), 42);
        assert.deepEqual(t.interpret(t.parse("(if 0 42 4711)")), 4711);
      });
    });
  });
});
