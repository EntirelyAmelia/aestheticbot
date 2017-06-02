'use strict'

const CONSTANTS = require('./constants');

class ParsedMessage {
    constructor(type, message) {
        this.raw = message;
        this.type = type;
        this.action = CONSTANTS.getAction(type);
        this.preAction = CONSTANTS.PRE_ACTION.NONE;

        this.text = '';
        this.textNoTags = '';

        this.users = [];
        this.urls = [];
        this.tags = [];
    }
}

module.exports = ParsedMessage;
