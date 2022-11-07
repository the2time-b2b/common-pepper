import {
  CreateTaskStructure, TaskAttributes, RawInterval, ParsedInterval
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
  if (attributes[0] !== TaskAttributes.Interval) return false;
  if (attributes[2] !== TaskAttributes.Channel) return false;
  if (attributes[4] !== TaskAttributes.TaskName) return false;

  return true;
}


/**
 * Check if a attribute supllied to be modified is correct.
 * @param attribute Attribute to be modified from an existing task.
 */
export function validateModifyAttribute(
  attribute: string
): attribute is TaskAttributes {
  if (Object.keys(TaskAttributes).includes(attribute)) return true;

  return false;
}


/**
 * Check if the interval conforms to a defined structure delimted by `:`.
 * @param interval
 * @description
 * - Restricted combination of `hours`, `minutes` and `seconds` time units
 * delimited with a `: ` (colon) in a specific order.
 * - The formats are allowed to arranged in any of the following order:
 *    - `h: m: s`
 *    - `m: s`
 *    - `s`
 */
export function checkInterval(interval: string): interval is RawInterval {
  if (interval.match(/^\d+$|^(\d+:){1,2}(\d+)$/)) return true;
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


/**
 * Splits ':' delimited string interval to it's respective units of time.
 * @param interval
 * @returns Returns a list of parsed units time.
 */
export function parseInterval(interval: RawInterval): ParsedInterval {
  const timeParts = interval.split(":");

  if (timeParts.length > 0 || timeParts.length < 4)
    throw new Error("Time parts of an interval cannot be more than 3.");


  let parsedInterval: ParsedInterval;
  if (timeParts.length === 1) {
    parsedInterval = [parseInt(timeParts[0]), null, null];
  }
  if (timeParts.length === 2) {
    parsedInterval = [parseInt(timeParts[0]), parseInt(timeParts[1]), null];
  }
  else {
    parsedInterval = [
      parseInt(timeParts[0]), parseInt(timeParts[1]), parseInt(timeParts[2])
    ];
  }
  return parsedInterval;
}


/** Converts each respective time unit to seconds. */
export function convertToSeconds(
  seconds: number, minutes: number | null, hours: number | null
): number {
  if (minutes) { seconds += (minutes * 60); }
  if (hours) { seconds += (hours * 60 * 60); }

  return seconds;
}


/** Checks if the range of the interval is valid in accordance to javascript. */
export function validateInterval(interval: ParsedInterval): boolean {
  // Negative time parts are handled by regex.
  const [seconds, minutes, hours] = interval;
  const intervalInSeconds = convertToSeconds(seconds, minutes, hours);
  const maxPositiveSigned32bit: number = Math.pow(2, 31) - 1;

  if (intervalInSeconds === 0) return false;
  if (intervalInSeconds > maxPositiveSigned32bit) return false;

  return true;
}
