export function getRequiredString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getOptionalString(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getRequiredInt(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  return value;
}

export function getOptionalInt(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isInteger(value)) return undefined;
  return value;
}

export function isValidIsoDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}
