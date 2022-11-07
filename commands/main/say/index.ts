import { Say, TaskAttributes } from "./types";
import * as service from "./service";
const Task = require("./task");
const Tasks = require("./tasks");

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
    const TaskAttributesLength = Object.values(TaskAttributes).length * 2;

    // Task message argument does not have a key in a create task request.
    if (request.length < TaskAttributesLength - 1) return description.usage;

    // Remove task message argument from the request.
    const attributesLength = TaskAttributesLength - 2;
    const attributes = request.splice(request.length - attributesLength);

    if (!service.checkAttributeStructure(attributes)) return description.usage;

    const message = request.join(" ");
    const interval = attributes[1];
    const channel = attributes[3].toLowerCase();
    const taskName = attributes[5].toLowerCase();

    const checkInterval = service.checkInterval(interval);
    if (!checkInterval) return description.interval;

    const checkChannelName = service.checkChannelName(channel);
    if (!checkChannelName) return description.channel;

    const checkTaskName = service.checkTaskName(taskName);
    if (!checkTaskName) return description["task-name"];

    const parsedInterval = service.parseInterval(interval);
    const validatedInterval = service.validateInterval(parsedInterval);
    if (!validatedInterval) return description.interval;

    const [seconds, minutes, hours] = parsedInterval;
    const intervalInSeconds = service.convertToSeconds(seconds, minutes, hours);

    const newTask = new Task(taskName, intervalInSeconds, channel, message);

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

    if (attribute === TaskAttributes.Message) {
      if (request.length === 0) return description.message;
    }

    let intervalInSeconds: number | null = null;
    if (attribute === TaskAttributes.Interval) {
      if (!service.checkInterval(modifiedValue)) return description.interval;

      const parsedInterval = service.parseInterval(modifiedValue);
      const validatedInterval = service.validateInterval(parsedInterval);
      if (!validatedInterval) return description.interval;

      const [seconds, minutes, hours] = parsedInterval;
      intervalInSeconds = service.convertToSeconds(seconds, minutes, hours);
    }

    if (attribute === TaskAttributes.Channel) {
      if (!service.checkChannelName(modifiedValue))
        return description.channel;
    }

    if (attribute === TaskAttributes.TaskName) {
      if (!service.checkTaskName(modifiedValue))
        return description["task-name"];
    }

    const newTask = new Task(
      (attribute === TaskAttributes.TaskName) ? modifiedValue : null,
      (attribute === TaskAttributes.Interval) ? intervalInSeconds : null,
      (attribute === TaskAttributes.Channel) ? modifiedValue : null,
      (attribute === TaskAttributes.Message) ? modifiedValue : null
    );

    return Tasks.updateTask(taskName, newTask);
  }
};


export default say;
