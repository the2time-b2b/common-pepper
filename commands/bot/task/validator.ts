import hasProperty from "../../../utils/property-assert";


export function hasID(row: unknown): row is { id: number } {
  return (
    typeof row === "object" && row !== null &&
    hasProperty(row, "id") && typeof row.id === "number"
  );
}

