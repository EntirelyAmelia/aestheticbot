'use strict'

var Enum = require('es6-enum');

const ACTION = Enum('POST', 'SEARCH');
const PRE_ACTION = Enum('NONE', 'PHOTO_SEARCH', 'CHAT_HISTORY', 'CHAT_FUTURE');
const TYPE = Enum('GIF', 'LINK', 'PHOTO', 'TEXT', 'TRENDING');

class Constants {
    constructor() {
        this.ACTION = ACTION;
        this.PRE_ACTION = PRE_ACTION;
        this.TYPE = TYPE;
    }

    getAction(type) {
        switch (type) {
            case TYPE.LINK:
            case TYPE.PHOTO:
            case TYPE.TEXT:
                return ACTION.POST;
                break;
            case TYPE.GIF:
            case TYPE.TRENDING:
                return ACTION.SEARCH;
                break
        }

        throw new Error('Unknown message type');
    }
}

module.exports = new Constants();
