'use strict'

const util = require('./utils');

var Botkit = require('botkit');
var log = require('winston');

var TumblrClient = require('./TumblrClient');
var MessageProcessor = require('./MessageProcessor');
var InvalidRequestError = require('./errors/InvalidRequestError');
var MalformedPostError = require('./errors/MalformedPostError');

class SlackPostr {
    constructor(creds, config) {
        log.level = config.log_level;

        this.creds = creds;
        this.config = config;

        this.slack = Botkit.slackbot({
            debug: false,
            // logger: log,
            // logLevel: 1,
            //include "log: false" to disable logging
            //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
        });

        this.tumblr = new TumblrClient(creds, config);

        this.channelWhitelist = [];
        this.blockedUsers = [];

        this.blogInfo = {};
    }

    start() {
        log.info('Starting SlackPostr...');

        // connect the bot to a stream of messages
        log.info('Connecting to Slack...');
        this.slack.spawn({
            token: this.creds.slack_api_token,
        }).startRTM();

        this.resolveChannelWhitelist();
        this.cacheBlogInfo();
        this.setListeners();
    }

    setListeners() {
        log.info('Setting listeners...');

        let messageTypes = this.config.slack.message_types;
        let postTypes = this.config.tumblr.post_types;

        // FIXME: Maybe we should always take two params?
        let inputArgWildcard = '(.*)'; // TODO: Should this be a constant?

        let nullTriggerEnabled = false;

        for (var type in postTypes) {
            let definition = postTypes[type];

            // Only one `null` trigger can be enabled
            if (!definition.trigger) {
                if (nullTriggerEnabled) {
                    continue;
                }
                nullTriggerEnabled = true;
            }

            let trigger = definition.trigger
                ? definition.trigger + ' ' + inputArgWildcard
                : inputArgWildcard;

            if (definition.enabled) {
                this.slack.hears(
                    trigger,
                    messageTypes,
                    this.messageProcessor.bind(this, type)
                );
            }
        }
    }

    // FIXME: Implement
    resolveChannelWhitelist() {
        log.info('Resolving channel whitelist...');

        let whitelist = this.config.slack.channel_whitelist;

        if (!whitelist || whitelist.length < 1) {
            return;
        }
    }

    cacheBlogInfo() {
        log.info('Retrieving blog info...');
        // Need to get blog url
// FIXME: Maybe this should be stored in TumblrClient instead
        this.tumblr.getInfo(function(info) {
            log.info('Using blog url: ' + info.blog.url);
            this.blogInfo = info.blog;
        }.bind(this));
    }

    messageProcessor(type, bot, message) {
        log.debug('Processing: ' + type);

        let processor = new MessageProcessor(this.config);

        try {
            var result = processor[type](message);

            if (result) {
                this.executeTumblrRequest(type, result, bot, message);
            } else {
                log.error('MessageProcessor returned an empty result for: ' + message);
                this.replyWithResult(bot, message, 'Something went wrong processing your message. (╯°□°）╯︵ ┻━┻');
                return;
            }
        } catch (error) {
            if (error instanceof InvalidRequestError) {
                this.replyWithResult(bot, message, error.message);
            } else {
                log.error(error);
            }
            return;
        }
    }

    executeTumblrRequest(type, options, bot, message) {
        log.debug('Attempting to execute ' + type + ': ' + JSON.stringify(options));

        try {
            // Call method named {type} on TumblrClient to execute.
            this.tumblr[type](
                options,
                this.postRequestHandler.bind(this, bot, message, {type, options})
            );
        } catch (error) {
            if (error instanceof MalformedPostError) {
                this.replyWithResult(bot, message, error.message);
            } else {
                log.error(error);
            }
        }
    }

    postRequestHandler(bot, message, request, result) {
        if (result) {
            this.replyWithResult(bot, message, 'Posted: ' + util.getPostUrl(this.blogInfo.url, result.id));
        } else {
            log.error('TumblrClient returned an empty result trying to execute ' + request.type + ': ' + JSON.stringify(request.options));
            this.replyWithResult(bot, message, 'Something went wrong posting your message. ┻━┻ ︵ヽ(`Д´)ﾉ︵ ┻━┻');
            return;
        }
    }

    replyWithResult(bot, message, response) {
        log.debug('Sending response: ' + response);

        if (this.config.slack.silent_mode) {
            log.debug('Silent mode enabled. Response not sent: ' + response)
            return;
        }

        bot.reply(message, response);
    }


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
