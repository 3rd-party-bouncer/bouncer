/*
 * bouncer
 * https://github.com/3rd-party-bouncer/bouncer
 *
 * Licensed under the MIT license.
 */

'use strict';

var Queue        = require( './utils/queue' );
var WPT          = require( 'webpagetest' );
var _            = require( 'lodash' );
var EventEmitter = require( 'events' ).EventEmitter;
var util         = require( 'util' );


/**
 * Constructor
 * @param {Object} options options
 */
var Runner = function( options ) {
  this.options = options;
  this.wpt = new WPT( this.options.wpt.server );

  this.data  = [];
  this.queue = new Queue();
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

  this.emit(
    'debug',
    'Running with following configuration options:' +
    JSON.stringify( this.options )
  );

  this.emit(
    'msg',
    'Starting to call WPT to evaluate all 3rd party requests '
  );

  // evaluate all 3rd parties
  this._get3rdParties( function( err, src, thirdParties ) {
    if ( err ) {
      return this.done( err );
    }

    thirdParties = _.reduce( thirdParties, function( collection, domain ) {
      if ( collection.indexOf( domain ) === -1 ) {
        collection.push( domain );
      }

      return collection;
    }, [] );

    this.thirdPartyDomains = thirdParties;

    this.emit( 'msg', 'Evaluated third parties: ' + thirdParties );

    this._runAll();
  }.bind( this ) );
};


/**
 * [_get3rdParties description]
 * @param  {Function} callback [description]
 */
Runner.prototype._get3rdParties = function( callback ) {
  // set number of runs to 1
  var wptOptions  = _.clone( this.options.wpt );
  wptOptions.runs = 1;

  this.emit(
    'debug',
    'Calling api with following options : ' + JSON.stringify( wptOptions )
  );
  this.wpt.runTest(
    this.options.runner.url,
    wptOptions,
    function( error, data ) {
      if ( error ) {
        this.emit(
          'error',
          error
        );
      }

      data.allowedUrls = '*';
      data.blockedUrls = 'none';

      this.emit( 'data', data );
      this.data.push( data );

      // reduce and filter third parties
      var thirdParties = _.reduce(
        data.response.data.median.firstView.requests[ 1 ].request,
        function( collection, request ) {
          var isAllowed    = false;
          var i            = 0;
          var length       = this.options.runner.allowedDomains.length;

          for( ; i < length; ++i ) {
            // TODO put a regex thing in here
            if (
              !isAllowed &&
              request.host.indexOf( this.options.runner.allowedDomains[ i ] ) !== -1
            ) {
              isAllowed = true;
            }
          }

          if ( !isAllowed ) {
            collection.push( request.host );
          }

          return collection;
        },
        [],
        this
      );

      callback( error, data.response.data.summary, thirdParties );
    }.bind( this )
  );
};


Runner.prototype._run = function( options ) {
  options = options || {};

  this.emit(
    'msg',
    options.allowedThirdPartyDomain ?
    'Starting to evaluate metrics for included ' + options.allowedThirdPartyDomain :
    'Starting to evaluate metrics for all blocked 3rd parties'
  );

  var wptOptions = _.clone( this.options.wpt );

  wptOptions.block = _.reduce( this.thirdPartyDomains, function( block, domain ) {
    if ( domain !== options.allowedThirdPartyDomain ) {
      block.push( domain );
    }

    return block;
  }, [] ).join( ' ' );

  this.emit(
    'debug',
    'Calling api with following options : ' + JSON.stringify( wptOptions )
  );

  this.wpt.runTest(
    this.options.runner.url,
    wptOptions,
    function( error, data ) {
      if ( error ) {
        this.emit( 'error', error );
      } else {
        data.allowedUrls = options.allowedThirdPartyDomain || 'none';
        data.blockedUrls = wptOptions.block;
        data.runsToGo    = this.queue.getLength() - 1;

        this.emit( 'data', data );
        this.data.push( data );
      }

      var msg = options.allowedThirdPartyDomain ?
        'Finished to evaluate metrics for included ' + options.allowedThirdPartyDomain :
        'Finished to evaluate metrics for all blocked 3rd parties';

      this.emit(
        'msg',
        msg + ' | ' + data.response.data.summary
      );

      this.queue.pop();

      // yeah we're done!!! 8-)
      if ( this.queue.isEmpty() ) {
        this.done( null, this.data );
      }
    }.bind( this )
  );
};


/**
 * done
 * @return {[type]} [description]
 */
Runner.prototype._runAll = function() {
  this.emit(
    'msg',
    'Starting to call WPT to evaluate load times and request counts '
  );

  var i      = 0;
  var length = this.thirdPartyDomains.length;

  this.queue.push( function() {
    this._run();
  }.bind( this ) );

  function push( index ) {
    this._run( {
      allowedThirdPartyDomain : this.thirdPartyDomains[ index ]
    } );
  }

  for ( ; i < length; ++i ) {
    this.queue.push( push.bind( this, [ i ] ) );
  }
};

module.exports = Runner;
