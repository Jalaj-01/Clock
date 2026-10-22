import React from 'react';
import FlipDigit from './FlipDigit';

export default function FlipClock({
  showHours = true,
  showSeconds = true,
  h1 = '0',
  h2 = '0',
  m1 = '0',
  m2 = '0',
  s1 = '0',
  s2 = '0',
  ampm = '',
  accentColor,
}) {
  return (
    <div className="flip-clock-display">
      {/* Hours digits */}
      <div className="digit-pair">
        <FlipDigit digit={h1} accentColor={accentColor} />
        <FlipDigit digit={h2} accentColor={accentColor} />
      </div>

      {/* Colon separator */}
      <div className="flip-separator">
        <span className="dot" />
        <span className="dot" />
      </div>

      {/* Minutes digits */}
      <div className="digit-pair">
        <FlipDigit digit={m1} accentColor={accentColor} />
        <FlipDigit digit={m2} accentColor={accentColor} />
      </div>

      {/* Seconds digits (always visible per user requirement) */}
      {showSeconds && (
        <>
          <div className="flip-separator">
            <span className="dot" />
            <span className="dot" />
          </div>
          <div className="digit-pair seconds">
            <FlipDigit digit={s1} accentColor={accentColor} />
            <FlipDigit digit={s2} accentColor={accentColor} />
          </div>
        </>
      )}

      {/* 12-Hour AM/PM Indicator badge */}
      {ampm && (
        <div className="ampm-indicator">
          <span>{ampm}</span>
        </div>
      )}
    </div>
  );
}
