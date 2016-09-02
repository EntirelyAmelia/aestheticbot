'use strict'

const util = require('./utils.js');

var log = require('winston');

// Add trim() to String
String.prototype.trim = function() { return this.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); };

function MessageProcessor(config) {
    this.config = config;
}

MessageProcessor.prototype = {
    photo: function(bot, message) {
        log.debug('Photo post triggered: ' + util.inspect(message));

        let config = this.config.tumblr.post_types.photo;

        var term = message.match[1];
        if (!term || term.length == 0) {
            this.replyWithResult(bot, message, 'Photo post not created. No url or search term provided.');
            return;
        }

        var termArray = term.split(' ');
        var url = util.isLink(termArray[0])

        if (url) {
            log.debug('Photo post url verified: ' + url);

            // Remove link from array
            termArray.splice(0, 1);

            // Remainder of array is the caption
            var caption = termArray.join(' ');

            return {
                url: url,
                caption: caption,
            };
        } else {
            log.debug('Photo post is a search request');

            if (!config.search.giphy && !config.search.tumblr) {
                this.replyWithResult(bot, message, 'Photo post not created. Search not enabled.');
                return;
            }
            var searchTerm = termArray.join(' ');

            bot.reply(message, 'We will search for this: ' + searchTerm);
        }

        return false;
    },


}

module.exports = MessageProcessor;
