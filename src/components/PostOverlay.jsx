import React, { useEffect } from 'react';
import { interknotAvatars } from '../data/interknot-avatars.js';
import { siteUrl } from '../site-runtime.js';
import IkZzzMarquee from './IkZzzMarquee';
import '../styles/interknot-overlay.css';
import '../styles/interknot-post.css';

const DEFAULT_AVATAR = '/assets/images/default-avatar.webp';

function findAgent(author) {
  if (!author) return null;
  return interknotAvatars.find(a => a.id === author.avatarRef || a.id === author.id)
    || interknotAvatars.find(a => a.name === author.name)
    || null;
}

function resolveAvatar(author) {
  const agent = findAgent(author);
  return agent?.interknotAvatar || agent?.avatar || DEFAULT_AVATAR;
}

function resolveDisplayName(author) {
  return findAgent(author)?.handle || author?.name || '绳网用户';
}

function Floor({ floor, author, body, replyToName, isOp }) {
  return (
    <section className="ik-floor" id={`overlay-floor-${floor}`}>
      <div className="ik-floor-side">
        <div className="ik-floor-avatar-shell">
          <img
            src={siteUrl(resolveAvatar(author))}
            alt={author?.name || '绳网用户'}
            className="ik-floor-avatar"
            loading="lazy"
            decoding="async"
            onError={(e) => { e.currentTarget.src = siteUrl(DEFAULT_AVATAR); }}
          />
        </div>
      </div>
      <div className="ik-floor-main">
        <header className="ik-floor-head">
          <span className="ik-floor-name">{resolveDisplayName(author)}</span>
          {isOp && <span className="ik-floor-op-badge">楼主</span>}
          <span className="ik-floor-no">{floor}</span>
        </header>
        {replyToName && (
          <p className="ik-floor-replyto">回复 <span className="ik-floor-replyto-name">@{replyToName}</span></p>
        )}
        <div className="ik-floor-body">
          {String(body || '').split(/\n+/).filter(Boolean).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function PostOverlay({ event, onClose }) {
  useEffect(() => {
    if (!event) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [event, onClose]);

  if (!event) return null;

  const coverSrc = siteUrl(event.cover || event.portrait || null);
  const sourceUrl = event.url || null;
  const dialogue = event.dialogue || null;
  const post = dialogue?.post || null;
  const replies = Array.isArray(dialogue?.replies) ? dialogue.replies : [];
  const opAuthor = post?.author || null;
  const headerAgent = findAgent(opAuthor);
  const headerName = headerAgent?.handle || opAuthor?.name || String(event.poster || event.author || '绳网用户');
  const headerRealName = headerAgent?.name && headerAgent.name !== headerName ? headerAgent.name : '';
  const headerAvatar = siteUrl(
    event.avatar
    || findAgent(opAuthor)?.interknotAvatar
    || DEFAULT_AVATAR
  );
  const opId = opAuthor?.id;
  const floorsByAuthorId = {};
  if (post) floorsByAuthorId[opId] = post;
  replies.forEach(r => { if (r?.author?.id) floorsByAuthorId[r.author.id] = r; });

  const summaryText = String(event.summary || '').trim();
  const titleText = String(event.title || '').trim();
  const leftBody = summaryText && summaryText !== titleText ? summaryText : (post?.body || '');

  const openSource = () => {
    if (!sourceUrl) return;
    window.open(sourceUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="ik-overlay" onClick={onClose}>
      <div className="ik-overlay__backdrop" aria-hidden="true" />
      <div className="ik-overlay__stripe" aria-hidden="true" />
      <div className="ik-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ik-dialog__outer">
          <div className="ik-dialog__inner">
            <div className="ik-dialog__header">
              <div className="ik-dialog__header-left">
                <div className="ik-dialog__avatar-shell">
                  <img
                    src={headerAvatar}
                    alt={headerName}
                    className="ik-dialog__avatar"
                    onError={(e) => { e.currentTarget.src = siteUrl(DEFAULT_AVATAR); }}
                  />
                </div>
                <div className="ik-dialog__author-info">
                  <span className="ik-dialog__author-name">{headerName}</span>
                  {headerRealName ? <span className="ik-dialog__author-sub">{headerRealName}</span> : null}
                </div>
              </div>
              <button type="button" className="ik-dialog__close" aria-label="关闭" onClick={onClose}>
                <img src={siteUrl('/assets/images/close-btn.webp')} alt="关闭" className="ik-dialog__close-img" draggable="false" />
              </button>
            </div>

            <div className="ik-dialog__main">
              <IkZzzMarquee />
              <div className="ik-dialog__body">
                <div className="ik-dialog__left">
                  <div className="ik-dialog__left-scroll">
                    {coverSrc && (
                      <div className="ik-dialog__cover-wrap">
                        <button
                          type="button"
                          className={`ik-dialog__cover-border${sourceUrl ? ' is-clickable' : ''}`}
                          onClick={openSource}
                          title={sourceUrl ? '查看原视频 / 原文' : undefined}
                        >
                          <img src={coverSrc} alt={event.title} className="ik-dialog__cover" />
                          {sourceUrl && <span className="ik-dialog__cover-badge">点击查看原文</span>}
                        </button>
                      </div>
                    )}
                    <div className="ik-dialog__detail">
                      <h1 className="ik-dialog__title">
                        {event.category && <span className="ik-dialog__title-cat">[ {event.category} ]</span>}
                        {event.title}
                      </h1>
                      {leftBody && (
                        <div className="ik-dialog__content">
                          {String(leftBody).split(/\n+/).filter(Boolean).map((para, i) => (
                            <p key={i}>{para}</p>
                          ))}
                        </div>
                      )}
                      {sourceUrl && (
                        <button type="button" className="ik-dialog__source-hint" onClick={openSource}>
                          点击封面查看原视频 / 原文 ↗
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ik-dialog__right">
                  <div className="ik-dialog__comments-scroll">
                    <div className="ik-dialog__comments-inner">
                      {dialogue && replies.length ? (
                        replies.map((reply) => (
                          <Floor
                            key={reply.floor}
                            floor={reply.floor}
                            author={reply.author}
                            body={reply.body}
                            isOp={reply.author?.id === opId}
                            replyToName={floorsByAuthorId[reply.replyTo]
                              ? resolveDisplayName(floorsByAuthorId[reply.replyTo].author)
                              : null}
                          />
                        ))
                      ) : (
                        <p className="ik-dialog__empty">该委托暂无楼层讨论。</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
