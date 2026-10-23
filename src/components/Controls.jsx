import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Clock, Check, SlidersHorizontal, Bell, BellOff, BellRing } from 'lucide-react';

export default function Controls({
  mode,
  timer,
  work,
  alarm,
  is12Hour = true,
  accentColor,
}) {
  const [showCustomSetter, setShowCustomSetter] = useState(false);
  const [inputHours, setInputHours] = useState(String(timer?.durationHours || 0));
  const [inputMinutes, setInputMinutes] = useState(String(timer?.durationRemainingMinutes || 25));

  const [showAlarmSetter, setShowAlarmSetter] = useState(false);
  const [alarmInputHours, setAlarmInputHours] = useState('8');
  const [alarmInputMinutes, setAlarmInputMinutes] = useState('00');
  const [alarmInputAmPm, setAlarmInputAmPm] = useState('AM');

  const handleApplyCustomDuration = (e) => {
    e?.preventDefault();
    const h = parseInt(inputHours, 10) || 0;
    const m = parseInt(inputMinutes, 10) || 0;
    if (h > 0 || m > 0) {
      timer?.setCustomDuration(h, m);
    }
    setShowCustomSetter(false);
  };

  const handlePreset = (mins) => {
    timer?.setDuration(mins);
    setShowCustomSetter(false);
  };

  const handleApplyAlarmTime = (e) => {
    e?.preventDefault();
    if (!alarm) return;
    const h = parseInt(alarmInputHours, 10) || (is12Hour ? 12 : 0);
    const m = parseInt(alarmInputMinutes, 10) || 0;
    if (is12Hour) {
      alarm.setTime12Hour(h, m, alarmInputAmPm);
    } else {
      alarm.setTime(h, m);
    }
    alarm.setIsEnabled(true);
    setShowAlarmSetter(false);
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

      {/* MODE D: ALARM */}
      {mode === 'alarm' && alarm && (
        <div className="alarm-controls">
          <div className="left-controls">
            <button
              className={`control-btn primary ${alarm.isEnabled ? 'running' : ''}`}
              style={{ '--btn-accent': accentColor }}
              onClick={alarm.toggleEnabled}
              title={alarm.isEnabled ? 'Turn Alarm OFF' : 'Turn Alarm ON'}
              aria-label={alarm.isEnabled ? 'Turn Alarm OFF' : 'Turn Alarm ON'}
            >
              {alarm.isEnabled ? (
                <>
                  <Bell size={11} fill="currentColor" />
                  <span>ON</span>
                </>
              ) : (
                <>
                  <BellOff size={11} />
                  <span>OFF</span>
                </>
              )}
            </button>

            <button
              className="control-btn mini"
              onClick={() => alarm.adjustHours(1)}
              title="Add 1 hour"
            >
              +1h
            </button>
            <button
              className="control-btn mini"
              onClick={() => alarm.adjustMinutes(5)}
              title="Add 5 minutes"
            >
              +5m
            </button>
            <button
              className="control-btn mini"
              onClick={() => alarm.adjustMinutes(15)}
              title="Add 15 minutes"
            >
              +15m
            </button>

            {is12Hour && (
              <button
                className="control-btn mini ampm-quick-btn"
                onClick={alarm.toggleAmPm}
                title={`Click to switch between AM and PM (Currently: ${alarm.ampm})`}
              >
                <span>{alarm.ampm}</span>
              </button>
            )}

            <button
              className={`control-btn mini ${showAlarmSetter ? 'active' : ''}`}
              onClick={() => {
                if (is12Hour) {
                  setAlarmInputHours(String(alarm.display12Hours || 8));
                  setAlarmInputAmPm(alarm.ampm || 'AM');
                } else {
                  setAlarmInputHours(String(alarm.alarmHours));
                }
                setAlarmInputMinutes(String(alarm.alarmMinutes).padStart(2, '0'));
                setShowAlarmSetter(!showAlarmSetter);
              }}
              title="Set custom alarm time"
            >
              <SlidersHorizontal size={9} />
              <span>Set</span>
            </button>
          </div>

          <div className="right-controls">
            <div className={`status-badge ${alarm.isEnabled ? 'alarm-active' : 'idle'}`}>
              <span className={alarm.isEnabled ? 'pulsing-dot' : ''} />
              <span>{alarm.timeRemainingStr}</span>
            </div>
          </div>

          {/* Custom Alarm Time Popover */}
          {showAlarmSetter && (
            <div className="custom-duration-panel alarm-setter-panel">
              <div className="presets-row">
                <button className="preset-btn" onClick={() => { alarm.quickSetIn(15); setShowAlarmSetter(false); }}>+15m</button>
                <button className="preset-btn" onClick={() => { alarm.quickSetIn(30); setShowAlarmSetter(false); }}>+30m</button>
                <button className="preset-btn" onClick={() => { alarm.quickSetIn(60); setShowAlarmSetter(false); }}>+1h</button>
                {is12Hour ? (
                  <>
                    <button className="preset-btn" onClick={() => { alarm.setTime12Hour(7, 0, 'AM'); alarm.setIsEnabled(true); setShowAlarmSetter(false); }}>7am</button>
                    <button className="preset-btn" onClick={() => { alarm.setTime12Hour(8, 0, 'AM'); alarm.setIsEnabled(true); setShowAlarmSetter(false); }}>8am</button>
                    <button className="preset-btn" onClick={() => { alarm.setTime12Hour(10, 0, 'PM'); alarm.setIsEnabled(true); setShowAlarmSetter(false); }}>10pm</button>
                  </>
                ) : (
                  <>
                    <button className="preset-btn" onClick={() => { alarm.setTime(7, 0); alarm.setIsEnabled(true); setShowAlarmSetter(false); }}>07:00</button>
                    <button className="preset-btn" onClick={() => { alarm.setTime(8, 0); alarm.setIsEnabled(true); setShowAlarmSetter(false); }}>08:00</button>
                    <button className="preset-btn" onClick={() => { alarm.setTime(22, 0); alarm.setIsEnabled(true); setShowAlarmSetter(false); }}>22:00</button>
                  </>
                )}
              </div>
              <form onSubmit={handleApplyAlarmTime} className="duration-inputs-row">
                <div className="input-group">
                  <input
                    type="number"
                    min={is12Hour ? "1" : "0"}
                    max={is12Hour ? "12" : "23"}
                    className="time-num-input"
                    value={alarmInputHours}
                    onChange={(e) => setAlarmInputHours(e.target.value)}
                    title={is12Hour ? "Hour (1-12)" : "Hour (0-23)"}
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
                    value={alarmInputMinutes}
                    onChange={(e) => setAlarmInputMinutes(e.target.value)}
                    title="Minute (0-59)"
                  />
                  <span className="input-unit">m</span>
                </div>

                {is12Hour && (
                  <div className="ampm-toggle-switch">
                    <button
                      type="button"
                      className={`ampm-choice-btn ${alarmInputAmPm === 'AM' ? 'active' : ''}`}
                      onClick={() => setAlarmInputAmPm('AM')}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      className={`ampm-choice-btn ${alarmInputAmPm === 'PM' ? 'active' : ''}`}
                      onClick={() => setAlarmInputAmPm('PM')}
                    >
                      PM
                    </button>
                  </div>
                )}

                <button type="submit" className="custom-set-btn" title="Save Alarm Time">
                  <Check size={11} />
                  <span>Set</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
