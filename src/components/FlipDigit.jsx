import React, { useState, useEffect, useRef } from 'react';

/**
 * Split-flap digit card with realistic 3D physical animation.
 * Animates only when the digit value changes.
 */
export default function FlipDigit({ digit, accentColor }) {
  const [current, setCurrent] = useState(digit);
  const [previous, setPrevious] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);
  const animationTimerRef = useRef(null);

  useEffect(() => {
    if (digit !== current) {
      setPrevious(current);
      setCurrent(digit);
      setIsFlipping(true);

      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }

      animationTimerRef.current = setTimeout(() => {
        setIsFlipping(false);
        setPrevious(digit);
      }, 360); // 360ms total flip duration to allow full mechanical drop
    }

    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, [digit, current]);

  return (
    <div className="flip-card-wrapper">
      <div className={`flip-card ${isFlipping ? 'flipping' : ''}`}>
        {/* Static Background Cards */}
        {/* Top half: reveals current (new) digit */}
        <div className="flip-panel flip-static top">
          <span className="digit-content">{current}</span>
        </div>

        {/* Bottom half: displays previous (old) digit until covered */}
        <div className="flip-panel flip-static bottom">
          <span className="digit-content">{isFlipping ? previous : current}</span>
        </div>

        {/* Dynamic 3D Flipping Flaps (keyed to guarantee clean fresh re-trigger on change) */}
        {isFlipping && (
          <React.Fragment key={`${previous}->${current}`}>
            {/* Top flap: folds down from 0 to -90 deg */}
            <div className="flip-panel flip-flap top-flap">
              <span className="digit-content">{previous}</span>
            </div>

            {/* Bottom flap: drops down from 90 to 0 deg */}
            <div className="flip-panel flip-flap bottom-flap">
              <span className="digit-content">{current}</span>
            </div>
          </React.Fragment>
        )}

        {/* Physical flap split crease line */}
        <div className="flip-crease" />

        {/* Authentic side notches for split-flap pin mechanism */}
        <div className="notch-left" />
        <div className="notch-right" />
      </div>
    </div>
  );
}
