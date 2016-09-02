'use strict'

const nodeUtil = require('util');
const validUrl = require('valid-url');

function Utils() {}

Utils.prototype = {
    /**
     * Just a wrapper for Util.inspect();
     */
    inspect: function(object) {
        return nodeUtil.inspect(object, false, null, true);
    },

    /**
     * Checks if string is a link and returns the url
     * @param  string  string String to validate
     * @return string|null    The url if a valid link, null if not
     */
    isLink: function(string) {
        if (string) {
            string = string.trim();

            if (string.indexOf('<') === 0) {
                string = string.slice(1, string.length);
            }

            if (string.indexOf('>') === (string.length - 1)) {
                string = string.slice(0, (string.length - 1));
            }

            if (validUrl.isUri(string)) {
                return string;
            }
        }

        return null;
    },

}

module.exports = Utils;
