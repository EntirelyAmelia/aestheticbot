module.exports = {
    // How noisy do you want console output to be.
    // Options: error, arn, info, verbose, debug
    log_level: 'debug',

    slack: {
        bot_name: 'aestheticbot',

        // Leave empty to listen in all channels or provide channel names to only listen in specific channels.
        channel_whitelist: [
            'amelia-bot-test'
        ],

        // Will post to Tumblr without sharing the post link in Slack.
        silent_mode: false,

        // Send users a DM telling them about this bot when they join any channel this bot is active in.
        // To enabled, provide a string to send users.
        // To disable, set to `null`.
        channel_welcome_message: null,

        // Message types to listen to.
        // Options: `direct_message`, `direct_mention`, `message_received`
        message_types: [
            'message_received',
            'direct_mention'
        ],
    },

    tumblr: {
        // The Tumblr blog to post to.
        blog: 'channelaesthetic',

        // A `null` trigger is allowed for up to one post type.
        action: {
            GIF: {
                enabled: false, // not implemented
                trigger: 'gif',
            },
            PHOTO: {
                enabled: true,
                trigger: 'photo',

                // Enable photo search engines
                search: {
                    giphy: false,
                    tumblr: false,
                },
            },
            TEXT: {
                enabled: true,
                trigger: 'text',
            },
            TRENDING: {
                enabled: false, // not implemented
                trigger: 'trending',
            },
        }
    },
};
