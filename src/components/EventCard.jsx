import React, { forwardRef } from 'react';
import { siteUrl, navigateSite } from '../site-runtime.js';

const EventCard = forwardRef(({ event, isAdmin }, ref) => {
  const coverSrc = siteUrl(event.cover || event.portrait || null);
  const avatarSrc = siteUrl(event.avatar || '/assets/images/default-avatar.webp');
  const authorName = event.author || event.poster || 'HOOXI';

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // 跳转到编辑页面，传递帖子 ID
    navigateSite(`edit.html?id=${event.id}`);
  };

  return (
    <article className={`hooxi-event-card${event.tall ? ' hooxi-event-card--tall' : ''}`} data-category={event.category} ref={ref}>
      <a 
        href={event.url || '#'}
        className="hooxi-event-card-link"
        target={event.url ? '_blank' : undefined}
        rel={event.url ? 'noopener noreferrer' : undefined}
      >
        {isAdmin && (
          <button 
            className="hooxi-event-card-edit-btn"
            onClick={handleEdit}
            title="编辑委托"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        )}
        {coverSrc && (
        <div className="hooxi-event-card-cover-wrap">
          <div className="hooxi-event-card-cover-frame">
            <img 
              src={coverSrc}
              alt={event.title}
              className="hooxi-event-card-cover"
              loading="lazy"
              decoding="async"
              onError={(e) => { e.currentTarget.closest('.hooxi-event-card-cover-wrap').style.display = 'none'; }}
            />
          </div>
          <div className="hooxi-event-card-views">
            <svg 
              className="hooxi-event-card-views-icon" 
              viewBox="0 0 24 24" 
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 5C6.7 5 3 10 2 12c1 2 4.7 7 10 7s9-5 10-7c-1-2-4.7-7-10-7Z" />
              <circle cx="12" cy="12" r="3.2" />
            </svg>
            <span>{event.views}</span>
          </div>
        </div>
        )}
        <div className="hooxi-event-card-body">
          <div className="hooxi-event-card-author-row">
            <div className="hooxi-event-card-avatar-shell">
              <img 
                src={avatarSrc}
                alt={authorName}
                className="hooxi-event-card-avatar-image"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="hooxi-event-card-author-block">
              <p className="hooxi-event-card-author-name">{authorName}</p>
              <div className="hooxi-event-card-author-divider"></div>
            </div>
          </div>
          <h3 className="hooxi-event-card-title">
            {event.category && <span className="hooxi-event-card-title-cat">[ {event.category} ]</span>}
            {event.title}
          </h3>
        </div>
      </a>
    </article>
  );
});

EventCard.displayName = 'EventCard';

export default EventCard;
