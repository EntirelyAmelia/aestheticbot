'use strict'

const CONSTANTS = require('./constants');

var util = require('./utils');
var log = require('winston');
var InvalidRequestError = require('./errors/InvalidRequestError');
var ParsedMessage = require('./ParsedMessage');

class MessageProcessor {
    constructor(config, storage) {
        this.config = config;
        this.storage = storage;
        log.level = this.config.log_level;
    }

    parse(type, message) {
        log.debug('Parsing ' + type + ' command: ' + util.inspect(message));

        if (!CONSTANTS.TYPE[type]) {
            log.error('Unknown message type');
            return null;
        }

        let parsedMessage = new ParsedMessage(CONSTANTS.TYPE[type], message);

        try {
            this.processMessage(parsedMessage);
            return parsedMessage;
        } catch (error) {
            throw error;
        }

    }

    // Parse out links and mentions, clean message
    processMessage(parsedMessage) {
        log.debug('Parsing raw message: ' + parsedMessage.raw);

        let input = parsedMessage.raw.match[1];

        if (!input || input.length == 0) {
            // This really shouldn't ever happen, but errors find a way
            throw new InvalidRequestError('Request is empty.');
        }

        let inputParts = input.split(' ');

        for (let index in inputParts) {
            let string = inputParts[index];
            let cleanedWord = this.processWord(parsedMessage, string);
        }

        // Get the tags
        parsedMessage.tags = this.processTags(parsedMessage);

        log.debug('Cleaned message: ' + parsedMessage.text);
    }

    processWord(parsedMessage, string) {
        let user, channel, url;
        if (user = util.checkUserMention(string, this.storage)) {
            parsedMessage.users.push(user);
            string = '@' + user.name;
        } else if (channel = util.checkChannelMention(string, this.storage)) {
            string = '#' + channel.name;
        } else if (url = util.checkLink(string)) {
            parsedMessage.urls.push(url);
            string = url;
        }

        if (parsedMessage.text && parsedMessage.text.length > 0) {
            parsedMessage.text += ' ';
        }
        parsedMessage.text += string;

        return string;
    }

    // This is...fuck.
    processTags(parsedMessage) {
        let tags = [];

        // Splitting on the raw message will make sure we don't split on a channel mention as those will still start with `<#`
        // This is hacky, but it will make it easier to not miss a tag if it's the first word
        let input = ' ' + parsedMessage.raw.match[1];

        var firstHashIndex = input.indexOf(' #');
        parsedMessage.textNoTags = input.slice(0, firstHashIndex);
        input = input.slice(firstHashIndex + 2);

        // In theory, these are our tags. Theoretically.
        let rawTags = input.split(' #');

        if (rawTags.length > 0) {
            for (let index in rawTags) {
                let tag = rawTags[index].trim();
                tag = util.cleanTag(tag, this.storage);
                tags.push(tag);

                log.debug('Found tag: ' + tag);
            }
        }

        return tags;
    }
}

module.exports = MessageProcessor;
