import { useState, useEffect, useRef, useCallback } from 'react';
import { formatTime } from '../utils/time';
import { playSoftNotificationSound } from '../utils/sound';

export function useCountdownTimer(initialDurationMinutes = 25) {
  const [durationMinutes, setDurationMinutes] = useState(initialDurationMinutes);
  const [remainingMs, setRemainingMs] = useState(initialDurationMinutes * 60 * 1000);
  const [isRunning, setIsRunning] = useState(false);

  // References for driftless timestamp-based calculation
  const targetEndTimeRef = useRef(null);
  const intervalRef = useRef(null);

  // Clear running timers
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Set new duration in total minutes
  const setDuration = useCallback((minutes) => {
    const validMinutes = Math.max(1, Math.min(9999, Number(minutes) || 1));
    setDurationMinutes(validMinutes);
    clearTimer();
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setRemainingMs(validMinutes * 60 * 1000);
  }, [clearTimer]);

  // Set custom duration from hours and minutes
  const setCustomDuration = useCallback((hours, minutes) => {
    const h = Math.max(0, Math.min(99, Number(hours) || 0));
    const m = Math.max(0, Math.min(59, Number(minutes) || 0));
    const totalMinutes = h * 60 + m;
    const validMinutes = Math.max(1, totalMinutes);
    setDuration(validMinutes);
  }, [setDuration]);

  // Start timer
  const start = useCallback(() => {
    if (isRunning) return; // Prevent duplicate timers
    if (remainingMs <= 0) {
      targetEndTimeRef.current = Date.now() + durationMinutes * 60 * 1000;
      setRemainingMs(durationMinutes * 60 * 1000);
    } else {
      targetEndTimeRef.current = Date.now() + remainingMs;
    }
    setIsRunning(true);
  }, [isRunning, remainingMs, durationMinutes]);

  // Pause timer
  const pause = useCallback(() => {
    if (!isRunning) return;
    clearTimer();
    setIsRunning(false);
    if (targetEndTimeRef.current) {
      const remaining = Math.max(0, targetEndTimeRef.current - Date.now());
      setRemainingMs(remaining);
      targetEndTimeRef.current = null;
    }
  }, [isRunning, clearTimer]);

  // Toggle Start / Pause
  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  // Reset timer
  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setRemainingMs(durationMinutes * 60 * 1000);
  }, [clearTimer, durationMinutes]);

  // Timer tick loop
  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    const tick = () => {
      if (!targetEndTimeRef.current) return;
      const now = Date.now();
      const diff = targetEndTimeRef.current - now;

      if (diff <= 0) {
        setRemainingMs(0);
        setIsRunning(false);
        clearTimer();
        targetEndTimeRef.current = null;
        playSoftNotificationSound();
      } else {
        setRemainingMs(diff);
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 100);

    return () => {
      clearTimer();
    };
  }, [isRunning, clearTimer]);

  const timeData = formatTime(remainingMs, false);

  const durationHours = Math.floor(durationMinutes / 60);
  const durationRemainingMinutes = durationMinutes % 60;

  return {
    ...timeData,
    remainingMs,
    durationMinutes,
    durationHours,
    durationRemainingMinutes,
    isRunning,
    isComplete: remainingMs <= 0,
    start,
    pause,
    toggle,
    reset,
    setDuration,
    setCustomDuration,
  };
}
