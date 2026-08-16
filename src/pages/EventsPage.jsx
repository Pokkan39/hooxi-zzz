import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import IkZzzMarquee from '../components/IkZzzMarquee';
import IkOnline from '../components/IkOnline';
import CategoryTabs from '../components/CategoryTabs';
import EventCard from '../components/EventCard';
import Navigation from '../components/Navigation';
import { interknotAvatars } from '../data/interknot-avatars.js';
import { navigateSite } from '../site-runtime.js';
import '../styles/interknot.css';
import '../styles/navigation.css';

const CATEGORIES = [
  { id: 'all', label: '最新' },
  { id: '主线', label: '主线' },
  { id: '活动', label: '活动' },
  { id: '幕后', label: '幕后' },
  { id: '对谈', label: '对谈' },
  { id: '官方媒体', label: '官方媒体' }
];

export default function EventsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const cardRefs = useRef([]);
  const containerRef = useRef(null);

  // 模拟在线人数（实际应从后端获取）
  const [onlineData] = useState({
    count: 127,
    avatars: interknotAvatars.slice(0, 5).map(a => a.portrait)
  });

  // 检查管理员权限
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setIsAdmin(userData.isAdmin === true);
    }
  }, []);

  const handleEdit = (eventId) => {
    navigateSite(`edit.html?id=${eventId}`);
  };

  // 从全局 archiveData 提取数据
  const data = window.archiveData || { behindScenes: [], mainline: [], events: [] };
  const behindScenes = data.behindScenes || [];
  const mainlineStory = (data.mainline || []).filter(item => item.lane !== 'media');
  const mainlineMedia = (data.mainline || []).filter(item => item.lane === 'media');
  const events = data.events || [];

  // 合并所有数据源
  const allItems = [
    ...behindScenes.map(item => ({
      ...item,
      categoryTag: item.groupId === 'bs-ztalk' ? '对谈' : '幕后'
    })),
    ...mainlineStory.map(item => ({
      ...item,
      categoryTag: '主线'
    })),
    ...mainlineMedia.map(item => ({
      ...item,
      categoryTag: '官方媒体'
    })),
    ...events.map(item => ({
      ...item,
      categoryTag: '活动'
    }))
  ];

  // 将数据写入 localStorage 供编辑页使用
  useEffect(() => {
    if (allItems.length > 0) {
      localStorage.setItem('events', JSON.stringify(allItems));
    }
  }, []);

  // 根据分类筛选
  const filteredEvents = activeCategory === 'all'
    ? allItems
    : allItems.filter(item => item.categoryTag === activeCategory);

  const EVENTS = filteredEvents.map((item, idx) => {
    const agent = interknotAvatars[idx % interknotAvatars.length];
    // 一高一低交替：偶数索引为竖版大卡，奇数为横版小卡
    const tall = idx % 2 === 0;
    // 优先用 B站链接；baike.mihoyo.com 是死链，回退到 sourceUrl
    const rawUrl = item.sourceUrl || item.wikiUrl || null;
    const url = rawUrl && rawUrl.includes('baike.mihoyo.com') ? null : rawUrl;
    return {
      id: item.id || idx,
      title: item.title || '未命名',
      cover: item.cover || item.portrait || null,
      avatar: item.avatar || agent.avatar || '/assets/images/default-avatar.webp',
      poster: item.poster || agent.name,
      category: item.categoryTag,
      views: `${Math.floor((idx * 7 + 13) % 20 + 10) / 10}K`,
      url,
      tall
    };
  });

  useEffect(() => {
    cardRefs.current.forEach((card) => {
      if (!card) return;
      
      // 移除旧的 gsap 整卡缩放，改用纯 CSS hover
      // 添加进场动画：从下方淡入 + 缩放
      gsap.fromTo(card,
        {
          opacity: 0,
          y: 20,
          scale: 0.96
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.36,
          ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
          clearProps: 'transform,opacity' // 动画完成后清除 inline style，避免干扰 CSS hover
        }
      );
    });
  }, [EVENTS]);

  return (
    <>
      <Navigation currentPage="interknot" />
      <IkZzzMarquee />
      <div className="hooxi-events-page">
        <div className="hooxi-events-container">
          <div className="hooxi-events-header">
            <div className="hooxi-events-title-row">
              <div>
                <h1 className="hooxi-events-title">绳网</h1>
                <p className="hooxi-events-subtitle">InterKnot Archive</p>
              </div>
              <div className="hooxi-events-header-actions">
                <IkOnline 
                  count={onlineData.count} 
                  avatars={onlineData.avatars}
                  maxAvatars={3}
                />
                <button 
                  className="hooxi-create-post-btn"
                  onClick={() => navigateSite('create.html')}
                >
                  + 发布委托
                </button>
              </div>
            </div>
            <CategoryTabs 
              categories={CATEGORIES} 
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>
          <div className="hooxi-masonry" ref={containerRef}>
            {EVENTS.map((event, idx) => (
              <EventCard
                key={event.id}
                event={event}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                ref={el => cardRefs.current[idx] = el}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
