import { Say, CommandAttributes } from "./types";
import * as service from "./service";
import { default as Tasks, DBTask, AtLeastOne } from "./tasks";

import description from "./description";


const say: Say = {
  exec(_context, request, channel) {
    if (!channel) throw Error("request origin should be speicifed.");
    if (request.length === 0) return description.usage;


    const tasks = new Tasks();
    if (request.join(" ") === "clear task list") {
      tasks.clearTasks();
      return "The task list has been wiped clean.";
    }

    if (request[0] === "modify") {
      const modifiedAttributes = request.splice(1);
      return this.modifyTask(modifiedAttributes);
    }

    // Ideally, each task attribute itself has an adjacent value.
    const taskAttributesLength = Object.values(CommandAttributes).length * 2;

    // Task message argument does not have a key in a create task request.
    if (request.length < taskAttributesLength - 1) return description.usage;

    // Remove task message argument from the request.
    const attributesLength = taskAttributesLength - 2;
    const attributes = request.splice(request.length - attributesLength);


    if (!service.checkAttributeStructure(attributes)) return description.usage;

    const message = request.join(" ");
    const interval = attributes[1];
    let taskName: string;
    let targetChannel: string | undefined;

    if (attributes[5]) {
      targetChannel = attributes[3].toLowerCase();
      taskName = attributes[5].toLowerCase();
    }
    else {
      taskName = attributes[3].toLowerCase();
    }

    const checkInterval = service.checkInterval(interval);
    if (!checkInterval) return description.interval;


    if (targetChannel) {
      const checkChannelName = service.checkChannelName(targetChannel);
      if (!checkChannelName) return description.channel;
    }

    const checkTaskName = service.checkTaskName(taskName);
    if (!checkTaskName) return description["task-name"];

    const parsedInterval = service.parseInterval(interval);
    const validatedInterval = service.validateInterval(parsedInterval);
    if (!validatedInterval) return description.interval;

    const [seconds, minutes, hours] = parsedInterval;
    const intervalInSeconds = service.convertToSeconds(seconds, minutes, hours);

    const newTask: DBTask = {
      "name": taskName,
      "interval": intervalInSeconds,
      "channel": (targetChannel) ? targetChannel : channel,
      "message": message
    };

    return tasks.createTask(newTask);
  },


  modifyTask(request) {
    const [taskName] = request.splice(0, 1);
    if (request.length === 0) return description.modify;

    const tasks = new Tasks();
    if (request.length === 1 && ["remove", "delete"].includes(request[0])) {
      return tasks.deleteTask(taskName);
    }

    const [attribute] = request.splice(0, 1);

    const isValidAttribute = service.validateModifyAttribute(attribute);
    if (!isValidAttribute) return description.modify;

    const modifiedValue = request.join(" ").toLowerCase();

    let modifiedTask: AtLeastOne<DBTask>;
    let intervalInSeconds: number | null = null;

    if (attribute === CommandAttributes.message) {
      if (request.length === 0) return description.message;

      modifiedTask = { message: modifiedValue };
    }
    else if (attribute === CommandAttributes.interval) {
      if (!service.checkInterval(modifiedValue)) return description.interval;

      const parsedInterval = service.parseInterval(modifiedValue);
      const validatedInterval = service.validateInterval(parsedInterval);
      if (!validatedInterval) return description.interval;

      const [seconds, minutes, hours] = parsedInterval;
      intervalInSeconds = service.convertToSeconds(seconds, minutes, hours);

      modifiedTask = { interval: intervalInSeconds };
    }
    else if (attribute === CommandAttributes.channel) {
      if (!service.checkChannelName(modifiedValue))
        return description.channel;

      modifiedTask = { channel: modifiedValue };
    }
    else if (attribute === CommandAttributes.name) {
      if (!service.checkTaskName(modifiedValue))
        return description["task-name"];

      modifiedTask = { name: modifiedValue };
    }
    else {
      throw new Error("No attributes specified to modify.");
    }

    /**
     *  Modification is done one attribute at a time.
     *  But updateTask is extensible for more than one attribute.
     *  Note: modifiedTask is a 'Partial' of type 'Task'.
     */
    return tasks.updateTask(taskName, modifiedTask);
  }
};


export default say;
