const Command = require("../../command");
const Task = require("./task");
const Tasks = require("./tasks");

const description = require("./description");


class Say extends Command {
  /**
   * Invokes a bot response on a specified channel based on set attributes.
   * @param {import("tmi.js").CommonUserstate} context Meta data of the user who
   *  invoked the command.
   * @param {Array<string>} request User request that contains attributable
   * information on how the bot response is to be invoked.
   * @returns {string} Status of the executed command to be sent back to the
   * user who invoked it.
   */
  static exec(context, request) {
    if (request.join(" ") === "clear task list") {
      Tasks.clearTasks();
      return "The task list has been wiped clean.";
    }
    if (request[0] === "modify") {
      const modifiedAttributes = request.splice(1);
      return Say.#modifyTask(modifiedAttributes);
    }

    // Seperate the bot message to be sent from it's meta conditions.
    const metaAtrributeValueLength = 6;
    const meta = request.splice(request.length - metaAtrributeValueLength);

    if (!Say.#checkCommandStructure(request, meta)) return description.usage;

    const [
      intervalAttribute, interval,
      channelAttribute, channel,
      tasknameAttribute, taskName
    ] = meta;
    const attributeKeyValue = {
      [intervalAttribute]: interval,
      [channelAttribute]: channel,
      [tasknameAttribute]: taskName
    };


    const attributeKeys = Object.keys(attributeKeyValue);
    const isValidAttributeKeys = Say.#checkAttributeKeys(attributeKeys);
    if (!isValidAttributeKeys) return description.usage;


    for (let i = 0; i < attributeKeys.length; i++) {
      const attributeKey = attributeKeys[i];
      const attributeValue = attributeKeyValue[attributeKey];
      const isValidAttributeValue =
        Say.#checkAttributeValue(attributeKey, attributeValue);
      if (!isValidAttributeValue) {
        switch (attributeKey) {
          case "say":
            return description.message;
          case "every":
            return description.interval;
          case "on":
            return description.channel;
          case "named":
            return description["task-name"];
        }
      }
    }


    const parsedInterval = Say.#parseInterval(interval);

    const validatedInterval = Say.#validateIntervalRange(...parsedInterval);
    if (!validatedInterval) return description.interval;

    const intervalInSeconds = Say.#convertToSeconds(...parsedInterval);

    const validatedSeconds = Say.#validateIntervalRange(intervalInSeconds);
    if (!validatedSeconds) return description.interval;


    const newTask = new Task(
      taskName,
      intervalInSeconds,
      channel.toLowerCase(),
      request.join(" ")
    );

    return Tasks.createTask(newTask);
  }


  /**
  * Changes the state of a task having a specified task name.
  * @param {Array<string>} request List containing task name and its
  * corresponding atrributes to be modified.
  */
  static #modifyTask(request) {
    const [taskName] = request.splice(0, 1);

    if (request.length === 1 && ["remove", "delete"].includes(request[0])) {
      return Tasks.deleteTask(taskName);
    }

    const attribute = request[0];
    const isValidAttribute = Say.#checkAttributeKeys(attribute);
    if (request.length === 1 || !isValidAttribute) return description.modify;

    const [modifyType] = request.splice(0, 1);

    const isTaskAtribute = Say.#checkAttributeValue(modifyType, request[0]);
    if (!isTaskAtribute) {
      switch (modifyType) {
        case "say":
          return description.message;
        case "every":
          return description.interval;
        case "on":
          return description.channel;
        case "named":
          return description["task-name"];
      }
    }

    let intervalInSeconds;
    if (modifyType === "every") {
      const parsedInterval = Say.#parseInterval(request[0]);

      const validatedInterval = Say.#validateIntervalRange(...parsedInterval);
      if (!validatedInterval) return "Please enter a valid interval.";

      intervalInSeconds = Say.#convertToSeconds(...parsedInterval);
      const validatedSeconds = Say.#validateIntervalRange(intervalInSeconds);
      if (!validatedSeconds) return "Please enter a valid interval.";
    }

    const newTask = new Task(
      (modifyType === "named") ? request[0] : null,
      (modifyType === "every") ? intervalInSeconds : null,
      (modifyType === "on") ? request[0].toLowerCase() : null,
      (modifyType === "say") ? request.join(" ") : null,
    );

    return Tasks.updateTask(taskName, newTask);
  }


  /**
   * Makes sure that the command is structured properly.
   * @param {Array<string>} message A list of words intended to be sent based
   * on the conditions in the meta data.
   * @param {Array<string>} meta The information list which specifies how the
   * message must be sent.
   * @returns {boolean} Indicates if the command is properly structured or not.
   */
  static #checkCommandStructure(message, meta) {
    if (message.length === 0) return false;
    if (meta[0] !== "every") return false;
    if (meta[meta.length - 4] !== "on") return false;
    if (meta[meta.length - 2] !== "named") return false;

