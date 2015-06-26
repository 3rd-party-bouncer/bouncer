/*
 * bouncer
 * https://github.com/3rd-party-bouncer/bouncer
 *
 * Licensed under the MIT license.
 */

'use strict';

var Bouncer      = require( './' );
var Runner       = require( './lib/runner' );
var proxyquire   = require( 'proxyquire' );
var util         = require( 'util' );
var EventEmitter = require( 'events' ).EventEmitter;

module.exports = {
  bouncer : {
    constructor : {
      setOptions : function( test ) {
        var options = {
          allowedDomains : [ 'foo', 'bar' ],
          key            : 'xxx',
          runs           : 42,
          server         : 'somewebpagetest.instance',
          url            : 'http://www.perf-tooling.today'
        };

        var bouncer = new Bouncer( options );

        test.equal( bouncer.options.runner.allowedDomains, options.allowedDomains );
        test.equal( bouncer.options.runner.allowedDomains.length, 3 );
        test.equal( bouncer.options.runner.allowedDomains[ 0 ], 'perf-tooling.today' );
        test.equal( bouncer.options.runner.allowedDomains[ 1 ], 'foo' );
        test.equal( bouncer.options.runner.allowedDomains[ 2 ], 'bar' );

        test.equal( bouncer.options.runner.url, options.url );

        test.equal( bouncer.options.wpt.key, options.key );
        test.equal( bouncer.options.wpt.runs, options.runs );
        test.equal( bouncer.options.wpt.server, options.server );

        test.equal( bouncer.runner instanceof Runner, true );

        test.equal( typeof bouncer.on, 'function' );
        test.equal( typeof bouncer.emit, 'function' );
        test.done();
      },
      emittedEvents : {
        msg : function( test ) {
          var bouncer = new Bouncer( {
            url            : 'foo',
            allowedDomains : [ 'bar', 'baz' ]
          } );

          bouncer.on( 'bouncer:msg', function( msg ) {
            test.equal( msg, 'A random message' );

            test.done();
          } );

          bouncer.runner.emit( 'bouncer:msg', 'A random message' );
        },

        error : function( test ) {
          var bouncer = new Bouncer( {
            url            : 'foo',
            allowedDomains : [ 'bar', 'baz' ]
          } );

          bouncer.on( 'bouncer:error', function( msg ) {
            test.equal( msg, 'A random error' );

            test.done();
          } );

          bouncer.runner.emit( 'bouncer:error', 'A random error' );
        },

        data : function( test ) {
          var bouncer = new Bouncer( {
            url            : 'foo',
            allowedDomains : [ 'bar', 'baz' ]
          } );

          bouncer.on( 'bouncer:data', function( msg ) {
            test.equal( msg, 'Received data' );

            test.done();
          } );

          bouncer.runner.emit( 'bouncer:data', 'Received data' );
        },

        debug : function( test ) {
          var bouncer = new Bouncer( {
            url            : 'foo',
            allowedDomains : [ 'bar', 'baz' ]
          } );

          bouncer.on( 'bouncer:debug', function( msg ) {
            test.equal( msg, 'A random debug message' );

            test.done();
          } );

          bouncer.runner.emit( 'bouncer:debug', 'A random debug message' );
        }
      },
      error : {
        noUrlError : function ( test ) {
          test.expect( 1 );

          test.throws( function() {
            new Bouncer( {} );
          }, Error );

          test.done();
        }
      }
    },


    run : {
      callback : {
        success : function( test ) {
          var RunnerStub = function() {
            this.run = function( callback ) {
              callback( null, 'whoooop' );
            }
          };

          util.inherits( RunnerStub, EventEmitter );

          var Bouncer = proxyquire(
            './',
            {
              './lib/runner' : RunnerStub
            }
          );

          var bouncer = new Bouncer( { url : 'fooo', allowedDomains : [ 'foo' ] } );

          bouncer.run( function( error, data ) {
            test.equal( error, null );
            test.equal( data, 'whoooop' );

            test.done();
          } );
        },
        error : function( test ) {
          var RunnerStub = function() {
            this.run = function( callback ) {
              callback( new Error( 'Error' ) );
            }
          };

          util.inherits( RunnerStub, EventEmitter );

          var Bouncer = proxyquire(
            './',
            {
              './lib/runner' : RunnerStub
            }
          );

          var bouncer = new Bouncer( { url : 'fooo', allowedDomains : [ 'foo' ] } );

          bouncer.run( function( error, data ) {
            test.equal( error instanceof Error, true );
            test.equal( error.message, 'Error' );

            test.done();
          } );
        }
      }
    }
  }
};
