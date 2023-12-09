import {
  CreateTaskStructure,
  CommandAttributes,
  CommandAttributeValue,
} from "./types";


/**
 * Makes sure that the command is structured properly.
 * @param attributes A list of words intended to be sent based on the conditions
 * in the meta data.
 * @returns Indicates if the command is properly structured or not.
 */
export function checkAttributeStructure(
  attributes: Array<string>
): attributes is CreateTaskStructure {
  const createTaskKeys = Object.keys(CommandAttributes).filter(attr => {
    return attr !== "message";
  });
  const createTaskKeyValueLength = createTaskKeys.length * 2;
  if (attributes.length !== createTaskKeyValueLength) return false;

  if (attributes[0] !== CommandAttributes.interval) return false;
  if (attributes[2] !== CommandAttributes.channel) return false;
  if (attributes[4] !== CommandAttributes.taskName) return false;

  return true;
}


/**
 * Check if a attribute supplied to be modified is correct.
 * @param attribute Attribute to be modified from an existing task.
 */
export function validateModifyAttribute(
  attribute: string
): attribute is CommandAttributeValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commandAttributeValues = Object.values(CommandAttributes) as any;
  if ((commandAttributeValues).includes(attribute)) return true;

  return false;
}




/**
 * Checks if channel username conforms to Twitch's basic username requirments.
 * @param channel Username of the Twitch channel.
 */
export function checkChannelName(channel: string): boolean {
  if (channel.match(/^[a-zA-Z0-9_]{4,25}$/)) return true;
  return false;
}


/**
 * Check if the task name has required length and characters.
 * @param taskName Name of the task.
 */
export function checkTaskName(taskName: string): boolean {
  if (taskName.match(/^[a-zA-Z0-9_-]{3,40}$/)) return true;
  return false;
}

