'use strict'

var util = require('./utils');
var log = require('winston');
var TumblrClientOfficial = require('tumblr.js');
var querystring = require('querystring');

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

    PHOTO(options, callback) {
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

    TEXT(options, callback) {
        if (
            !options ||
            (!options.body && !options.title)
        ) {
            throw new MalformedPostError('No body provided.');
        }

        log.debug('Creating text post: ' + JSON.stringify(options));

        this.tumblr.createTextPost(this.config.tumblr.blog, options, function(error, data) {
            if (error) {
                log.error(error);
            } else {
                log.debug('Text post created: ' + util.inspect(data));
                callback(data);
            }
        }.bind(callback));
    }

    GIF(options, callback) {
        if (!options || !options.query) {
            throw new MalformedPostError('No search term provided.');
        }

        let url = '/v2/gif/search/' + querystring.escape(options.query);

        log.debug('Executing GIF search: ' + url);


        this.tumblr.getRequest(url, options, function(error, data) {
            if (error) {
                log.error(error);
            } else {
                // var url = getPostUrl(config.tumblr.blog, data.id);
                log.debug('GIF search successful: ' + util.inspect(data));
                callback(data);
            }
        }.bind(callback));
    }
}

module.exports = TumblrClient;
