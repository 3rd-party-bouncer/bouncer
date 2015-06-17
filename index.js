/*
 * bouncer
 * https://github.com/3rd-party-bouncer/bouncer
 *
 * Licensed under the MIT license.
 */

'use strict';

var Runner       = require( './lib/runner' );
var EventEmitter = require( 'events' ).EventEmitter;
var util         = require( 'util' );


/**
 * Events to be emitted to the outside
 * @type {Array}
 */
var events = [ 'msg', 'error', 'debug' ];


/**
 * Constructor
 * @param {Object} options options
 *
 * @tested
 */
var Bouncer = function( options ) {
  this.options = {
    runner : {
      allowedDomains : options.allowedDomains,
      url            : options.url
    },
    wpt : {
      key         : options.key || '',
      pollResults : 10,
      requests    : true,
      runs        : options.runs || 1,
      server      : options.server || 'www.webpagetest.org',
      timeout     : 480,
      video       : true
    }
  };

  this.runner = new Runner( this.options );


  // pipe all events to the outer world
  events.forEach( function( eventName ) {
    this.runner.on( eventName, function( msg ) {
      this.emit( eventName, msg );
    }.bind( this ) );
  }, this );
};

util.inherits( Bouncer, EventEmitter );


/**
 * Kick of the bouncer
 *
 * @param  {Function} callback callback
 *
 * @tested
 */
Bouncer.prototype.run = function( callback ) {
  if ( !this.options.runner.url ) {
    return callback( new Error( ' -> No url to run against defined <- ' ) );
  }

  if (
    !this.options.runner.allowedDomains ||
    !this.options.runner.allowedDomains.length
  ) {
    return callback( new Error( ' -> No allowed domains set <- ' ) );
  }

  this.emit( 'msg', 'Starting to bounce' );
  this.emit( 'msg', 'Set WPT server -> ' + this.options.wpt.server );
  this.emit( 'msg', 'Set URL -> ' + this.options.runner.url );

  this.runner.run( function( err, data ) {
    if ( err ) {
      return callback( err );
    }

    callback( null, data );
  } );
};

module.exports = Bouncer;
