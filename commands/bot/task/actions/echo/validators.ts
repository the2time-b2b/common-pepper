import { EchoSchema, EchoArgs } from "../types";
import { AtLeastOne } from "../../../../../utils/types";
import hasProperty from "../../../../../utils/property-assert";


export function isEcho(row: unknown): row is EchoSchema {
  return (
    isEchoable(row) && hasProperty(row, "id") && typeof row.id === "number"
  );
}

export function isEchoable(row: unknown): row is EchoArgs {
  return (
    typeof row === "object" && row !== null &&
    hasProperty(row, "channel") && typeof row.channel === "string" &&
    hasProperty(row, "message") && typeof row.message === "string"
  );
}


export function EchoUpdatable(
  object: unknown
): object is AtLeastOne<EchoArgs> {
  return (
    typeof object === "object" && object !== null && !("id" in object) &&
    (
      (hasProperty(object, "channel") && typeof object.channel === "string") ||
      (hasProperty(object, "message") && typeof object.message === "string")
    )
  );
}
