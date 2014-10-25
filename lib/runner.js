var Queue = require( './utils/queue' );
var WPT   = require( 'webpagetest' );
var _     = require( 'lodash' );
var chalk = require( 'chalk' );
var debug = require( 'debug' )( 'runner' );


var Runner = function( options ) {
  debug( 'Initialized Runner' );

  this.options = options;
  this.wpt = new WPT( this.options.wpt.server );

  this.data = {};
  this.queue = new Queue();
};


/**
 * [run description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Runner.prototype.run = function( callback ) {
  // store the callback to not pass it around the whole time
  this.done = callback;

  console.log(
    chalk.bgBlue.white.bold(
      ' (╯°□°)╯  Starting to call WPT to evaluate all 3rd party requests '
    )
  );

  // evaluate all 3rd parties
  this._get3rdParties( function( err, src, thirdParties ) {
    if ( err ) {
      this.done( err );

      return;
    }

    var numberOfRequests = thirdParties.length;

    thirdParties = _.reduce( thirdParties, function(thirdParties, domain ) {
      if ( thirdParties.indexOf( domain ) === -1 ) {
        thirdParties.push( domain );
      }

      return thirdParties;
    }, [] );

    this.thirdPartyDomains = thirdParties;

    console.log( chalk.bgWhite.black( ' Summary for this evaluation ' ) );
    console.log( ' -> ' + src + '\n' );
    console.log(
      chalk.bgWhite.black(
        ' Evaluated ' + numberOfRequests + ' 3rd party requests to the following domains: '
      )
    );
    console.log( ' -> ' + thirdParties.join( ', ' ) + '\n' );

    this._runAll();
  }.bind( this ) );
};


/**
 * [_get3rdParties description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Runner.prototype._get3rdParties = function( callback ) {
  this.wpt.runTest(
    this.options.runner.url,
    this.options.wpt,
    function( error, data ) {
      if ( error ) {
        // TODO put error handling here
        console.log( error );
      }

      // set requests and loading time
      // for first run without any blocked domains
      this.data.original = {
        firstView : {
          requests : data.response.data.median.firstView.requests[ 0 ]
        },
        repeatView : {
          requests : data.response.data.median.repeatView.requests[ 0 ]
        }
      };

      // reduce and filter third parties
      var thirdParties = _.reduce(
        data.response.data.median.firstView.requests[ 1 ].request,
        function( thirdParties, request ) {
          // console.log( request );
          var isAllowed    = false;
          var i            = 0;
          var length       = this.options.runner.allowedDomains.length;

          for( ; i < length; ++ i ) {
            // TODO put a regex thing in here
            if (
              !isAllowed &&
              request.host.indexOf( this.options.runner.allowedDomains[ i ] ) !== -1
            ) {
              isAllowed = true;
            }
          }

          if ( !isAllowed ) {
            thirdParties.push( request.host );
          }

          return thirdParties;
        },
        [],
        this
      );

      callback( error, data.response.data.summary, thirdParties );
    }.bind( this )
  );
};


Runner.prototype._run = function( options ) {
  console.log(
    chalk.bgBlue.white.bold(
      ' -> Starting to evaluate metrics for ' + options.allowedThirdPartyDomain + ' '
    )
  );

  var wptOptions = _.clone( this.options.wpt );

  wptOptions.block = _.reduce( this.thirdPartyDomains, function( block, domain ) {
    if ( domain !== options.allowedThirdPartyDomain ) {
      block.push( domain );
    }

    return block;
  }, [] );

  pollResults = false;
  debug(
    'Calling api with following options : ' + JSON.stringify( wptOptions )
  );

  this.wpt.runTest(
    this.options.runner.url,
    wptOptions,
    function( error, data ) {
      console.log( error );
      console.log( data );
      console.log( ' -> ' + data.response.data.summary );

      this.queue.pop();
    }.bind( this )
  );
};


Runner.prototype._runAll = function() {
  console.log(
    chalk.bgBlue.white.bold(
      ' (╯°□°)╯  Starting to call WPT to evaluate load times and request counts '
    )
  );

  var i      = 0;
  var length = this.thirdPartyDomains.length;

  for ( ; i < length; ++i ) {
    this.queue.push( function() {
      this._run( {
        allowedThirdPartyDomain : this.thirdPartyDomains[ i ]
      } );
    }.bind( this ) );
  }
};

module.exports = Runner;
