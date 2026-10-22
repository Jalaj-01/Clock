import { useState, useEffect, useRef, useCallback } from 'react';
import { formatTime } from '../utils/time';

export function useWorkTimer(initialState = {}) {
  // state: 'idle' | 'working' | 'break'
  const [status, setStatus] = useState('idle');
  const [cumulativeWorkMs, setCumulativeWorkMs] = useState(
    initialState.cumulativeWorkMs || 0
  );
  const [displayMs, setDisplayMs] = useState(
    initialState.cumulativeWorkMs || 0
  );

  const workSessionStartRef = useRef(null);
  const breakStartRef = useRef(null);
  const intervalRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start the first active work session
  const start = useCallback(() => {
    if (status !== 'idle') return;
    workSessionStartRef.current = Date.now();
    breakStartRef.current = null;
    setStatus('working');
  }, [status]);

  // Pause active work and automatically begin measuring break time
  const pause = useCallback(() => {
    if (status !== 'working') return;
    const now = Date.now();
    let newCumulative = cumulativeWorkMs;
    if (workSessionStartRef.current) {
      newCumulative += Math.max(0, now - workSessionStartRef.current);
      workSessionStartRef.current = null;
    }
    setCumulativeWorkMs(newCumulative);
    breakStartRef.current = now;
    setStatus('break');
    setDisplayMs(0); // Immediately start break display at 00:00:00
  }, [status, cumulativeWorkMs]);

  // Resume active work and conclude the break
  const resume = useCallback(() => {
    if (status !== 'break') return;
    breakStartRef.current = null;
    workSessionStartRef.current = Date.now();
    setStatus('working');
    setDisplayMs(cumulativeWorkMs);
  }, [status, cumulativeWorkMs]);

  // Reset all counters to zero
  const reset = useCallback(() => {
    clearTimer();
    workSessionStartRef.current = null;
    breakStartRef.current = null;
    setCumulativeWorkMs(0);
    setDisplayMs(0);
    setStatus('idle');
  }, [clearTimer]);

  // Restore cumulative work time from saved state (remains idle)
  const restoreCumulativeWork = useCallback((savedMs) => {
    clearTimer();
    workSessionStartRef.current = null;
    breakStartRef.current = null;
    const val = Number(savedMs) || 0;
    setCumulativeWorkMs(val);
    setDisplayMs(val);
    setStatus('idle');
  }, [clearTimer]);

  // Tick loop
  useEffect(() => {
    clearTimer();

    if (status === 'working') {
      const tickWork = () => {
        if (!workSessionStartRef.current) return;
        const currentSession = Math.max(0, Date.now() - workSessionStartRef.current);
        setDisplayMs(cumulativeWorkMs + currentSession);
      };
      tickWork();
      intervalRef.current = setInterval(tickWork, 100);
    } else if (status === 'break') {
      const tickBreak = () => {
        if (!breakStartRef.current) return;
        const currentBreak = Math.max(0, Date.now() - breakStartRef.current);
        setDisplayMs(currentBreak);
      };
      tickBreak();
      intervalRef.current = setInterval(tickBreak, 100);
    } else {
      // idle
      setDisplayMs(cumulativeWorkMs);
    }

    return () => {
      clearTimer();
    };
  }, [status, cumulativeWorkMs, clearTimer]);

  // Format time with 6 digits (forceHours = true for HH:MM:SS)
  const timeData = formatTime(displayMs, true);

  return {
    ...timeData,
    status, // 'idle' | 'working' | 'break'
    cumulativeWorkMs,
    displayMs,
    start,
    pause,
    resume,
    reset,
    restoreCumulativeWork,
  };
}
