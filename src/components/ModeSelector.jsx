import React from 'react';
import { X, Settings, Minimize2 } from 'lucide-react';

export default function ModeSelector({
  currentMode,
  onSelectMode,
  onOpenSettings,
  onClose,
  onCollapse,
  is12Hour,
  onToggle12Hour,
  accentColor,
}) {
  const modes = [
    { id: 'timer', label: 'Timer' },
    { id: 'work', label: 'Work' },
    { id: 'clock', label: 'Clock' },
  ];

  return (
    <div className="mode-selector-bar">
      <div className="mode-tabs">
        {modes.map((mode) => {
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              className={`mode-tab-btn ${isActive ? 'active' : ''}`}
              style={{
                '--tab-accent': accentColor,
              }}
              onClick={() => onSelectMode(mode.id)}
              onPointerDown={(e) => e.stopPropagation()}
              title={`Switch to ${mode.label} mode`}
            >
              {isActive && <span className="mode-dot" />}
              {mode.label}
            </button>
          );
        })}
      </div>

      <div className="window-actions">
        {/* 12h / 24h Toggle Button */}
        <button
          className={`format-toggle-btn ${is12Hour ? 'active' : ''}`}
          onClick={onToggle12Hour}
          onPointerDown={(e) => e.stopPropagation()}
          title="Toggle 12h / 24h clock format"
        >
          {is12Hour ? '12H' : '24H'}
        </button>

        {/* Settings button */}
        <button
          className="icon-action-btn"
          onClick={onOpenSettings}
          onPointerDown={(e) => e.stopPropagation()}
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={11} />
        </button>

        {/* Collapse back to compact floating clock */}
        <button
          className="icon-action-btn"
          onClick={onCollapse}
          onPointerDown={(e) => e.stopPropagation()}
          title="Minimize to compact flip clock"
          aria-label="Minimize to compact flip clock"
        >
          <Minimize2 size={11} />
        </button>

        {/* Close app */}
        <button
          className="icon-action-btn close"
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()}
          title="Close Clock"
          aria-label="Close Clock"
        >
          <X size={11} />
        </button>
      </div>
    </div>
  );
}
