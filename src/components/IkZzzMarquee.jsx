import React, { useState, useEffect } from 'react';
import '../styles/ik-zzz-marquee.css';

const IkZzzMarquee = ({ paused = false }) => {
  const MARQUEE_LINE = "HOOXI ".repeat(6);
  const MARQUEE_START_DELAY_MS = 250;

  const [running, setRunning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRunning(true);
    }, MARQUEE_START_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  const isRunning = running && !paused;

  return (
    <div 
      className={`ik-zzz-marquee ${isRunning ? 'is-running' : ''}`}
      aria-hidden="true"
    >
      <div className="ik-zzz-marquee__band">
        <div className="ik-zzz-marquee__row ik-zzz-marquee__row--ltr">
          <div className="ik-zzz-marquee__track">
            <span className="ik-zzz-marquee__text">{MARQUEE_LINE}</span>
            <span className="ik-zzz-marquee__text">{MARQUEE_LINE}</span>
          </div>
        </div>
        <div className="ik-zzz-marquee__row ik-zzz-marquee__row--rtl">
          <div className="ik-zzz-marquee__track">
            <span className="ik-zzz-marquee__text">{MARQUEE_LINE}</span>
            <span className="ik-zzz-marquee__text">{MARQUEE_LINE}</span>
          </div>
        </div>
        <div className="ik-zzz-marquee__row ik-zzz-marquee__row--ltr ik-zzz-marquee__row--offset">
          <div className="ik-zzz-marquee__track">
            <span className="ik-zzz-marquee__text">{MARQUEE_LINE}</span>
            <span className="ik-zzz-marquee__text">{MARQUEE_LINE}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IkZzzMarquee;
