import { Transform } from 'class-transformer';

function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

export function ToNumberArray() {
  return Transform(({ value }) => {
    if (isEmptyValue(value)) {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value.map(Number);
    }

    return [Number(value)];
  });
}

export function ToStringArray() {
  return Transform(({ value }) => {
    if (isEmptyValue(value)) {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value;
    }

    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  });
}

export function ToBoolean() {
  return Transform(({ value }) => {
    if (isEmptyValue(value)) {
      return undefined;
    }

    if (value === true || value === 'true') {
      return true;
    }

    if (value === false || value === 'false') {
      return false;
    }

    return value;
  });
}
