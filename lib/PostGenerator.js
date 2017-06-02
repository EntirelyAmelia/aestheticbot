'use strict'

const CONSTANTS = require('./constants');

var util = require('./utils');
var log = require('winston');
var InvalidRequestError = require('./errors/InvalidRequestError');

class PostGenerator {
    constructor(config, storage) {
        this.config = config;
        this.storage = storage;
        log.level = this.config.log_level;
    }

    PHOTO(parsedMessage) {
        log.debug('Photo post triggered: ' + util.inspect(parsedMessage.raw));

        let config = this.config.tumblr.action.PHOTO;

        if (!parsedMessage.urls || parsedMessage.urls.length < 1) {
            throw new InvalidRequestError('Photo post not created. No url or search term provided.');
        }

        // TODO: This needs to handle photosets
        return {
            source: parsedMessage.urls[0],
            caption: parsedMessage.textNoTags,
            tags: parsedMessage.tags.join(),
        };
    }

    TEXT(parsedMessage) {
        log.debug('Text post triggered: ' + util.inspect(parsedMessage.raw));

        let config = this.config.tumblr.action.TEXT;

        if (!parsedMessage.text) {
            throw new InvalidRequestError('Text post not created. No post body provided.');
        }

        return {
            // title: null, // TODO: Need to parse this from the message somehow
            body: parsedMessage.text,
            tags: parsedMessage.tags.join(),
        }
    }

    GIF(parsedMessage) {
        log.debug('GIF search triggered: ' + util.inspect(parsedMessage.raw));

        let config = this.config.tumblr.action.GIF;

        if (!parsedMessage.text) {
            throw new InvalidRequestError('GIF search not executed. No search term provided.');
        }

        return {
            query: parsedMessage.text,
        };

    }
}

module.exports = PostGenerator;
