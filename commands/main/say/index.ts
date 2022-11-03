import { Say } from "./types";
const Task = require("./task");
const Tasks = require("./tasks");

const description = require("./description");


const say: Say = {
  exec(_context, request) {
    if (request.join(" ") === "clear task list") {
      Tasks.clearTasks();
      return "The task list has been wiped clean.";
    }
    if (request[0] === "modify") {
      const modifiedAttributes = request.splice(1);
      return this.modifyTask(modifiedAttributes);
    }

    // Seperate the bot message to be sent from it's meta conditions.
    const metaAtrributeValueLength = 6;
    const meta = request.splice(request.length - metaAtrributeValueLength);

    if (!this.checkCommandStructure(request, meta)) return description.usage;

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
    const isValidAttributeKeys = this.checkAttributeKeys(attributeKeys);
    if (!isValidAttributeKeys) return description.usage;


    for (let i = 0; i < attributeKeys.length; i++) {
      const attributeKey = attributeKeys[i];
      const attributeValue = attributeKeyValue[attributeKey];
      const isValidAttributeValue =
        this.checkAttributeValue(attributeKey, attributeValue);
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


    const parsedInterval = this.parseInterval(interval);

    const validatedInterval = this.validateIntervalRange(...parsedInterval);
    if (!validatedInterval) return description.interval;

    const intervalInSeconds = this.convertToSeconds(...parsedInterval);

    const validatedSeconds = this.validateIntervalRange(intervalInSeconds);
    if (!validatedSeconds) return description.interval;


    const newTask = new Task(
      taskName,
      intervalInSeconds,
      channel.toLowerCase(),
      request.join(" ")
    );

    return Tasks.createTask(newTask);
  },


  modifyTask(request) {
    const [taskName] = request.splice(0, 1);

    if (request.length === 1 && ["remove", "delete"].includes(request[0])) {
      return Tasks.deleteTask(taskName);
    }

    const attribute = request[0];
    const isValidAttribute = this.checkAttributeKeys(attribute);
    if (request.length === 1 || !isValidAttribute) return description.modify;

    const [modifyType] = request.splice(0, 1);

    const isTaskAtribute = this.checkAttributeValue(modifyType, request[0]);
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
      const parsedInterval = this.parseInterval(request[0]);

      const validatedInterval = this.validateIntervalRange(...parsedInterval);
      if (!validatedInterval) return "Please enter a valid interval.";

      intervalInSeconds = this.convertToSeconds(...parsedInterval);
      const validatedSeconds = this.validateIntervalRange(intervalInSeconds);
      if (!validatedSeconds) return "Please enter a valid interval.";
    }

    const newTask = new Task(
      (modifyType === "named") ? request[0] : null,
      (modifyType === "every") ? intervalInSeconds : null,
      (modifyType === "on") ? request[0].toLowerCase() : null,
      (modifyType === "say") ? request.join(" ") : null,
    );

    return Tasks.updateTask(taskName, newTask);
  },

  checkCommandStructure(message, meta) {
    if (message.length === 0) return false;
    if (meta[0] !== "every") return false;
    if (meta[meta.length - 4] !== "on") return false;
    if (meta[meta.length - 2] !== "named") return false;

    return true;
  },

  checkAttributeValue(taskAttribute, attributeValue) {
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
  },

  checkAttributeKeys(attributeKeys) {
    const validAttributeKeys = ["say", "every", "on", "named"];

    if (!(attributeKeys instanceof Array)) {

      if (validAttributeKeys.includes(attributeKeys)) return true;
      return false;
    }

    for (let i = 0; i < attributeKeys.length; i++) {
      if (!(validAttributeKeys.includes(attributeKeys[i]))) return false;
    }

    return true;
  },

  parseInterval(interval) {
    const timeParts = interval.split(":")
      .map(timePart => parseInt(timePart)); // Format: HH:MM:SS

    const [seconds, minutes, hours] = timeParts.reverse();
    return [seconds, minutes, hours]; // Reverseed format: HH:MM:SS -> SS:MM:HH
  },

  validateIntervalRange(seconds, minutes = null, hours = null) {
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
  },

  convertToSeconds(seconds, minutes = null, hours = null) {
    if (!seconds) {
      if (seconds !== 0) { // As 0 is Falsy.
        throw new ReferenceError("seconds should be defined.");
      }
    }

    if (minutes) { seconds += (minutes * 60); }
    if (hours) { seconds += (hours * 60 * 60); }

    return seconds;
  }
};


export default say;
