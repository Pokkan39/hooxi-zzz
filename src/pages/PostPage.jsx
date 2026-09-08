import React, { useMemo } from 'react';
import Navigation from '../components/Navigation';
import { interknotAvatars } from '../data/interknot-avatars.js';
import { siteUrl, navigateSite } from '../site-runtime.js';
import '../styles/interknot.css';
import '../styles/interknot-post.css';
import '../styles/navigation.css';

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

// 楼层署名用绳网网名（官方无网名的角色回退本名）
function resolveDisplayName(author) {
  return findAgent(author)?.handle || author?.name || '绳网用户';
}

// 与列表页一致的确定性浏览数：由 id 派生，避免每次刷新跳变
function deriveViews(id) {
  let hash = 0;
  const text = String(id || 'hooxi');
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return `${(hash % 280 + 20) / 10}K`;
}

function Floor({ floor, author, body, replyToName, isOp }) {
  return (
    <section className="ik-floor" id={`floor-${floor}`}>
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

export default function PostPage() {
  const postId = useMemo(() => new URLSearchParams(window.location.search).get('id'), []);
  const data = window.archiveData || { behindScenes: [], mainline: [], events: [] };
  const allItems = useMemo(() => [
    ...(data.behindScenes || []),
    ...(data.mainline || []),
    ...(data.events || [])
  ], [data]);

  const item = allItems.find(entry => entry.id === postId);

  // 优先 B站视频链接；baike.mihoyo.com 是死链，回退到 sourceUrl（与列表页口径一致）
  const sourceLink = item ? (item.video || item.sourceUrl || item.wikiUrl || null) : null;

  if (!item) {
    return (
      <>
        <Navigation currentPage="interknot" />
        <div className="ik-post-page">
          <div className="ik-post-container">
            <div className="ik-post-missing">
              <p>没有找到这条委托。</p>
              <button className="ik-post-back-btn" onClick={() => navigateSite('events.html')}>返回绳网</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // summary 与标题同文的条目（如部分 ZTALK），避免在标题下再重复一遍
  const summaryText = String(item.summary || '').trim();
  const plainSummary = summaryText && summaryText !== String(item.title || '').trim()
    ? summaryText
    : '该委托暂无楼层讨论。';

  const dialogue = item.dialogue || null;
  const post = dialogue?.post || null;
  const replies = dialogue?.replies || [];
  const opId = post?.author?.id;
  const floorsByAuthorId = {};
  if (post) floorsByAuthorId[opId] = post;
  replies.forEach(r => { floorsByAuthorId[r.author?.id] = r; });

  return (
    <>
      <Navigation currentPage="interknot" />
      <div className="ik-post-page">
        <div className="ik-post-container">
          <div className="ik-post-toolbar">
            <button className="ik-post-back-btn" onClick={() => navigateSite('events.html')}>
              ← 返回绳网
            </button>
            <div className="ik-post-meta">
              <span className="ik-post-views">浏览 {deriveViews(item.id)}</span>
              {sourceLink && (
                <a className="ik-post-source-btn" href={sourceLink} target="_blank" rel="noopener noreferrer">
                  {item.video ? '查看原视频' : '查看原文'} ↗
                </a>
              )}
            </div>
          </div>

          <h1 className="ik-post-title">{post?.title || item.title}</h1>

          {dialogue ? (
            <div className="ik-floors">
              <Floor
                floor={post.floor}
                author={post.author}
                body={post.body}
                isOp
              />
              {replies.map((reply) => (
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
              ))}
            </div>
          ) : (
            <div className="ik-post-plain">
              <p className="ik-post-plain-summary">{plainSummary}</p>
              {sourceLink && (
                <a className="ik-post-source-btn" href={sourceLink} target="_blank" rel="noopener noreferrer">
                  {item.video ? '查看原视频' : '查看原文'} ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
