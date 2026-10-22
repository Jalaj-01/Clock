/**
 * Formats milliseconds into { hours, minutes, seconds, ampm, displayStr, digits }
 * @param {number} totalMs 
 * @param {boolean} forceHours 
 * @param {boolean} is12Hour 
 */
export function formatTime(totalMs, forceHours = true, is12Hour = false) {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  let hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let ampm = '';
  if (is12Hour) {
    ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
  }

  const pad = (n) => String(n).padStart(2, '0');

  const hh = pad(hours);
  const mm = pad(minutes);
  const ss = pad(seconds);

  const showHours = forceHours || hours > 0;

  return {
    hours,
    minutes,
    seconds,
    ampm,
    is12Hour,
    showHours,
    h1: hh[0],
    h2: hh[1],
    m1: mm[0],
    m2: mm[1],
    s1: ss[0],
    s2: ss[1],
    formatted: `${hh}:${mm}`,
    fullFormatted: `${hh}:${mm}:${ss}`,
  };
}

/**
 * Gets current localized Day and Date info
 */
export function getCurrentDateInfo() {
  const now = new Date();
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const day = dayNames[now.getDay()];
  const month = monthNames[now.getMonth()];
  const date = now.getDate();
  const year = now.getFullYear();

  return {
    day,
    month,
    date,
    year,
    formatted: `${day}, ${date} ${month}`, // e.g. "THU, 22 OCT"
    fullDay: now.toLocaleDateString(undefined, { weekday: 'short' }),
    fullDate: now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  };
}

/**
 * Parses minutes string into milliseconds
 */
export function minutesToMs(minutes) {
  return Math.max(0, Math.round(Number(minutes) * 60 * 1000));
}

/**
 * Parses hours and minutes into milliseconds
 */
export function timeComponentsToMs(hours = 0, minutes = 0) {
  const h = Math.max(0, Math.min(99, Number(hours) || 0));
  const m = Math.max(0, Math.min(59, Number(minutes) || 0));
  return (h * 3600 + m * 60) * 1000;
}
