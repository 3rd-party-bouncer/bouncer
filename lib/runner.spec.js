/*
 * bouncer
 * https://github.com/3rd-party-bouncer/bouncer
 *
 * Licensed under the MIT license.
 */

'use strict';

var Runner       = require( './runner' );
var EventEmitter = require( 'events' ).EventEmitter;
var Queue        = require( './utils/queue' );

module.exports = {
  runner : {
    constructor : function( test ) {
      var options = {
        wpt : {
          server : ''
        }
      };
      var runner = new Runner( options );

      test.equal( runner instanceof EventEmitter, true );
      test.equal( runner.options, options );
      test.equal( typeof runner.data, 'object' );
      test.equal( runner.queue instanceof Queue, true );
      test.equal( runner.queue.getLength(), 0 );
      test.done();
    }
  }
};
