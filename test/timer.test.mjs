function formatTime(totalMs, forceHours = true, is12Hour = false) {
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('Running updated timing and 12-hour unit tests...');

// Test 1: 12-hour format at 18:56 (6:56 PM)
{
  const ms = (18 * 3600 + 56 * 60 + 26) * 1000;
  const t = formatTime(ms, true, true);
  assert(t.formatted === '06:56', `Expected 06:56, got ${t.formatted}`);
  assert(t.ampm === 'PM', `Expected PM, got ${t.ampm}`);
  assert(t.h1 === '0' && t.h2 === '6', 'Hours should be 06');
  assert(t.m1 === '5' && t.m2 === '6', 'Minutes should be 56');
}

// Test 2: 12-hour format at midnight 00:15 (12:15 AM)
{
  const ms = (0 * 3600 + 15 * 60) * 1000;
  const t = formatTime(ms, true, true);
  assert(t.formatted === '12:15', `Expected 12:15, got ${t.formatted}`);
  assert(t.ampm === 'AM', `Expected AM, got ${t.ampm}`);
}

// Test 3: 12-hour format at noon 12:00 (12:00 PM)
{
  const ms = (12 * 3600) * 1000;
  const t = formatTime(ms, true, true);
  assert(t.formatted === '12:00', `Expected 12:00, got ${t.formatted}`);
  assert(t.ampm === 'PM', `Expected PM, got ${t.ampm}`);
}

// Test 4: 24-hour format at 18:56
{
  const ms = (18 * 3600 + 56 * 60 + 26) * 1000;
  const t = formatTime(ms, true, false);
  assert(t.formatted === '18:56', `Expected 18:56, got ${t.formatted}`);
  assert(t.ampm === '', 'AM/PM should be empty in 24h mode');
}

console.log('✓ All 12-hour and HH:MM formatting tests passed!');
