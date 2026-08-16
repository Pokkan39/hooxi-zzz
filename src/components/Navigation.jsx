import React, { useState, useRef, useEffect } from 'react';
import { siteUrl, navigateSite } from '../site-runtime.js';
import '../styles/navigation.css';

export default function Navigation({ currentPage = 'events' }) {
  const [searchVal, setSearchVal] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigateSite(`events.html?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <header className="ik-header">
      <div className="ik-header__inner">
        {/* 左：Logo */}
        <div className="ik-header__left">
          <a href="index.html" className="ik-brand" aria-label="HOOXI 首页">
            <img src={siteUrl('/assets/images/zzzicon.png')} alt="HOOXI" className="ik-brand__icon" draggable="false" />
            <strong className="ik-brand__title">HOOXI</strong>
          </a>
        </div>

        {/* 中：搜索框 */}
        <div className="ik-header__middle">
          <form
            className={`ik-search-shell${searchFocused ? ' is-focused' : ''}`}
            onSubmit={handleSearch}
          >
            <input
              ref={inputRef}
              className="ik-search-input"
              type="text"
              placeholder="搜索一下 \(￣︶￣*))"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchVal && (
              <button
                type="button"
                className="ik-search-clear"
                aria-label="清除"
                onMouseDown={e => { e.preventDefault(); setSearchVal(''); inputRef.current?.focus(); }}
              >×</button>
            )}
            <span className="ik-search-divider" />
            <button type="submit" className="ik-search-action" aria-label="搜索">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="22" y2="22" />
              </svg>
            </button>
          </form>
        </div>

        {/* 右：异形 tabs */}
        <div className="ik-header__right">
          <div className="ik-header-tabs" role="tablist">
            <a
              href="index.html"
              role="tab"
              className={`ik-header-tab ik-header-tab--first${currentPage === 'home' ? ' is-active' : ''}`}
            >
              <svg className="ik-tab-highlight ik-tab-highlight--first" viewBox="0 0 110.7 42" aria-hidden="true">
                <path d="M 21 0 L 94.38 0 A 10 10 0 0 1 103.29 14.54 L 93.75 33.26 A 16 16 0 0 1 79.5 42 L 21 42 A 21 21 0 0 1 21 0 Z" fill="currentColor" />
              </svg>
              <span className="ik-header-tab__content">首页</span>
            </a>
            <a
              href="events.html"
              role="tab"
              className={`ik-header-tab ik-header-tab--middle${currentPage === 'interknot' ? ' is-active' : ''}`}
            >
              <svg className="ik-tab-highlight ik-tab-highlight--middle" viewBox="0 0 121.4 42" aria-hidden="true">
                <path d="M 105.08 0 A 10 10 0 0 1 113.99 14.54 L 104.45 33.26 A 16 16 0 0 1 90.2 42 L 16.32 42 A 10 10 0 0 1 7.41 27.46 L 16.95 8.74 A 16 16 0 0 1 31.2 0 Z" fill="currentColor" />
              </svg>
              <span className="ik-header-tab__content">委托</span>
            </a>
            <a
              href="faction.html"
              role="tab"
              className={`ik-header-tab ik-header-tab--middle${currentPage === 'faction' ? ' is-active' : ''}`}
            >
              <svg className="ik-tab-highlight ik-tab-highlight--middle" viewBox="0 0 121.4 42" aria-hidden="true">
                <path d="M 105.08 0 A 10 10 0 0 1 113.99 14.54 L 104.45 33.26 A 16 16 0 0 1 90.2 42 L 16.32 42 A 10 10 0 0 1 7.41 27.46 L 16.95 8.74 A 16 16 0 0 1 31.2 0 Z" fill="currentColor" />
              </svg>
              <span className="ik-header-tab__content">阵营</span>
            </a>
            <a
              href="stories.html"
              role="tab"
              className={`ik-header-tab ik-header-tab--last${currentPage === 'stories' ? ' is-active' : ''}`}
            >
              <svg className="ik-tab-highlight ik-tab-highlight--last" viewBox="0 0 110.7 42" aria-hidden="true">
                <path d="M 89.7 0 A 21 21 0 0 1 89.7 42 L 13.05 42 A 8 8 0 0 1 5.93 30.37 L 16.95 8.74 A 16 16 0 0 1 31.2 0 Z" fill="currentColor" />
              </svg>
              <span className="ik-header-tab__content">代理人</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
