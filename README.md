bouncer
=======

[![Build Status](http://img.shields.io/travis/3rd-party-bouncer/bouncer.svg?style=flat)](https://travis-ci.org/3rd-party-bouncer/bouncer)

Measure the impace of third parties the easy way.

Bouncer will visit your site and evaluate all included 3rd parties. Afterwards it will continue calling WebpageTest to gather metrics about your site with either all 3rd parties blocked or only one specific 3rd party allowed.

## CLI Usage

```
$ bouncer --help

  Usage: bouncer [options]

  Track your 3rd parties the easy way

  Options:

    -h, --help                       output usage information
    -V, --version                    output the version number
    -a, --allowed-domains <allowed>  Comma separated list of allowed domains (required)
    -d, --debug                      Enable verbose debug output
    -k, --key <key>                  Set api key
    -l, --location <location>        Location of agent you want to run
    -o, --output <output>            Destingation of result output
    -r, --runs <runs>                Number of runs to evaluate loading times [ 1 ]
    -s, --server <server>            Webpagetest server you want to use [ www.webpagetest.org ]
    -u, --url <url>                  Url you want to bounce (required)

  Example:
    $ bouncer --url www.some.url --allowed-domains www.some.url --key xxx --server xx.compute-1.amazonaws.com --output ./result.json
```


## Module Usage

```
var bouncer = new Bouncer( {
  allowedDomains : [ 'allowedDomain1.com', 'allowedDomain2.com' ], // allowed third party domains
  key            : 'asdfghjkl',                                    // wpt key
  location       : program.location,                               // wpt location
  runs           : program.runs,                                   // number of runs for each 3rd party evaluation
  server         : program.server,                                 // wpt instance
  url            : program.url                                     // url to run against
} );

bouncer.on( 'bouncer:error', function( error ) {
  console.log( chalk.red( '( ︶︿︶) ERROR: ' ) +  error );
} );

bouncer.on( 'bouncer:msg', function( msg ) {
  console.log( chalk.yellow( ' (╯°□°)╯  MSG: ' ) + msg );
} );

if ( program.debug ) {
  bouncer.on( 'bouncer:debug', function( msg ) {
    console.log( chalk.cyan( '  ಠ_ಠ   DEBUG: ' ) + msg );
  } );
}

bouncer.run( function( err, data ) {
  if ( err ) {
    throw err;
  }

  console.log( chalk.green( '(╯°□°)╯ ' ) + 'Bouncer finished!' );

  fs.writeFileSync( outputPath, JSON.stringify( data ) );
  console.log( chalk.green( '(╯°□°)╯ ' ) + 'Written result to ' + chalk.green( outputPath ) );
} );
```
