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
          {/* B站主页 */}
          <a
            href="https://space.bilibili.com/HOOXI_UID"
            target="_blank"
            rel="noopener noreferrer"
            className="ik-bili-link"
            aria-label="HOOXI B站主页"
            title="前往 HOOXI B站主页"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L8.32 3.093c.267.249.4.556.4.907H15.2a1.35 1.35 0 0 1 .4-.907l1.5-1.387c.267-.249.573-.373.92-.373.347 0 .662.12.947.36l.027.027c.267.249.4.556.4.907 0 .355-.133.657-.4.906zM5.333 7.24c-.764.018-1.369.262-1.813.733-.444.471-.678 1.076-.702 1.813v7.36c.024.764.258 1.369.702 1.813.444.444 1.049.678 1.813.694h13.334c.764-.016 1.369-.25 1.813-.694.444-.444.678-1.049.694-1.813v-7.36c-.016-.737-.25-1.342-.694-1.813-.444-.471-1.049-.715-1.813-.733zM8 11.107c.373 0 .684.124.933.373.249.249.373.56.373.933v1.173c0 .373-.124.684-.373.933-.249.249-.56.373-.933.373s-.684-.124-.933-.373c-.249-.249-.373-.56-.373-.933V12.413c0-.373.124-.684.373-.933.249-.249.56-.373.933-.373zm8 0c.373 0 .684.124.933.373.249.249.373.56.373.933v1.173c0 .373-.124.684-.373.933-.249.249-.56.373-.933.373s-.684-.124-.933-.373c-.249-.249-.373-.56-.373-.933V12.413c0-.373.124-.684.373-.933.249-.249.56-.373.933-.373z"/>
            </svg>
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
