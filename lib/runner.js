var Queue        = require( './utils/queue' );
var WPT          = require( 'webpagetest' );
var _            = require( 'lodash' );
var debug        = require( 'debug' )( 'runner' );
var EventEmitter = require( 'events' ).EventEmitter;
var util         = require( 'util' );


var Runner = function( options ) {
  debug( 'Initialized Runner' );

  this.options = options;
  this.wpt = new WPT( this.options.wpt.server );

  this.data  = {};
  this.queue = new Queue();
  this.log   = options.runner.log;

  EventEmitter.call( this );
};

util.inherits( Runner, EventEmitter );

/**
 * [run description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Runner.prototype.run = function( callback ) {
  // store the callback to not pass it around the whole time
  this.done = callback;

  this.log(
    ' (╯°□°)╯  Starting to call WPT to evaluate all 3rd party requests '
  );

  this.log(
    'Running with following configuration options:' +
    JSON.stringify( this.options, null, 2 )
  );

  // evaluate all 3rd parties
  this._get3rdParties( function( err, src, thirdParties ) {
    if ( err ) {
      this.done( err );

      return;
    }

    var numberOfRequests = thirdParties.length;

    thirdParties = _.reduce( thirdParties, function( thirdParties, domain ) {
      if ( thirdParties.indexOf( domain ) === -1 ) {
        thirdParties.push( domain );
      }

      return thirdParties;
    }, [] );

    this.thirdPartyDomains = thirdParties;

    this.log( ' Summary for this evaluation: ' );
    this.log( ' -> ' + src + '\n' );
    this.log(
      ' Evaluated ' + numberOfRequests + ' 3rd party requests to the following domains: '
    );
    this.log( ' -> ' + thirdParties.join( ', ' ) + '\n' );

    this.emit( 'evaluated3rdParties', thirdParties );

    this._runAll();
  }.bind( this ) );
};


/**
 * [_get3rdParties description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Runner.prototype._get3rdParties = function( callback ) {
  debug(
    'Calling api with following options : ' + JSON.stringify( this.options.wpt )
  );
  this.wpt.runTest(
    this.options.runner.url,
    _.clone( this.options.wpt ),
    function( error, data ) {
      if ( error ) {
        // TODO put error handling here
        this.log( error );
      }

      // set requests and loading time
      // for first run without any blocked domains
      // TODO das muss hier raus!!!!
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
  this.log(
    ' -> Starting to evaluate metrics for included ' + options.allowedThirdPartyDomain + ' '
  );

  var wptOptions = _.clone( this.options.wpt );

  wptOptions.block = _.reduce( this.thirdPartyDomains, function( block, domain ) {
    if ( domain !== options.allowedThirdPartyDomain ) {
      block.push( domain );
    }

    return block;
  }, [] ).join( ' ' );

  debug(
    'Calling api with following options : ' + JSON.stringify( wptOptions )
  );

  this.wpt.runTest(
    this.options.runner.url,
    wptOptions,
    function( error, data ) {
      if ( error ) {
        this.log( error );
        console.log( error );
        this.queue.pop();
      } else {
        this.log(
          ' Summary for this evaluation: '
        );
        this.log(
          '  DomReady : '  + data.response.data.median.firstView.domContentLoadedEventEnd +
          ' | LoadTime : ' + data.response.data.median.firstView.loadTime +
          ' | Requests : ' + data.response.data.median.firstView.requests[ 0 ]
        );
        this.log(
          '  DomReady : '  + data.response.data.median.repeatView.domContentLoadedEventEnd +
          ' | LoadTime : ' + data.response.data.median.repeatView.loadTime +
          ' | Requests : ' + data.response.data.median.repeatView.requests[ 0 ]
        );
        this.log( ' -> ' + data.response.data.summary );

        this.emit( 'data', {
          allowedUrls : options.allowedThirdPartyDomain,
          blockedUrls : wptOptions.block,
          firstView   : {
            loadEnd  : data.response.data.median.firstView.domContentLoadedEventEnd,
            loadTime : data.response.data.median.firstView.loadTime,
            requests : data.response.data.median.firstView.requests[ 0 ]
          },
          repeatView  : {
            loadEnd  : data.response.data.median.repeatView.domContentLoadedEventEnd,
            loadTime : data.response.data.median.repeatView.loadTime,
            requests : data.response.data.median.repeatView.requests[ 0 ]
          }
        } );

        this.queue.pop();
      }

      // yeah we're done!!! 8-)
      if ( this.queue.isEmpty() ) {
        this.done();
      }

    }.bind( this )
  );
};


/**
 * done
 * @return {[type]} [description]
 */
Runner.prototype._runAll = function() {
  this.log(
    ' (╯°□°)╯  Starting to call WPT to evaluate load times and request counts '
  );

  var i      = 0;
  var length = this.thirdPartyDomains.length;

  for ( ; i < length; ++i ) {
    this.queue.push( function( i ) {
      this._run( {
        allowedThirdPartyDomain : this.thirdPartyDomains[ i ]
      } );
    }.bind( this, [ i ] ) );
  }
};

module.exports = Runner;
