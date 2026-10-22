import React, { useState, useEffect } from 'react';
import { X, Check, Laptop } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, accentColor }) {
  const [startupEnabled, setStartupEnabled] = useState(false);
  const [isPackaged, setIsPackaged] = useState(false);
  const [activeCorner, setActiveCorner] = useState('top-right');

  useEffect(() => {
    if (!isOpen) return;

    if (window.electronAPI) {
      window.electronAPI.getStartupSetting().then((val) => {
        setStartupEnabled(Boolean(val));
      });
      window.electronAPI.isPackaged().then((val) => {
        setIsPackaged(Boolean(val));
      });
      window.electronAPI.loadPersistedData().then((data) => {
        if (data?.lastCorner) {
          setActiveCorner(data.lastCorner);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleStartup = async () => {
    const nextVal = !startupEnabled;
    setStartupEnabled(nextVal);
    if (window.electronAPI) {
      await window.electronAPI.setStartupSetting(nextVal);
      await window.electronAPI.savePersistedData({ openAtLogin: nextVal });
    }
  };

  const handleSnapCorner = async (cornerName) => {
    setActiveCorner(cornerName);
    if (window.electronAPI) {
      await window.electronAPI.snapToCorner(cornerName);
    }
  };

  return (
    <div className="settings-overlay" onPointerDown={(e) => e.stopPropagation()}>
      <div className="settings-modal" style={{ '--modal-accent': accentColor }}>
        <div className="settings-header">
          <span className="settings-title">Widget Settings</span>
          <button className="icon-action-btn" onClick={onClose} title="Close Settings">
            <X size={12} />
          </button>
        </div>

        <div className="settings-body">
          {/* Startup toggle */}
          <div className="settings-row">
            <div className="settings-label-group">
              <span className="settings-label">Launch at Windows startup</span>
              {!isPackaged && (
                <span className="settings-note">(Active in packaged build)</span>
              )}
            </div>
            <button
              className={`toggle-switch ${startupEnabled ? 'on' : ''}`}
              onClick={handleToggleStartup}
              title="Toggle launch at Windows startup"
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          {/* Quick Corner Snap buttons */}
          <div className="settings-row corners">
            <span className="settings-label">Snap to screen corner</span>
            <div className="corner-grid">
              <button
                className={`corner-btn ${activeCorner === 'top-left' ? 'active' : ''}`}
                onClick={() => handleSnapCorner('top-left')}
                title="Top Left"
              >
                TL
              </button>
              <button
                className={`corner-btn ${activeCorner === 'top-right' ? 'active' : ''}`}
                onClick={() => handleSnapCorner('top-right')}
                title="Top Right"
              >
                TR
              </button>
              <button
                className={`corner-btn ${activeCorner === 'bottom-left' ? 'active' : ''}`}
                onClick={() => handleSnapCorner('bottom-left')}
                title="Bottom Left"
              >
                BL
              </button>
              <button
                className={`corner-btn ${activeCorner === 'bottom-right' ? 'active' : ''}`}
                onClick={() => handleSnapCorner('bottom-right')}
                title="Bottom Right"
              >
                BR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
