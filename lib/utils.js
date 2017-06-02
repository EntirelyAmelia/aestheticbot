'use strict'

const nodeUtil = require('util');
const validUrl = require('valid-url');

// add a trim() method for strings
String.prototype.trim = function() { return this.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); };

class Utils {
    /**
     * Just a wrapper for Util.inspect();
     */
    inspect(object) {
        return nodeUtil.inspect(object, false, null, true);
    }

    /**
     * Checks if string is a link and returns the url
     * @param  string  string String to validate
     * @return string|null    The url if a valid link, null if not
     */
    checkLink(string) {
        if (string) {
            string = string.trim();

            if (string.indexOf('<') === 0) {
                string = string.slice(1, string.length);
            }

            if (string.indexOf('>') === (string.length - 1)) {
                string = string.slice(0, (string.length));
            }

            let pipeIndex = string.indexOf('|');
            if (pipeIndex) {
                string = string.slice(0, pipeIndex);
            }

            if (validUrl.isUri(string)) {
                return string;
            }
        }

        return null;
    }

    checkUserMention(string, storage) {
        if (string && string.startsWith('<@U')) {
            let temp = string.slice(2, (string.length-1));
            let user = storage.get(temp)
            if (user) {
                return user;
            }
        }

        return null;
    }

    checkChannelMention(string, storage) {
        if (string && string.startsWith('<#C')) {
            let pipeIndex = string.indexOf('|');
            let temp = string.slice(2, pipeIndex);
            let channel = storage.get(temp)
            if (channel) {
                return channel;
            }
        }

        return null;
    }

    // FIXME: This needs to be written better
    cleanTag(tag, storage) {
        let cleanedString = '';
        let array = tag.split(' ');

        for (let index in array) {
            let word = array[index];
            let link = this.checkLink(word);
            if (link) {
                continue;
            }

            let user = this.checkUserMention(word, storage);
            if (user) {
                cleanedString += ' ' + user.name;
                continue;
            }

            let channel = this.checkChannelMention(word, storage);
            if (channel) {
                cleanedString += ' ' + channel.name;
                continue;
            }

            cleanedString += ' ' + word;
        }

        return cleanedString.trim();
    }

    getPostUrl(baseUrl, postId) {
        return baseUrl + 'post/' + postId;
    }

}

module.exports = new Utils();
