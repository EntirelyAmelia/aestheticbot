'use strict'

const util = require('./utils');

var log = require('winston');
var TumblrClientOfficial = require('tumblr.js');

var MalformedPostError = require('./errors/MalformedPostError');

class TumblrClient {
    constructor(creds, config) {
        log.level = config.log_level;

        this.creds = creds;
        this.config = config;

        this.tumblr = TumblrClientOfficial.createClient({
            consumer_key: creds.tumblr_consumer_key,
            consumer_secret: creds.tumblr_consumer_secret,
            token: creds.tumblr_token,
            token_secret: creds.tumblr_token_secret
        });
    }

    getInfo(callback) {
        this.tumblr.blogInfo(this.config.tumblr.blog, {}, function(error, data) {
            if (error) {
                log.error(error);
                throw new Error('Could not look up blog info!');
            } else {
                // var url = getPostUrl(config.tumblr.blog, data.id);
                log.debug('Blog info retrieved: ' + util.inspect(data.blog));
                callback(data);
            }
        }.bind(callback));
    }

    photo(options, callback) {
        if (
            !options ||
            (!options.source && !options.data)
        ) {
            throw new MalformedPostError('No image provided.');
        }

        log.debug('Creating photo post: ' + JSON.stringify(options));

        this.tumblr.createPhotoPost(this.config.tumblr.blog, options, function(error, data) {
            if (error) {
                log.error(error);
            } else {
                // var url = getPostUrl(config.tumblr.blog, data.id);
                log.debug('Photo post created: ' + util.inspect(data));
                callback(data);
            }
        }.bind(callback));
    }
}

module.exports = TumblrClient;
