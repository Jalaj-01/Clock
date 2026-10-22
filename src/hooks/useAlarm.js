import { useState, useEffect, useRef, useCallback } from 'react';
import { startAlarmSound, stopAlarmSound } from '../utils/sound';

export function useAlarm(is12Hour = true) {
  // Alarm target time (hours 0-23, minutes 0-59)
  const [alarmHours, setAlarmHours] = useState(8);
  const [alarmMinutes, setAlarmMinutes] = useState(0);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [snoozeUntil, setSnoozeUntil] = useState(null);
  const lastTriggeredDateRef = useRef(null);

  // Check alarm condition on every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();

      // Check snooze
      if (snoozeUntil && Date.now() >= snoozeUntil) {
        setSnoozeUntil(null);
        setIsRinging(true);
        startAlarmSound();
        if (window.electronAPI && window.electronAPI.showWindow) {
          window.electronAPI.showWindow();
        }
        return;
      }

      if (!isEnabled) return;

      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const currentS = now.getSeconds();
      const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

      // Check standard alarm time (triggers at second 0)
      if (
        currentH === alarmHours &&
        currentM === alarmMinutes &&
        currentS === 0 &&
        lastTriggeredDateRef.current !== todayStr
      ) {
        lastTriggeredDateRef.current = todayStr;
        setIsRinging(true);
        startAlarmSound();
        if (window.electronAPI && window.electronAPI.showWindow) {
          window.electronAPI.showWindow();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isEnabled, alarmHours, alarmMinutes, snoozeUntil]);

  const toggleEnabled = useCallback(() => {
    setIsEnabled((prev) => {
      const next = !prev;
      if (!next) {
        setSnoozeUntil(null);
        if (isRinging) {
          setIsRinging(false);
          stopAlarmSound();
        }
      }
      return next;
    });
  }, [isRinging]);

  const setTime = useCallback((h, m) => {
    const validH = Math.max(0, Math.min(23, Number(h) || 0));
    const validM = Math.max(0, Math.min(59, Number(m) || 0));
    setAlarmHours(validH);
    setAlarmMinutes(validM);
    lastTriggeredDateRef.current = null;
  }, []);

  const adjustHours = useCallback((delta) => {
    setAlarmHours((prev) => {
      let next = (prev + delta) % 24;
      if (next < 0) next += 24;
      return next;
    });
    lastTriggeredDateRef.current = null;
  }, []);

  const adjustMinutes = useCallback((delta) => {
    setAlarmMinutes((prev) => {
      let next = (prev + delta) % 60;
      if (next < 0) next += 60;
      return next;
    });
    lastTriggeredDateRef.current = null;
  }, []);

  const quickSetIn = useCallback((minutes) => {
    const now = new Date();
    const future = new Date(now.getTime() + minutes * 60 * 1000);
    setAlarmHours(future.getHours());
    setAlarmMinutes(future.getMinutes());
    setIsEnabled(true);
    setSnoozeUntil(null);
    lastTriggeredDateRef.current = null;
  }, []);

  const dismiss = useCallback(() => {
    setIsRinging(false);
    stopAlarmSound();
    setSnoozeUntil(null);
  }, []);

  const snooze = useCallback((minutes = 5) => {
    setIsRinging(false);
    stopAlarmSound();
    setSnoozeUntil(Date.now() + minutes * 60 * 1000);
  }, []);

  // Format digits for FlipClock display
  let displayHours = alarmHours;
  let ampm = '';
  if (is12Hour) {
    ampm = alarmHours >= 12 ? 'PM' : 'AM';
    displayHours = alarmHours % 12;
    if (displayHours === 0) displayHours = 12;
  }
  const pad = (n) => String(n).padStart(2, '0');
  const hh = pad(displayHours);
  const mm = pad(alarmMinutes);

  // Time remaining string calculation
  const getTimeRemainingStr = () => {
    if (!isEnabled && !snoozeUntil) return 'Alarm is OFF';
    if (snoozeUntil) {
      const diffSec = Math.max(0, Math.round((snoozeUntil - Date.now()) / 1000));
      const m = Math.floor(diffSec / 60);
      const s = diffSec % 60;
      return `Snooze: ${m}m ${s}s`;
    }
    const now = new Date();
    const target = new Date();
    target.setHours(alarmHours, alarmMinutes, 0, 0);
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    const diffMs = target - now;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMinutes = Math.floor((diffMs % 3600000) / 60000);
    if (diffHours === 0) {
      return `Rings in ${diffMinutes}m`;
    }
    return `Rings in ${diffHours}h ${diffMinutes}m`;
  };

  return {
    alarmHours,
    alarmMinutes,
    isEnabled,
    isRinging,
    snoozeUntil,
    toggleEnabled,
    setIsEnabled,
    setTime,
    adjustHours,
    adjustMinutes,
    quickSetIn,
    dismiss,
    snooze,
    timeRemainingStr: getTimeRemainingStr(),
    formattedAlarmTime: `${hh}:${mm}${ampm ? ' ' + ampm : ''}`,
    display: {
      h1: hh[0],
      h2: hh[1],
      m1: mm[0],
      m2: mm[1],
      s1: '0',
      s2: '0',
      ampm,
    },
  };
}
