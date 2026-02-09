export const VN_LOCALE = 'vi-VN';
export const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

type DateInput = string | number | Date;

function toValidDate(value: DateInput) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function getVnParts(value: DateInput) {
  const date = toValidDate(value);
  if (!date) return null;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map = new Map(parts.map((part) => [part.type, part.value]));
  const year = map.get('year');
  const month = map.get('month');
  const day = map.get('day');
  const hour = map.get('hour');
  const minute = map.get('minute');
  const second = map.get('second');

  if (!year || !month || !day || !hour || !minute || !second) return null;
  return { year, month, day, hour, minute, second };
}

export function formatDateTimeVN(
  value: DateInput,
  options?: Intl.DateTimeFormatOptions
) {
  const date = toValidDate(value);
  if (!date) return '';
  return date.toLocaleString(VN_LOCALE, {
    timeZone: VN_TIMEZONE,
    ...(options || {}),
  });
}

export function formatDateVN(
  value: DateInput,
  options?: Intl.DateTimeFormatOptions
) {
  const date = toValidDate(value);
  if (!date) return '';
  return date.toLocaleDateString(VN_LOCALE, {
    timeZone: VN_TIMEZONE,
    ...(options || {}),
  });
}

export function formatTimeVN(
  value: DateInput,
  options?: Intl.DateTimeFormatOptions
) {
  const date = toValidDate(value);
  if (!date) return '';
  return date.toLocaleTimeString(VN_LOCALE, {
    timeZone: VN_TIMEZONE,
    ...(options || {}),
  });
}

export function toVietnamDateInputValue(value: DateInput = new Date()) {
  const parts = getVnParts(value);
  if (!parts) return '';
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function toVietnamDateTimeInputValue(value: DateInput) {
  const parts = getVnParts(value);
  if (!parts) return '';
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

