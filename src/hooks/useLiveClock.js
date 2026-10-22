import { useState, useEffect } from 'react';
import { formatTime, getCurrentDateInfo } from '../utils/time';

export function useLiveClock(is12Hour = false) {
  const [timeData, setTimeData] = useState(() => {
    const now = new Date();
    const msSinceMidnight =
      (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) * 1000 +
      now.getMilliseconds();
    return {
      ...formatTime(msSinceMidnight, true, is12Hour),
      dateInfo: getCurrentDateInfo(),
    };
  });

  useEffect(() => {
    let timeoutId = null;

    const syncTick = () => {
      const now = new Date();
      const ms =
        (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) * 1000;
      setTimeData({
        ...formatTime(ms, true, is12Hour),
        dateInfo: getCurrentDateInfo(),
      });

      // Calculate exact ms until next whole second to eliminate clock drift
      const msUntilNextSecond = 1000 - now.getMilliseconds();
      timeoutId = setTimeout(syncTick, Math.max(10, msUntilNextSecond));
    };

    syncTick();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [is12Hour]);

  return timeData;
}
