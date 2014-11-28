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
        console.log( chalk.bgBlue.white.bold( message ) );
      }
    },
    wpt : {
      pollResults : 10,
      requests    : true,
      runs        : options.runs || 1,
      server      : options.server || 'www.webpagetest.org',
      timeout     : 480
    }
  }

  this.runner = new Runner( this.options );
}

Bouncer.prototype.run = function( callback ) {
  if ( !this.options.runner.url ) {
    callback( ' -> No url to run against defined <- ' );

    return;
  }

  if (
    !this.options.runner.allowedDomains ||
    !this.options.runner.allowedDomains.length
  ) {
    callback( ' -> No allowed domains set <- ' );

    return;
  }

  this.options.runner.log( ' (╯°□°)╯  Starting to bounce ' );
  this.options.runner.log( ' Set WPT server: ' );
  this.options.runner.log( ' -> ' + this.options.wpt.server + '\n' );

  this.runner.run( function( err, data ) {
    if ( err ) {
      callback( err );

      return;
    }

    callback( null, data );
  } );
};


module.exports = Bouncer;
