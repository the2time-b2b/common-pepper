import { Say, CommandAttributes } from "./types";
import * as service from "./service";
import { default as Tasks, Task } from "./tasks";
import Repeat from "./triggers/repeat";
import ValidationError from "../../../utils/error";

import description from "./description";


const say: Say = {
  exec(_context, request) {
    if (request.length === 0) return description.usage;

    if (request.join(" ") === "clear task list") {
      Tasks.clearTasks();
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
    const channel = attributes[3].toLowerCase();
    const taskName = attributes[5].toLowerCase();

    let repeat;
    try {
      repeat = new Repeat(interval);
    }
    catch(error) {
      if (error instanceof ValidationError) {
        return error.returnMesssage;
      }

      throw error;
    }

    const checkChannelName = service.checkChannelName(channel);
    if (!checkChannelName) return description.channel;

    const checkTaskName = service.checkTaskName(taskName);
    if (!checkTaskName) return description["task-name"];

    const newTask: Task = {
      "taskName": taskName,
      "interval": repeat.Seconds.toString(),
      "channel": channel,
      "message": message
    };

    return Tasks.createTask(newTask);
  },


  modifyTask(request) {
    const [taskName] = request.splice(0, 1);
    if (request.length === 0) return description.modify;

    if (request.length === 1 && ["remove", "delete"].includes(request[0])) {
      return Tasks.deleteTask(taskName);
    }

    const [attribute] = request.splice(0, 1);

    const isValidAttribute = service.validateModifyAttribute(attribute);
    if (!isValidAttribute) return description.modify;

    const modifiedValue = request.join(" ").toLowerCase();

    const modifiedTask: Partial<Task> = {};

    if (attribute === CommandAttributes.message) {
      if (request.length === 0) return description.message;

      modifiedTask.message = modifiedValue;
    }

    if (attribute === CommandAttributes.interval) {
      let repeat;
      try {
        repeat = new Repeat(modifiedValue);
      }
      catch (error) {
        if (error instanceof ValidationError) {
          return error.returnMesssage;
        }

        throw error;
      }


      modifiedTask.interval = repeat.Seconds.toString();
    }

    if (attribute === CommandAttributes.channel) {
      if (!service.checkChannelName(modifiedValue))
        return description.channel;

      modifiedTask.channel = modifiedValue;
    }

    if (attribute === CommandAttributes.taskName) {
      if (!service.checkTaskName(modifiedValue))
        return description["task-name"];

      modifiedTask.taskName = modifiedValue;
    }

    /**
     *  Modification is done one attribute at a time.
     *  But updateTask is extensible for more than one attribute.
     *  Note: modifiedTask is a 'Partial' of type 'Task'.
     */
    return Tasks.updateTask(taskName, modifiedTask);
  }
};


export default say;
