/*
 * bouncer
 * https://github.com/3rd-party-bouncer/bouncer
 *
 * Licensed under the MIT license.
 */

'use strict';

var EventEmitter = require( 'events' ).EventEmitter;
var Queue        = require( './utils/queue' );
var proxyquire   = require( 'proxyquire' );

var Runner       = require( './runner' );


/**
 * Set up object to use in setup
 */
var runner;
var defaults;

module.exports = {
  runner : {
    setUp : function( callback ) {
      defaults = {
        runner : {
          url            : 'url.torun.against',
          allowedDomains : [ 'allowed.domain' ]
        },
        wpt : {
          server : ''
        }
      };
      runner = new Runner( defaults );

      callback();
    },


    constructor : function( test ) {
      test.equal( runner instanceof EventEmitter, true );
      test.equal( runner.options, defaults );
      test.equal( typeof runner.data, 'object' );
      test.equal( runner.queue instanceof Queue, true );
      test.equal( runner.queue.getLength(), 0 );
      test.equal( typeof runner.on, 'function' );
      test.equal( typeof runner.emit, 'function' );
      test.done();
    },


    run : {
      error : function( test ) {
        runner._get3rdParties = function( callback ) {
          callback( new Error( 'Test error' ) );
        };

        runner.run( function( error ) {
          test.equal( error instanceof Error, true );
          test.equal( error.message, 'Test error' );
          test.done();
        } );
      },

      success : function( test ) {
        test.expect( 7 );

        runner._get3rdParties = function( callback ) {
          callback( null, [ 'some.domain', 'another.domain' ] );
        };

        runner._runAll = function() {
          test.equal( runner.thirdPartyDomains.length, 2 );
          test.equal( runner.thirdPartyDomains[ 0 ], 'some.domain' );
          test.equal( runner.thirdPartyDomains[ 1 ], 'another.domain' );

          // push it to let all events be triggered
          // and catched by callbacks
          process.nextTick( function() {
            test.done();
          } );
        };

        runner.on( 'bouncer:msg', function() {
          test.ok( true, 'Msg event emitted' );
        } );

        runner.on( 'bouncer:debug', function() {
          test.ok( true, 'Debug event emitted' );
        } );

        test.equal( runner.run() instanceof Runner, true );
      }
    },


    _get3rdParties : {
      error : function( test ) {
        var TestRunner = proxyquire(
          './runner',
          {
            'webpagetest' : function() {
              this.runTest = function( url, options, callback ) {
                test.equal( url, 'url.torun.against' );

                callback( new Error( 'test error' ) );
              };
            }
          }
        );

        var proxyRunner = new TestRunner( defaults );

        proxyRunner._get3rdParties( function( error ) {
          test.equal( error instanceof Error, true );
          test.done();
        } );
      },

      success : function( test ) {
        test.expect( 13 );

        var TestRunner = proxyquire(
          './runner',
          {
            'webpagetest' : function() {
              this.runTest = function( url, options, callback ) {
                test.equal( url, 'url.torun.against' );

                callback( null, {
                  response : {
                    data : {
                      median : {
                        firstView : {
                          requests : [
                            {},
                            {
                              request : [
                                {
                                  host : 'thirdParty1.com'
                                },
                                {
                                  host : 'thirdParty2.com'
                                },
                                {
                                  host : 'thirdParty3.com'
                                },
                                {
                                  host : 'thirdParty1.com'
                                },
                                {
                                  host : 'allowed.domain'
                                }
                              ]
                            }
                          ]
                        }
                      }
                    }
                  }
                } );
              };
            }
          }
        );

        var proxyRunner = new TestRunner( defaults );

        proxyRunner.on( 'bouncer:debug', function() {
          test.ok( true, 'Debug event emitted' );
        } );

        proxyRunner.on( 'bouncer:data', function( data ) {
          test.ok( true, 'Data event emitted' );
          test.equal( typeof data, 'object' );
          test.equal( data.allowedUrls, '*' );
          test.equal( data.blockedUrls, 'none' );
          test.equal( typeof data.response, 'object' );
        } );

        proxyRunner._get3rdParties( function( error, data ) {
          test.equal( error, null );
          test.equal( data.length, 3 );
          test.equal( data[ 0 ], 'thirdParty1.com' );
          test.equal( data[ 1 ], 'thirdParty2.com' );
          test.equal( data[ 2 ], 'thirdParty3.com' );

          test.equal( proxyRunner.data.length, 1 );

          // push it to let all events be triggered
          // and catched by callbacks
          process.nextTick( function() {
            test.done();
          } );
        } );
      }
    },


    _getBlockedDomainsString : function( test ) {
      var thirdParties = [
        'some.domain',
        'someother.domain',
        'someotherother.domain'
      ];

      var blockedDomainString = runner._getBlockedDomainsString(
        'someother.domain',
        thirdParties
      );

      test.equal( blockedDomainString, 'some.domain someotherother.domain' );
      test.done();
    },


    _run : {
      error : function( test ) {
        test.expect( 5 );

        var TestRunner = proxyquire(
          './runner',
          {
            'webpagetest' : function() {
              this.runTest = function( url, options, callback ) {
                test.equal( url, 'url.torun.against' );

                callback( new Error( 'test error' ) );
              };
            }
          }
        );

        var proxyRunner = new TestRunner( defaults );

        proxyRunner.on( 'bouncer:msg', function() {
          test.ok( true, 'Msg event emitted' );
        } );

        proxyRunner.on( 'bouncer:debug', function() {
          test.ok( true, 'Debug event emitted' );
        } );

        proxyRunner.on( 'bouncer:error', function( error ) {
          test.equal( error instanceof Error, true );
          test.equal( error.message, 'test error' );
        } );

        proxyRunner._run( {}, function() {
          process.nextTick( function() {
            test.done();
          } );
        } );
      },

      success : {
        withAllowedUrl : function( test ) {
          test.expect( 9 );

          var dummyData = {
            response : {
              data : {
                summary : 'some.summary.url'
              }
            }
          };

          var TestRunner = proxyquire(
            './runner',
            {
              'webpagetest' : function() {
                this.runTest = function( url, options, callback ) {
                  test.equal( url, 'url.torun.against' );

                  callback( null, dummyData );
                };
              }
            }
          );

          var proxyRunner = new TestRunner( defaults );

          proxyRunner.on( 'bouncer:msg', function() {
            test.ok( true, 'Msg event emitted' );
          } );

          proxyRunner.on( 'bouncer:debug', function() {
            test.ok( true, 'Debug event emitted' );
          } );

          proxyRunner.on( 'bouncer:data', function( data ) {
            test.ok( true, 'Debug event emitted' );
            test.equal( data, dummyData );
          } );

          proxyRunner._run(
            {
              allowedThirdPartyDomain : 'some.fancy.domain'
            },
            function() {
              test.equal( proxyRunner.data.length, 1 );

              test.equal( proxyRunner.data[ 0 ].allowedUrl, 'some.fancy.domain' );
              test.equal( proxyRunner.data[ 0 ].blockedUrl, '' );

              process.nextTick( function() {
                test.done();
              } );
            }
          );
        },

        withoutAllowedUrl : function( test ) {
          test.expect( 9 );

          var dummyData = {
            response : {
              data : {
                summary : 'some.summary.url'
              }
            }
          };

          var TestRunner = proxyquire(
            './runner',
            {
              'webpagetest' : function() {
                this.runTest = function( url, options, callback ) {
                  test.equal( url, 'url.torun.against' );

                  callback( null, dummyData );
                };
              }
            }
          );

          var proxyRunner = new TestRunner( defaults );

          proxyRunner.on( 'bouncer:msg', function() {
            test.ok( true, 'Msg event emitted' );
          } );

          proxyRunner.on( 'bouncer:debug', function() {
            test.ok( true, 'Debug event emitted' );
          } );

          proxyRunner.on( 'bouncer:data', function( data ) {
            test.ok( true, 'Debug event emitted' );
            test.equal( data, dummyData );
          } );

          proxyRunner._run(
            {},
            function() {
              test.equal( proxyRunner.data.length, 1 );

              test.equal( proxyRunner.data[ 0 ].allowedUrl, 'none' );
              test.equal( proxyRunner.data[ 0 ].blockedUrl, '' );

              process.nextTick( function() {
                test.done();
              } );
            }
          );
        }
      }
    },


    _runAll : function( test ) {
      test.expect( 4 );

      runner.thirdPartyDomains = [ 'firstThirdPary', 'secondThirdParty' ];

      runner._run = function( options, callback ) {
        test.ok( true, '_run called' );
        callback();
      };

      runner.on( 'bouncer:msg', function() {
        test.ok( true, 'Msg event emitted' );
      } );

      runner._runAll( function() {
        test.done();
      } );
    }
  }
};
