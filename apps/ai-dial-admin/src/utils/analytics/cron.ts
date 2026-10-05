const CRON_FIELD_COUNT = 6;

const MONTH_NAMES = 'JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC';
const DAY_NAMES = 'SUN|MON|TUE|WED|THU|FRI|SAT';

// One cron term: a wildcard, a number, a name, or a range of either, optionally followed by a step.
const TERM = `(?:\\*|\\?|\\d{1,4}|${MONTH_NAMES}|${DAY_NAMES})(?:-(?:\\d{1,4}|${MONTH_NAMES}|${DAY_NAMES}))?(?:\\/\\d{1,4})?`;

// A field is a comma-separated list of terms; `L` and `W` (last / nearest weekday) are accepted whole.
const CRON_FIELD_PATTERN = new RegExp(`^(?:${TERM})(?:,(?:${TERM}))*$|^(?:L|LW|\\d{1,2}W|\\d?L)$`, 'i');

export const isValidSixFieldCron = (expression: string): boolean => {
  const fields = expression.trim().split(/\s+/).filter(Boolean);

  return fields.length === CRON_FIELD_COUNT && fields.every((field) => CRON_FIELD_PATTERN.test(field));
};

// Once a minute at a fixed second — the shape of the default the service stores for an enrichment schedule
// that declares no cron, at a second it derives from the pipeline name.
const EVERY_MINUTE_PATTERN = /^[0-5]?\d \* \* \* \* \*$/;

export const isEveryMinuteCron = (expression: string): boolean => EVERY_MINUTE_PATTERN.test(expression.trim());
