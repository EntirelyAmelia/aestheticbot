'use strict'

class InvalidRequestError extends Error {
  constructor(message) {
    super(message);
    this.message = message;
    this.name = this.constructor.name;
  }
}

module.exports = InvalidRequestError;
