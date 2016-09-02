var SlackPostr = require('./lib/SlackPostr');
var config = require('./config');
var creds = require('./creds');

var bot = new SlackPostr(creds, config);

bot.start();
