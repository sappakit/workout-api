export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getRequiredString(
  object: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const value = object[key];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${context} has invalid "${key}".`);
  }

  return value.trim();
}

export function getNullableString(
  value: unknown,
  fieldName: string,
  context: string,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`${context} has invalid "${fieldName}".`);
  }

  const normalizedValue = value.trim();

  return normalizedValue || null;
}

export function getOptionalString(
  value: unknown,
  fieldName: string,
  context: string,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(`${context} has invalid "${fieldName}".`);
  }

  const normalizedValue = value.trim();

  return normalizedValue || undefined;
}