    return true;
  }


  /**
   * @param {"say" | "every" | "on" | "named"} taskAttribute Task attribute that
   * contain information that dictate how a message should be sent by a
   * particular task.
   * @param {string} attributeValue The value of the task attribute to be
   * validated.
   * @returns {boolean} - Performs a regex check to validate the format of each
   * task attribute.
   */
  static #checkAttributeValue(taskAttribute, attributeValue) {
    if (taskAttribute === "say") {
      /**
      * The message length limit is enforced by twitch itself.
      * Just makes sure the message to be modified exists.
      */

      if (attributeValue.length === 0) return false;
      return true;
    }

    switch (taskAttribute) {
      case "every":
        if (!attributeValue.match(/^\d+$|^(\d+:){1,2}(\d+)$/)) {

          return false;
        }

        break;
      case "on":
        if (!attributeValue.match(/^[a-zA-Z0-9_]{4,25}$/)) {
          return false;
        }

        break;
      case "named":
        if (!attributeValue.match(/^[a-zA-Z0-9_-]{3,40}$/)) {
          return false;
        }

        break;
    }

    return true;
  }


  /**
   * Check if the passed attribute keys are valid.
   * @param {string | Array<string>} attributeKeys A attribute or arrays of
   * attributes that needs to b validated.
   */
  static #checkAttributeKeys(attributeKeys) {
    const validAttributeKeys = ["say", "every", "on", "named"];

    if (!(attributeKeys instanceof Array)) {

      if (validAttributeKeys.includes(attributeKeys)) return true;
      return false;
    }

    for (let i = 0; i < attributeKeys.length; i++) {
      if (!(validAttributeKeys.includes(attributeKeys[i]))) return false;
    }

    return true;
  }


  /**
   * Splits ':' delimited string interval to it's respective units of time.
   * @param {string} interval
   * - Restricted combination of `hours`, `minutes` and `seconds` time units
   * delimited with a `: ` (colon) in a specific order.
   * - The formats are allowed to arranged in any of the following order:
   *    - `h: m: s`
   *    - `m: s`
   *    - `s`
   *
   * ```js
  * const inSeconds = parseInterval("24:00:00"); // In h:m:s format
   *
   * // OR
   *
   * const inSeconds = parseInterval("60:00"); // In m:s format
   * ```
   * @returns {[seconds: number, minutes: number, hours: number]} Returns a list
   * of parsed units time.
   */
  static #parseInterval(interval) {
    const timeParts = interval.split(":")
      .map(timePart => parseInt(timePart)); // Format: HH:MM:SS

    return timeParts.reverse(); // Reverseed format: HH:MM:SS -> SS:MM:HH
  }


  /**
   * Checks if the range of the interval is valid in accordance to javascript.
   * @param {number} seconds
   * @param {number} [minutes]
   * @param {number} [hours]
   */
  static #validateIntervalRange(seconds, minutes = null, hours = null) {
    // Negative time parts are handled by regex.
    if (!seconds && seconds !== 0) { // Number 0 can be falsy.
      throw new Error("parameter 'seconds' is not defined");
    }

    if (hours || hours === 0) {
      if (!minutes && minutes !== 0) {
        throw new Error("parameter 'minutes' is not defined");
      }
      if (hours === 0 && minutes === 0 && seconds === 0) {
        return false;
      }
    }

    const epox = (new Date()).getTime();

    const stringifySeconds = (new Date(epox + seconds)).toString();
    if (stringifySeconds === "Invalid Date") {
      return false;
    }

    if (minutes) {
      minutes *= 60;
      const stringifyMinutes = (new Date(epox + minutes)).toString();
      if (stringifyMinutes === "Invalid Date") {
        return false;
      }
    }

    if (hours) {
      hours *= (60 * 60);
      const stringifyHours = (new Date(epox + hours)).toString();
      if (stringifyHours === "Invalid Date") {
        return false;
      }
    }

    return true;
  }


  /**
   * Converts each respective time unit to seconds.
   * @extends
   * @param {number} seconds
   * @param {number} [minutes]
   * @param {number} [hours]
   */
  static #convertToSeconds(seconds, minutes = null, hours = null) {
    if (!seconds) {
      if (seconds !== 0) { // As 0 is Falsy.
        throw new ReferenceError("seconds should be defined.");
      }
    }

    if (minutes) { seconds += (minutes * 60); }
    if (hours) { seconds += (hours * 60 * 60); }

    return seconds;
  }
}


module.exports = Say;
