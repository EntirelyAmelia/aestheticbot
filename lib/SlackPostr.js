'use strict'

var util = require('./utils');
var cache = require('./DataCache');
var Botkit = require('botkit');
var log = require('winston');

var TumblrClient = require('./TumblrClient');
var MessageProcessor = require('./MessageProcessor');
var PostGenerator = require('./PostGenerator');
var InvalidRequestError = require('./errors/InvalidRequestError');
var MalformedPostError = require('./errors/MalformedPostError');

class SlackPostr {
    constructor(creds, config) {
        log.level = config.log_level;

        this.creds = creds;
        this.config = config;

        this.controller = Botkit.slackbot();
        this.storage = new cache();

        this.tumblr = new TumblrClient(creds, config);

        this.channelWhitelist = [];
        this.blockedUsers = [];

        this.blogInfo = {};
    }

    start() {
        log.info('Starting SlackPostr...');

        // connect the bot to a stream of messages
        log.info('Connecting to Slack...');
        this.bot = this.controller.spawn({
            token: this.creds.slack_api_token,
        })
        this.bot.startRTM(this.cacheEnvData.bind(this));

        this.cacheBlogInfo();
        this.setListeners();
    }

    cacheEnvData(error, bot, payload) {
        if (error) {
            log.error(error);
            return;
        }

        log.info('Caching environment data...')

        this.storage.saveAll(payload.channels);
        this.storage.saveAll(payload.users);
        this.storage.saveAll(payload.bots);

        // Refresh the cached data every five minutes
        setTimeout(this.refreshEnvData.bind(this), 5);
    }

    refreshEnvData() {
        // TODO: figure out how to call cacheEnvData again
    }


    setListeners() {
        log.info('Setting listeners...');

        let messageTypes = this.config.slack.message_types;
        let actions = this.config.tumblr.action;

        // FIXME: Maybe we should always take two params?
        let inputArgWildcard = '(.*)'; // TODO: Should this be a constant?

        let nullTriggerEnabled = false;

        for (var type in actions) {
            let definition = actions[type];

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
                this.controller.hears(
                    trigger,
                    messageTypes,
                    this.messageProcessor.bind(this, type)
                );
            }
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

        let processor = new MessageProcessor(this.config, this.storage);
        let generator = new PostGenerator(this.config, this.storage);

        try {
            let parsedMessage = processor.parse(type, message);
            if (!parsedMessage) {
                log.error('MessageProcessor returned an empty result for: ' + message);
                this.replyWithResult(bot, message, 'Something went wrong processing your message. (╯°□°）╯︵ ┻━┻');
                return;
            }

            let postData = generator[type](parsedMessage);

            log.debug('Post data: ' + JSON.stringify(postData));

            if (postData) {
                this.executeTumblrRequest(type, postData, bot, message);
            } else {
                log.error('PostGenerator returned an empty result for: ' + message);
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
}

module.exports = SlackPostr;
