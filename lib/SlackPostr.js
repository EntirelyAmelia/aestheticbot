'use strict'

const util = require('./utils.js');

var Botkit = require('botkit');
var log = require('winston');
var request = require('request');
var tumblr_client = require('tumblr.js');

function SlackPostr(creds, config) {
    log.level = config.log_level;

    this.slack = Botkit.slackbot({
        debug: false,
        // logger: log,
        // logLevel: 1,
        //include "log: false" to disable logging
        //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
    });

    this.tumblr = tumblr_client.createClient({
        consumer_key: creds.tumblr_consumer_key,
        consumer_secret: creds.tumblr_consumer_secret,
        token: creds.tumblr_token,
        token_secret: creds.tumblr_token_secret
    });

    this.creds = creds;
    this.config = config;

    this.channelWhitelist = [];
    this.blockedUsers = [];
}

SlackPostr.prototype = {
    start: function() {
        log.info('Starting SlackPostr...');

        // connect the bot to a stream of messages
        log.info('Connecting to Slack...');
        this.slack.spawn({
            token: this.creds.slack_api_token,
        }).startRTM();

        this.resolveChannelWhitelist();
        this.cacheBlogInfo();
        this.setListeners();
    },

    setListeners: function() {
        log.info('Setting listeners...');

        var messageTypes = this.config.slack.message_types;
        var postTypes = this.config.tumblr.post_types;

        var inputArgWildcard = '(.*)'; // TODO: Should this be a constant?

        var nullTriggerEnabled = false;

        for (var type in postTypes) {
            var definition = postTypes[type];

            // Only one `null` trigger can be enabled
            if (!definition.trigger) {
                if (nullTriggerEnabled) {
                    continue;
                }
                nullTriggerEnabled = true;
            }

            var trigger = definition.trigger ? definition.trigger + ' ' + inputArgWildcard : inputArgWildcard;

            if (definition.enabled) {
                var processMethod = 'processPostType_' + type;
                var callback = this[processMethod];

                if (typeof callback === "function") {
                    log.verbose('Listening for ' + type + ' posts with trigger: ' + trigger);
                    this.slack.hears(trigger, messageTypes, callback.bind(this));
                } else {
                    log.warn('Process method not found for: ' + type);
                }
            }
        }
    },

// FIXME: Implement
    resolveChannelWhitelist: function() {
        log.info('Resolving channel whitelist...');

        var whitelist = this.config.slack.channel_whitelist;

        if (!whitelist || whitelist.length < 1) {
            return;
        }
    },

// FIXME: Implement
    cacheBlogInfo: function() {
        log.info('Retrieving blog info...');
        // Need to get blog url
    },

    replyWithResult: function(bot, message, response) {
        log.debug('Sending response: ' + response);

        if (this.config.slack.silent_mode) {
            log.debug('Silent mode enabled. Response not sent: ' + response)
            return;
        }

        bot.reply(message, response);
    },

    processPostType_photo: function(bot, message) {
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

            bot.reply(message, 'We got this link: ' + url);
            bot.reply(message, 'We got this caption: ' + caption);

            this.createPost_photo(url, caption);
        } else {
            log.debug('Photo post is a search request');

            if (!config.search.giphy && !config.search.tumblr) {
                this.replyWithResult(bot, message, 'Photo post not created. Search not enabled.');
                return;
            }
            var searchTerm = termArray.join(' ');

            bot.reply(message, 'We will search for this: ' + searchTerm);
        }

    },

    createPost_photo: function(photoUrl, caption) {
        var options = {
            source: photoUrl,
            caption: caption
        };

        log.debug('Creating photo post: ' + JSON.stringify(options));

        this.tumblr.createPhotoPost(this.config.tumblr.blog, options, function(error, data) {
            if (error) {
                log.error(error);
            } else {
                // var url = getPostUrl(config.tumblr.blog, data.id);
                log.debug('Photo post created: ' + util.inspect(data, false, null));
                // say(url, where);
            }
        });
    },

    // function MessageProcessor() {}
    //
    // MessageProcessor.prototype = {
    //     processMessage: function(bot, message, callback, params) {
    //         try {
    //             // Check channel list
    //             bot.api.channels.info({channel: message.channel}, function(err, response) {
    //                 if (response && response.channel) {
    //                     if (
    //                         config.slack.channel_whitelist.length == 0 ||
    //                         (config.slack.channel_whitelist.indexOf(response.channel.name) >= 0)
    //                     ) {
    //                         callback(bot, message, params);
    //                     }
    //                 }
    //             }.bind({bot: bot, message: message, callback: callback, params: params}));
    //         } catch (error) {
    //             console.log(error);
    //             return false;
    //         }
    //     },
    //
    //     postToTumblr: function(bot, message, params) {
    //         bot.reply(message, 'Yup, we should do it');
    //     }
    // }


}

module.exports = SlackPostr;
