const fs = require("fs");


const DB_PATH = `${__dirname}\\tasks-db.json`;


(function DBInit() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify([{}], null, 2));
    }
  }
  catch (err) { console.error(err); }
})();


const say = {
  help: "Say something at every interval on a particular channel.",
  usage: `${process.env.PREFIX}say <message> every <h>:<m>:<s> on <channel> ` +
    "named <task-name>",
  example: `${process.env.PREFIX}say my repeat message every 02:5:30 on ` +
    "pogTV named some-name",
  message: "Message to be repeated for every specified interval.",
  channel: "Channel in which the bot says the specified message " +
    "every set interval.",
  "task-name": "Unique name for the task.",
  /**
   * Sends a bot response for on specified particular channel and set interval.
   * @memberof say
   * @method exec
   * @param {Array<string>} request
   * @param {string} context
   * @returns {string}
   */
  exec: function(context, request) {
    const everyIndex = request.lastIndexOf("every");
    if (everyIndex === -1) return this.usage;

    const meta = request.splice(everyIndex);
    if (
      meta.length !== 6
      || meta[0] !== "every"
      || meta[meta.length - 4] !== "on"
      || meta[meta.length - 2] !== "named"
    ) {
      return this.usage;
    }

    const [, interval, , channel, , taskName] = meta;
    if (!interval.match(/^\d+$|^((\d+:?){1,2}(\d+))$/)) {
      return "Interval should be in h:m:s or m:s or s format.";
    }
    if (!channel.match(/^[a-zA-Z0-9_]{4,25}$/)) {
      return "Username should only contain alphanumeric and underscores, "
        + "ranging from 4-25 characters only.";
    }
    if (!taskName.match(/^[a-zA-Z0-9_-]{3,50}$/)) {
      return "Task names should only contain alphanumerics, hyphens "
        + "and underscores, ranging from 3-50 characters only.";
    }

    const waitInterval = interval.split(":")
      .map(timePart => parseInt(timePart));

    const timeParts = {};
    switch (waitInterval.length) {
    case 1:
      ({ 0: timeParts.seconds } = waitInterval);

      break;
    case 2:
      ({ 0: timeParts.minutes, 1: timeParts.seconds } = waitInterval);

      break;
    case 3:
      (
        {
          0: timeParts.hours,
          1: timeParts.minutes,
          2: timeParts.seconds
        } = waitInterval
      );

      break;
    }

    const { hours, minutes, seconds } = timeParts;
    if (
      (seconds && !(seconds < Number.MAX_VALUE))
      || (minutes && !(minutes < Number.MAX_VALUE))
      || (hours && !(hours < Number.MAX_VALUE))
    ) return "Please enter a valid interval.";

    let totalWaitInterval = 0;
    if (seconds) { totalWaitInterval += seconds; }
    if (minutes) { totalWaitInterval += (minutes * 60); }
    if (hours) { totalWaitInterval += (hours * 60 * 60); }

    if (!(totalWaitInterval < Number.MAX_VALUE)) {
      return "Please enter a valid interval.";
    }

    try {
      const db = fs.readFileSync(DB_PATH);
      const [tasks] = JSON.parse(db);

      // TODO: Implement task removal and modify functionality
      if (tasks[taskName]) {
        return `Task with name '${taskName}' already exists.`;
      }

      const newTask = {
        totalWaitInterval: totalWaitInterval,
        channel: channel,
        taskMessage: request.join(" ")
      };
      tasks[taskName] = newTask;
      fs.writeFileSync(DB_PATH, JSON.stringify([tasks], null, 4));

      return `Task ${taskName} activated on channel ${channel}.`;
    }
    catch (err) {
      if (err instanceof SyntaxError) {
        console.error(err.message, "for the file in path:", DB_PATH);
      }
      else if (err.code && err.code === "ENOENT") {
        console.error(err.message);
      }
      else {
        console.error(err.message);
      }
    }

    return false;
  }
};


module.exports = { say };
