var Runner = require( './lib/runner' );
var chalk  = require( 'chalk' );
var debug  = require( 'debug' )( 'bouncer' );

var Bouncer = function( options ) {
  debug( 'Initialized Bouncer' );

  this.options = {
    runner : {
      url            : options.url,
      allowedDomains : options.allowedDomains,
      log            : options.log || chalk.bgBlue.white.bold
    },
    wpt : {
      pollResults : 10,
      requests    : true,
      runs        : options.runs || 5,
      server      : options.server || 'www.webpagetest.org',
      timeout     : 480
    }
  }
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

  console.log( chalk.bgBlue.white.bold( ' (╯°□°)╯  Starting to bounce ' ) );
  console.log( chalk.bgWhite.black( ' Set WPT server: ' ) );
  console.log( ' -> ' + this.options.wpt.server + '\n' );

  this.runner = new Runner( this.options );

  this.runner.run( function( err, data ) {
    if ( err ) {
      callback( err );

      return;
    }

    callback( null, data );
  } );
};


module.exports = Bouncer;
