/*
 * bouncer
 * https://github.com/3rd-party-bouncer/bouncer
 *
 * Licensed under the MIT license.
 */

'use strict';

var Bouncer      = require( './' );

module.exports = {
  bouncer : {
    constructor : function( test ) {
      var options = {
        allowedDomains : [ 'foo', 'bar' ],
        debug          : true,
        url            : 'perf-tooling.today',
        log            : function() {},
        runs           : 42,
        server         : 'somewebpagetest.instance'
      };

      var bouncer = new Bouncer( options );

      test.equal( bouncer.options.runner.allowedDomains, options.allowedDomains );
      test.done();
    }
  }
};
