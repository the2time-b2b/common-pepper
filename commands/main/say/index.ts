import { Say, CommandAttributes } from "./types";
import * as service from "./service";
import Task from "../../bot/task";
import Trigger from "../../bot/task/triggers";
import Action from "../../bot/task/actions";

import description from "./description";
import { ProcessError } from "../../../utils/error";


const say: Say = {
  exec(_context, request, channel): string {
    if (!channel) throw Error("request origin should be speicifed.");
    if (request.length === 0) return description.usage;


    const task = new Task();
    if (request.join(" ") === "clear task list") {
      task.clear();
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

    const parsedInterval = service.parseInterval(interval);

    const [seconds, minutes, hours] = parsedInterval;



    const trigger: Trigger<"repeat"> = {
      type: "repeat",
      value: { hours, minutes, seconds }
    };
    const action: Action<"echo"> = {
      type: "echo",
      value: { channel: (targetChannel) ? targetChannel : channel, message }
    };
    try {
      task.create(taskName, trigger, action);
    }
    catch (error) {
      if (error instanceof ProcessError && error.options.toUser.status) {
        return error.message;
      }

      throw error;
    }

    return `Task ${taskName} successfully created.`;
  },


  modifyTask(request) {
    const [taskName] = request.splice(0, 1);
    if (request.length === 0) return description.modify;

    const task = new Task();

    if (request.length === 1 && ["remove", "delete"].includes(request[0])) {
      task.remove(taskName);

      return `Task '${taskName}' successfully removed.`;
    }

    const [attribute] = request.splice(0, 1);

    const isValidAttribute = service.validateModifyAttribute(attribute);
    if (!isValidAttribute) return description.modify;

    const modifiedValue = request.join(" ").toLowerCase();

    if (attribute === CommandAttributes.message) {
      if (request.length === 0) return description.message;

      task.updateAction(taskName, { message: modifiedValue });
    }
    else if (attribute === CommandAttributes.channel) {
      task.updateAction(taskName, { channel: modifiedValue });
    }
    else if (attribute === CommandAttributes.interval) {
      if (!service.checkInterval(modifiedValue)) return description.interval;

      const parsedInterval = service.parseInterval(modifiedValue);

      const [seconds, minutes, hours] = parsedInterval;

      task.updateTrigger(taskName, { hours, minutes, seconds });
    }
    else if (attribute === CommandAttributes.name) {
      task.updateName(modifiedValue);
    }
    else {
      throw new Error("No attributes specified to modify.");
    }

    return `Task ${taskName} updated successfully.`;
  }
};


export default say;

