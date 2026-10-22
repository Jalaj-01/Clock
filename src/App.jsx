import React, { useState, useEffect, useRef } from 'react';
import { Maximize2 } from 'lucide-react';
import ModeSelector from './components/ModeSelector';
import FlipClock from './components/FlipClock';
import Controls from './components/Controls';
import SettingsModal from './components/SettingsModal';
import { useLiveClock } from './hooks/useLiveClock';
import { useCountdownTimer } from './hooks/useCountdownTimer';
import { useWorkTimer } from './hooks/useWorkTimer';

const ACCENTS = {
  timer: '#f59e0b', // Warm amber / orange
  work: '#10b981',  // Mint green
  clock: '#06b6d4', // Cool cyan / blue
};

export default function App() {
  const [mode, setMode] = useState('clock');
  const [isExpanded, setIsExpanded] = useState(false);
  const [is12Hour, setIs12Hour] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Drag tracking state
  const isDraggingRef = useRef(false);
  const dragDistanceRef = useRef(0);
  const dragStartCoordsRef = useRef({ x: 0, y: 0 });

  // Mode hooks
  const clock = useLiveClock(is12Hour);
  const timer = useCountdownTimer(25);
  const work = useWorkTimer();

  // Load persisted state on startup
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.loadPersistedData().then((data) => {
        if (data) {
          if (data.mode && ['timer', 'work', 'clock'].includes(data.mode)) {
            setMode(data.mode);
          }
          if (typeof data.is12Hour === 'boolean') {
            setIs12Hour(data.is12Hour);
          }
          if (typeof data.isExpanded === 'boolean') {
            setIsExpanded(data.isExpanded);
          }
          if (data.timerDuration) {
            timer.setDuration(data.timerDuration);
          }
          if (data.cumulativeWorkMs) {
            work.restoreCumulativeWork(data.cumulativeWorkMs);
          }
        }
        setIsLoaded(true);
      });
    } else {
      setIsLoaded(true);
    }
  }, []);

  // Save mode changes
  const handleSelectMode = (newMode) => {
    setMode(newMode);
    if (window.electronAPI) {
      window.electronAPI.savePersistedData({ mode: newMode });
    }
  };

  // Toggle 12h / 24h
  const handleToggle12Hour = () => {
    const nextVal = !is12Hour;
    setIs12Hour(nextVal);
    if (window.electronAPI) {
      window.electronAPI.savePersistedData({ is12Hour: nextVal });
    }
  };

  // Toggle expand / compact view
  const handleToggleExpand = async (nextExpanded) => {
    setIsExpanded(nextExpanded);
    if (window.electronAPI) {
      try {
        await window.electronAPI.setExpanded(nextExpanded);
        await window.electronAPI.savePersistedData({ isExpanded: nextExpanded });
      } catch (err) {
        console.error('Failed to set expanded:', err);
      }
    }
  };

  // Close window
  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.savePersistedData({
        mode,
        is12Hour,
        isExpanded,
        timerDuration: timer.durationMinutes,
        cumulativeWorkMs: work.cumulativeWorkMs,
      }).then(() => {
        window.electronAPI.closeWindow();
      });
    }
  };

  // Draggable widget surface with pointer capture
  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    const targetTag = e.target.tagName.toLowerCase();
    if (['button', 'input', 'select', 'textarea'].includes(targetTag) || e.target.closest('button')) {
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // fallback
    }

    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    dragStartCoordsRef.current = { x: e.screenX, y: e.screenY };

    if (window.electronAPI) {
      window.electronAPI.dragStart({ screenX: e.screenX, screenY: e.screenY });
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const deltaX = Math.abs(e.screenX - dragStartCoordsRef.current.x);
    const deltaY = Math.abs(e.screenY - dragStartCoordsRef.current.y);
    dragDistanceRef.current += Math.hypot(deltaX, deltaY);

    if (window.electronAPI) {
      window.electronAPI.dragMove({ screenX: e.screenX, screenY: e.screenY });
    }
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // fallback
    }
    if (window.electronAPI) {
      window.electronAPI.dragEnd();
    }
  };

  const accentColor = ACCENTS[mode];

  // Select active display data according to mode
  let activeDisplay = clock;
  if (mode === 'timer') {
    activeDisplay = timer;
  } else if (mode === 'work') {
    activeDisplay = work;
  }

  // Always current live date and time
  const currentLocalTimeStr = `${clock.formatted}${clock.ampm ? ' ' + clock.ampm : ''}`;
  const currentDateTimeStr = `${clock.dateInfo?.formatted || 'THU, 22 OCT'} • ${currentLocalTimeStr}`;

  return (
    <div
      className={`widget-viewport ${isExpanded ? 'expanded' : 'compact'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className={`widget-card mode-${mode} ${isExpanded ? 'expanded' : 'compact'}`}
        style={{
          '--accent-color': accentColor,
        }}
        onDoubleClick={(e) => {
          const tag = e.target.tagName.toLowerCase();
          if (['button', 'input', 'select'].includes(tag) || e.target.closest('button')) return;
          handleToggleExpand(!isExpanded);
        }}
      >
        {/* COMPACT MODE: Minimal flip clock with Date & Time, Seconds, and extend icon */}
        {!isExpanded ? (
          <div className="compact-container">
            {/* Top compact bar: Live Date & Time on left, Extend icon on right */}
            <div className="compact-top-bar">
              <div className="compact-meta-group">
                <span className="meta-day-date">{clock.dateInfo?.formatted || 'THU, 22 OCT'}</span>
                {mode !== 'clock' && (
                  <>
                    <span className="meta-dot">•</span>
                    <span className="meta-time">{currentLocalTimeStr}</span>
                  </>
                )}
                {mode === 'work' && activeDisplay.status === 'break' && (
                  <span className="compact-status-tag break">BREAK</span>
                )}
                {mode === 'work' && activeDisplay.status === 'working' && (
                  <span className="compact-status-tag work">WORK</span>
                )}
                {mode === 'timer' && activeDisplay.isRunning && (
                  <span className="compact-status-tag timer">TIMER</span>
                )}
              </div>

              <button
                className="compact-extend-btn"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleExpand(true);
                }}
                title="Expand clock & controls"
                aria-label="Expand clock & controls"
              >
                <Maximize2 size={10} />
              </button>
            </div>

            {/* Flip Clock Digits: Hours, Minutes, AND Seconds */}
            <div className="compact-digits-wrapper">
              <FlipClock
                showHours={true}
                showSeconds={true}
                h1={activeDisplay.h1}
                h2={activeDisplay.h2}
                m1={activeDisplay.m1}
                m2={activeDisplay.m2}
                s1={activeDisplay.s1}
                s2={activeDisplay.s2}
                ampm={mode === 'clock' && is12Hour ? activeDisplay.ampm : ''}
                accentColor={accentColor}
              />
            </div>
          </div>
        ) : (
          /* EXPANDED MODE: Full header tabs, Date & Time, Controls, and Features */
          <>
            <ModeSelector
              currentMode={mode}
              onSelectMode={handleSelectMode}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onClose={handleClose}
              onCollapse={() => handleToggleExpand(false)}
              is12Hour={is12Hour}
              onToggle12Hour={handleToggle12Hour}
              accentColor={accentColor}
            />

            {/* Subheader Date info */}
            <div className="expanded-date-row">
              <span className="meta-day-date">{clock.dateInfo?.fullFormatted || clock.dateInfo?.formatted}</span>
              {mode !== 'clock' && (
                <>
                  <span className="meta-dot">•</span>
                  <span className="meta-time">{currentLocalTimeStr}</span>
                </>
              )}
            </div>

            {/* Center: Flip Clock Digits with Seconds */}
            <div className="clock-body">
              <FlipClock
                showHours={true}
                showSeconds={true}
                h1={activeDisplay.h1}
                h2={activeDisplay.h2}
                m1={activeDisplay.m1}
                m2={activeDisplay.m2}
                s1={activeDisplay.s1}
                s2={activeDisplay.s2}
                ampm={mode === 'clock' && is12Hour ? activeDisplay.ampm : ''}
                accentColor={accentColor}
              />
            </div>

            {/* Bottom Controls */}
            <Controls
              mode={mode}
              timer={timer}
              work={work}
              accentColor={accentColor}
            />

            {/* Settings Modal Overlay */}
            <SettingsModal
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              accentColor={accentColor}
            />
          </>
        )}
      </div>
    </div>
  );
}
