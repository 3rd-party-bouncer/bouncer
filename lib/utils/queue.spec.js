/*
 * bouncer
 * https://github.com/3rd-party-bouncer/bouncer
 *
 * Licensed under the MIT license.
 */

var Queue = require( './queue' );
var q;

module.exports = {
  setUp: function ( callback ) {
    q = new Queue();

    callback();
  },
  queue : {
    constructor : function ( test ) {
      test.equal( q.stack instanceof Array, true );
      test.equal( q.stack.length, 0 );
      test.done();
    },
    push : {
      executeFirstFunction : function( test ) {
        var testFn = function() {
          q.pop();

          test.equal( q.getLength(), 0 );
          test.done()
        };

        q.push( testFn );
      },

      dontExecuteIfStackIsNotEmpty : function( test ) {
        testFn = function() {};

        q.stack.push( function() {} );

        q.push( testFn );

        test.equal( q.getLength(), 2 );
        test.done();
      },

      throwErrorWhenNoFunctionArgument : function( test ) {
        test.throws( function() {
          q.push( 1 );
        } )

        test.done();
      },

      isChainable : function( test ) {
        var tmp = q.push( function() {} );

        test.equal( tmp instanceof Queue, true );
        test.done();
      }
    },


    pop : {
      executeNextFunction : function( test ) {
        var fn1 = function() {};
        var fn2 = function() {
          test.equal( q.getLength(), 1 );
          test.done();
        };

        q.stack = [ fn1, fn2 ];

        q.pop();
      },

      isChainable : function( test ) {
        var fn1 = function() {};
        var fn2 = function() {};

        q.stack = [ fn1, fn2 ];

        var tmp = q.pop();

        test.equal( tmp instanceof Queue, true );
        test.done();
      }
    },


    isEmpty : {
      returnCorrectState : function( test ) {
        q.stack = [ , ];

        test.equal( q.isEmpty(), false );

        q.stack = [];

        test.equal( q.isEmpty(), true );
        test.done();
      }
    },


    getTop : {
      returnCorrectFn : function( test ) {
        var fn = function() {};

        q.stack = [ fn ];

        test.equal( q.getTop(), fn );
        test.done();
      }
    },


    getLength : {
      returnCorrectLength : function( test ) {
        q.stack = [ 1, 2 ];

        test.equal( q.getLength(), 2 );
        test.done();
      }
    }
  }
};
