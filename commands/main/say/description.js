module.exports = {
  "help": "Say something at every interval on a particular channel.",
  "usage":
    `${process.env.PREFIX}say <message> every <interval> on <channel> ` +
    "named <task-name>",
  "modify":
    `${process.env.PREFIX}say modify task-name say|on|every|named ` +
    "<message>|<h>:<m>:<s>|<channel>|<new-task-name>",
  "example":
    `${process.env.PREFIX}say my repeat message every 02:5:30 on ` +
    " named some-name",
  "message":
    "Space seperated message to be repeated for every interval and " +
    "on the channel specified.",
  "interval":
    "Interval should be in h:m:s or m:s or s format and not be " +
    "unrealistically large.",
  "channel":
    "Channel in which the bot says the specified message every set " +
    "interval. Channel's username should contain 4-25 characters which " +
    "includes alphanumerics and underscores only",
  "task-name":
    "Unique name for the task. Should contain 3-50 characters " +
    "which includes alphanumerics, hyphens and underscores only"
};
