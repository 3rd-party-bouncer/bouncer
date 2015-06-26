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
var events = [ 'msg', 'error', 'debug', 'data' ];


/**
 * Constructor
 * @param {Object} options options
 *
 * @tested
 */
var Bouncer = function( options ) {
  options = options || {};

  if ( !options.url ) {
    throw new Error( ' -> No url to run against defined <- ' );
  }

  options.allowedDomains = options.allowedDomains || [];

  options.allowedDomains.unshift(
    options.url.replace( /^(http[s]{0,1}:\/\/){0,1}(www.){0,1}/, '' )
  );

  this.options = {
    runner : {
      allowedDomains : options.allowedDomains,
      url            : options.url
    },
    wpt : {
      key         : options.key || '',
      location    : options.location,
      pollResults : 10,
      requests    : true,
      runs        : +options.runs || 1,
      server      : options.server || 'www.webpagetest.org',
      video       : true
    }
  };

  this.runner = new Runner( this.options );


  // pipe all events to the outer world
  events.forEach( function( eventName ) {
    var bouncerName = 'bouncer:' + eventName;
    this.runner.on( bouncerName, function( msg ) {
      this.emit( bouncerName, msg );
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
