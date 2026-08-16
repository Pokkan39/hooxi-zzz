import React from 'react';
import { siteUrl } from '../site-runtime.js';
import '../styles/ik-online.css';

const IkOnline = ({ count = 0, avatars = [], maxAvatars = 3 }) => {
  if (count === 0) return null;

  const shownAvatars = avatars.slice(0, maxAvatars);
  const overflow = Math.max(0, avatars.length - maxAvatars);

  return (
    <div className="ik-online" aria-label="在线人数">
      <span className="ik-online__dot" aria-hidden="true" />
      <span className="ik-online__count">{count} 在线</span>
      {shownAvatars.length > 0 && (
        <div className="ik-online__stack" aria-hidden="true">
          {shownAvatars.map((url, i) => (
            <img
              key={url + i}
              src={siteUrl(url)}
              className="ik-online__avatar"
              alt=""
              loading="lazy"
            />
          ))}
          {overflow > 0 && (
            <span className="ik-online__more">+{overflow}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default IkOnline;
