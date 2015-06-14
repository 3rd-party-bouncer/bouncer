/*
 * bouncer
 * https://github.com/3rd-party-bouncer/bouncer
 *
 * Licensed under the MIT license.
 */

var debug  = require( 'debug' )( 'queue' );

/**
 * Constructor
 *
 * @tested
 */
var FunctionQueue = function() {
  this.stack = [];
};


/**
 * Push function to the queue
 *
 * If queue is empty it will start rollin'
 *
 * @param  {Function} fn function to add to the queue
 * @return {Object}      queue
 *
 * @tested
 */
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


/**
 * Pop first entry in the queue and
 * execute next item
 *
 * @return {Object} queue
 *
 * @tested
 */
FunctionQueue.prototype.pop = function() {
  this.stack.shift();

  if ( !this.isEmpty() ) {
    this.getTop()();
  }

  return this;
};


/**
 * Is queue empty yet?
 *
 * @return {Boolean} is empty
 *
 * @tested
 */
FunctionQueue.prototype.isEmpty = function() {
  return this.stack.length === 0;
};


/**
 * Get function on top of the queue
 * @return {Function} top function
 *
 * @tested
 */
FunctionQueue.prototype.getTop = function() {
  return this.stack[ 0 ];
};


/**
 * Get length of stack inside of the queue
 *
 * @return {Number} length
 *
 * @tested
 */
FunctionQueue.prototype.getLength = function() {
  return this.stack.length;
};

module.exports = FunctionQueue;
