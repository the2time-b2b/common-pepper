import {
  TaskStructure,
  CommandAttributes,
  CommandAttributeValue,
  RawInterval,
  ParsedInterval
} from "./types";


/**
 * Makes sure that the command is structured properly.
 * @param attributes A list of words intended to be sent based on the conditions
 * in the meta data.
 * @returns Indicates if the command is properly structured or not.
 */
export function checkAttributeStructure(
  attributes: Array<string>
): attributes is TaskStructure {
  const createTaskKeyValueLength = [4, 6];
  if (!createTaskKeyValueLength.includes((attributes.length))) return false;

  if (attributes[0] !== CommandAttributes.interval) return false;
  if (attributes[2] !== CommandAttributes.channel) {
    if (attributes[2] !== CommandAttributes.name) return false;
    if (attributes[4] || attributes[5]) return false;
    return true;
  }
  if (attributes[4] !== CommandAttributes.name) return false;

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
  const commandAttributeValues = Object.values(CommandAttributes);
  for (const commandAttribute of commandAttributeValues) {
    if (commandAttribute === attribute) return true;
  }

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
 * Splits ':' delimited string interval to it's respective units of time.
 * @param interval
 * @returns Returns a list of parsed units time.
 */
export function parseInterval(interval: RawInterval): ParsedInterval {
  const timeParts = interval.split(":");

  let parsedInterval: ParsedInterval;
  if (timeParts.length === 1) {
    parsedInterval = [parseInt(timeParts[0]), 0, 0];
  }
  else if (timeParts.length === 2) {
    parsedInterval = [parseInt(timeParts[1]), parseInt(timeParts[0]), 0];
  }
  else {
    parsedInterval = [
      parseInt(timeParts[2]), parseInt(timeParts[1]), parseInt(timeParts[0])
    ];
  }
  return parsedInterval;
}

