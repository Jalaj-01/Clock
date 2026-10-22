/**
 * Plays a clear, pleasant dual-tone chime notification repeated 3 times.
 * Louder, crisp, and distinct using Web Audio API synthesis with rich harmonics.
 */
export function playSoftNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const playTone = (frequency, startTime, duration = 0.5, volume = 0.75, type = 'sine') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, startTime);

      // Smooth envelope with quick attack and clear ring-out
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const playBellChime = (startTime) => {
      // Primary note: E5 (659.25 Hz)
      playTone(659.25, startTime, 0.42, 0.70, 'sine');
      playTone(659.25 * 2, startTime, 0.28, 0.20, 'triangle'); // gentle harmonic shimmer

      // High response note: A5 (880.00 Hz)
      playTone(880.00, startTime + 0.12, 0.58, 0.78, 'sine');
      playTone(880.00 * 2, startTime + 0.12, 0.35, 0.22, 'triangle'); // high bell overtone
    };

    const now = ctx.currentTime;
    // Repeat 3 distinct times: 0s, 0.68s, and 1.36s
    for (let i = 0; i < 3; i++) {
      playBellChime(now + i * 0.68);
    }

    // Safely close audio context after all chimes have rung out
    setTimeout(() => {
      try {
        if (ctx.state !== 'closed') {
          ctx.close();
        }
      } catch (e) {
        // ignore
      }
    }, 2500);
  } catch (err) {
    console.warn('Could not play notification sound:', err);
  }
}

let activeAlarmCtx = null;
let alarmIntervalId = null;

/**
 * Starts continuous, pleasant repeating alarm chime loop
 */
export function startAlarmSound() {
  stopAlarmSound();
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    activeAlarmCtx = new AudioContextClass();

    const ringOnce = () => {
      if (!activeAlarmCtx || activeAlarmCtx.state === 'closed') return;
      if (activeAlarmCtx.state === 'suspended') {
        activeAlarmCtx.resume();
      }
      const now = activeAlarmCtx.currentTime;

      const playTone = (freq, t, dur = 0.16, vol = 0.8) => {
        try {
          const osc = activeAlarmCtx.createOscillator();
          const gain = activeAlarmCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(vol, t + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
          osc.connect(gain);
          gain.connect(activeAlarmCtx.destination);
          osc.start(t);
          osc.stop(t + dur);
        } catch (e) {}
      };

      // 4-note ascending alarm bell pattern
      playTone(523.25, now, 0.16, 0.75);         // C5
      playTone(659.25, now + 0.14, 0.16, 0.78);  // E5
      playTone(783.99, now + 0.28, 0.18, 0.82);  // G5
      playTone(1046.5, now + 0.44, 0.32, 0.85);  // C6
    };

    ringOnce();
    alarmIntervalId = setInterval(ringOnce, 1300);
  } catch (err) {
    console.warn('Could not start alarm sound:', err);
  }
}

/**
 * Stops any actively ringing alarm
 */
export function stopAlarmSound() {
  if (alarmIntervalId) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
  if (activeAlarmCtx) {
    try {
      if (activeAlarmCtx.state !== 'closed') {
        activeAlarmCtx.close();
      }
    } catch (e) {}
    activeAlarmCtx = null;
  }
}

