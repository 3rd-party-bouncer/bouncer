/*
 * bouncer
 * https://github.com/3rd-party-bouncer/bouncer
 *
 * Licensed under the MIT license.
 */

var Runner = require( './lib/runner' );
var chalk  = require( 'chalk' );
var debug  = require( 'debug' )( 'bouncer' );

var Bouncer = function( options ) {
  debug( 'Initialized Bouncer' );

  this.options = {
    runner : {
      url            : options.url,
      allowedDomains : options.allowedDomains,
      log            : options.log || function( message ) {
        console.log( '****************************************' );
        console.log( message );
      }
    },
    wpt : {
      pollResults : 10,
      requests    : true,
      runs        : options.runs || 1,
      server      : options.server || 'www.webpagetest.org',
      timeout     : 480,
      video       : true
    }
  }

  this.runner = new Runner( this.options );
}

Bouncer.prototype.run = function( callback ) {
  if ( !this.options.runner.url ) {
    return callback( ' -> No url to run against defined <- ' );
  }

  if (
    !this.options.runner.allowedDomains ||
    !this.options.runner.allowedDomains.length
  ) {
    return callback( ' -> No allowed domains set <- ' );
  }

  this.options.runner.log( ' (╯°□°)╯  Starting to bounce ' );
  this.options.runner.log( ' Set WPT server: ' );
  this.options.runner.log( ' -> ' + this.options.wpt.server + '\n' );

  this.runner.on( 'error', function( error ) {
    this.options.runner.log( 'ERROR ->' +  error );
  }.bind( this ) );

  this.runner.on( 'evaluated3rdParties', function( thirdParties ) {
    this.options.runner.log(
      'EVALUATED 3RD PARTIES ->' + thirdParties.join( ', ' )
    );
  }.bind( this ) );

  this.runner.on( 'msg', function( msg ) {
    this.options.runner.log( msg );
  }.bind( this ) );

  this.runner.run( function( err, data ) {
    if ( err ) {
      return callback( err );
    }

    callback( null, data );
  } );
};


module.exports = Bouncer;
