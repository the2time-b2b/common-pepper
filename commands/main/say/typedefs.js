/**
 * @typedef {Object} DBTask Task whose 'stringified' version is in accordance to
 * the task schema of the local database.
 * @property {string} totalWaitInterval A valid interval in which the task in
 * invoked for every interval cycle.
 * @property {string} channel The username of a channel on Twitch.tv.
 * @property {string} taskMessage Response to be sent for specified interval and
 * channel.
 */


/**
 * @typedef {Object.<string, DBTask>} DBTasks List of tasks inside an object
 * whose each key is its corresponding task name.
 */


/**
 * @typedef {[DBTask]} DBSchema Schema of the local JSON database.
 */

exports.unused = {};
