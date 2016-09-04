'use strict'

const util = require('./utils');

var log = require('winston');
var InvalidRequestError = require('./errors/InvalidRequestError');

// Add trim() to String
String.prototype.trim = function() { return this.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); };

class MessageProcessor {

    constructor(config) {
        this.config = config;
        log.level = this.config.log_level;
    }

    photo(message) {
        log.debug('Photo post triggered: ' + util.inspect(message));

        let config = this.config.tumblr.post_types.photo;

        var term = message.match[1];
        if (!term || term.length == 0) {
            throw new InvalidRequestError('Photo post not created. No url or search term provided.');
        }

        let termArray = term.split(' ');
        let url = util.isLink(termArray[0]);

        if (url) {
            log.debug('Photo post url verified: ' + url);

            // Remove link from array. Remainder of array is the caption.
            termArray.splice(0, 1);
            let caption = termArray.join(' ');

            return {
                source: url,
                caption: caption,
            };
        } else {
            log.debug('Photo post is a search request');

            if (!config.search.giphy && !config.search.tumblr) {
                throw new InvalidRequestError('Photo post not created. Search not enabled.');
            }
            let searchTerm = termArray.join(' ');

            return {
                source: url,
                caption: caption,
            };
        }

        return false;
    }
}

module.exports = MessageProcessor;
