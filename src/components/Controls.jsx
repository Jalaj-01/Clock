import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Clock, Check, SlidersHorizontal } from 'lucide-react';

export default function Controls({
  mode,
  timer,
  work,
  accentColor,
}) {
  const [showCustomSetter, setShowCustomSetter] = useState(false);
  const [inputHours, setInputHours] = useState(String(timer.durationHours || 0));
  const [inputMinutes, setInputMinutes] = useState(String(timer.durationRemainingMinutes || 25));

  const handleApplyCustomDuration = (e) => {
    e?.preventDefault();
    const h = parseInt(inputHours, 10) || 0;
    const m = parseInt(inputMinutes, 10) || 0;
    if (h > 0 || m > 0) {
      timer.setCustomDuration(h, m);
    }
    setShowCustomSetter(false);
  };

  const handlePreset = (mins) => {
    timer.setDuration(mins);
    setShowCustomSetter(false);
  };

  return (
    <div className="controls-bar" onPointerDown={(e) => e.stopPropagation()}>
      {/* MODE A: TIMER */}
      {mode === 'timer' && (
        <div className="timer-controls">
          <div className="left-controls">
            <button
              className={`control-btn primary ${timer.isRunning ? 'running' : ''}`}
              style={{ '--btn-accent': accentColor }}
              onClick={timer.toggle}
              title={timer.isRunning ? 'Pause' : 'Start'}
              aria-label={timer.isRunning ? 'Pause' : 'Start'}
            >
              {timer.isRunning ? <Pause size={11} /> : <Play size={11} fill="currentColor" />}
              <span>{timer.isRunning ? 'Pause' : 'Start'}</span>
            </button>

            <button
              className="control-btn"
              onClick={timer.reset}
              title="Reset Timer"
              aria-label="Reset Timer"
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          </div>

          <div className="right-controls">
            <button
              className={`duration-pill-btn ${showCustomSetter ? 'active' : ''}`}
              onClick={() => {
                setInputHours(String(timer.durationHours || 0));
                setInputMinutes(String(timer.durationRemainingMinutes || 25));
                setShowCustomSetter(!showCustomSetter);
              }}
              title="Set custom countdown duration"
            >
              <Clock size={10} />
              <span>
                {timer.durationHours > 0 ? `${timer.durationHours}h ` : ''}
                {timer.durationRemainingMinutes}m
              </span>
            </button>
          </div>

          {/* Custom Duration Popover / Stepper */}
          {showCustomSetter && (
            <div className="custom-duration-panel">
              <div className="presets-row">
                <button className="preset-btn" onClick={() => handlePreset(5)}>5m</button>
                <button className="preset-btn" onClick={() => handlePreset(15)}>15m</button>
                <button className="preset-btn" onClick={() => handlePreset(25)}>25m</button>
                <button className="preset-btn" onClick={() => handlePreset(45)}>45m</button>
                <button className="preset-btn" onClick={() => handlePreset(60)}>1h</button>
              </div>
              <form onSubmit={handleApplyCustomDuration} className="duration-inputs-row">
                <div className="input-group">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    className="time-num-input"
                    value={inputHours}
                    onChange={(e) => setInputHours(e.target.value)}
                    title="Hours"
                  />
                  <span className="input-unit">h</span>
                </div>
                <span className="input-divider">:</span>
                <div className="input-group">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    className="time-num-input"
                    value={inputMinutes}
                    onChange={(e) => setInputMinutes(e.target.value)}
                    title="Minutes"
                  />
                  <span className="input-unit">m</span>
                </div>
                <button type="submit" className="custom-set-btn" title="Set duration">
                  <Check size={11} />
                  <span>Set</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* MODE B: WORK TIMER */}
      {mode === 'work' && (
        <div className="work-controls">
          <div className="left-controls">
            {work.status === 'idle' && (
              <button
                className="control-btn primary"
                style={{ '--btn-accent': accentColor }}
                onClick={work.start}
                title="Start Work Timer"
                aria-label="Start Work Timer"
              >
                <Play size={11} fill="currentColor" />
                <span>Start</span>
              </button>
            )}

            {work.status === 'working' && (
              <button
                className="control-btn pause"
                style={{ '--btn-accent': accentColor }}
                onClick={work.pause}
                title="Take Break"
                aria-label="Take Break"
              >
                <Pause size={11} />
                <span>Pause</span>
              </button>
            )}

            {work.status === 'break' && (
              <button
                className="control-btn resume"
                style={{ '--btn-accent': accentColor }}
                onClick={work.resume}
                title="Resume Work"
                aria-label="Resume Work"
              >
                <Play size={11} fill="currentColor" />
                <span>Resume</span>
              </button>
            )}

            <button
              className="control-btn"
              onClick={work.reset}
              title="Reset Work & Break Time"
              aria-label="Reset Work & Break Time"
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          </div>

          <div className="right-controls">
            {work.status === 'working' && (
              <div className="status-badge work" style={{ '--badge-accent': accentColor }}>
                <span className="pulsing-dot" />
                <span>WORK</span>
              </div>
            )}
            {work.status === 'break' && (
              <div className="status-badge break">
                <span className="amber-dot" />
                <span>BREAK</span>
              </div>
            )}
            {work.status === 'idle' && (
              <div className="status-badge idle">
                <span>READY</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE C: LIVE CLOCK */}
      {mode === 'clock' && (
        <div className="clock-controls">
          <div className="live-badge" style={{ '--badge-accent': accentColor }}>
            <span className="live-dot" />
            <span>LOCAL TIME</span>
          </div>
        </div>
      )}
    </div>
  );
}
