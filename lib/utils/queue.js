var debug  = require( 'debug' )( 'QUEUE' );


var FunctionQueue = function() {
  this.stack = [];
};

FunctionQueue.prototype.push = function( fn ) {
  if( typeof fn === 'function' ) {
    this.stack.push( fn );

    if ( this.stack.length === 1 ) {
      this.getTop()();
    }
  } else {
    throw new Error( 'fn is not a function' );
  }

  return this;
};

FunctionQueue.prototype.pop = function() {
  this.stack.shift();

  if ( !this.isEmpty() ) {
    this.getTop()();
  }
};

FunctionQueue.prototype.isEmpty = function() {
  return this.stack.length === 0;
};

FunctionQueue.prototype.getTop = function() {
  return this.stack[ 0 ];
};

module.exports = FunctionQueue;
