import React, { useState, useEffect } from 'react';
import { navigateSite } from '../site-runtime.js';
import '../styles/create-post.css';

const CATEGORIES = [
  { id: 'general', label: '综合' },
  { id: '主线', label: '主线' },
  { id: '活动', label: '活动' },
  { id: '幕后', label: '幕后' },
  { id: '对谈', label: '对谈' },
  { id: '官方媒体', label: '官方媒体' }
];

export default function EditPostPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const [coverImage, setCoverImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [postId, setPostId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查管理员权限
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || !user.isAdmin) {
      setError('需要管理员权限');
      setTimeout(() => {
        navigateSite('events.html');
      }, 2000);
      return;
    }
    setIsAdmin(true);

    // 从 URL 获取帖子 ID
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
      setError('缺少帖子ID');
      setTimeout(() => {
        navigateSite('events.html');
      }, 2000);
      return;
    }
    setPostId(id);

    // 加载帖子数据（从 localStorage 或后端）
    loadPostData(id);
  }, []);

  const loadPostData = (id) => {
    try {
      // 优先从用户发布的帖子中查找
      const userPosts = JSON.parse(localStorage.getItem('userPosts') || '[]');
      let post = userPosts.find(p => p.id === id);

      // 如果没找到，从 events 数据中查找
      if (!post) {
        const events = JSON.parse(localStorage.getItem('events') || '[]');
        post = events.find(e => e.id === id);
      }

      if (post) {
        setTitle(post.title || '');
        setBody(post.body || post.content || '');
        setCategory(post.category || post.categoryTag || 'general');
        setCoverImage(post.coverImage || post.cover || post.portrait || '');
      } else {
        setError('帖子不存在');
        setTimeout(() => {
          navigateSite('events.html');
        }, 2000);
      }
    } catch (err) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('请输入标题');
      return;
    }
    if (!body.trim()) {
      setError('请输入正文');
      return;
    }

    setIsSubmitting(true);

    try {
      // 更新用户发布的帖子
      const userPosts = JSON.parse(localStorage.getItem('userPosts') || '[]');
      const idx = userPosts.findIndex(p => p.id === postId);
      if (idx !== -1) {
        userPosts[idx] = {
          ...userPosts[idx],
          title: title.trim(),
          body: body.trim(),
          category,
          coverImage: coverImage || userPosts[idx].coverImage,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('userPosts', JSON.stringify(userPosts));
      }

      // 如果是 events 中的数据，也更新
      const events = JSON.parse(localStorage.getItem('events') || '[]');
      const eventIdx = events.findIndex(e => e.id === postId);
      if (eventIdx !== -1) {
        events[eventIdx] = {
          ...events[eventIdx],
          title: title.trim(),
          content: body.trim(),
          categoryTag: category,
          cover: coverImage || events[eventIdx].cover
        };
        localStorage.setItem('events', JSON.stringify(events));
      }

      navigateSite('events.html');
    } catch (err) {
      setError('保存失败');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="create-post-page">
        <div className="create-post-container">
          <div style={{ marginTop: '100px', textAlign: 'center', color: 'var(--ik-muted)' }}>
            加载中...
          </div>
        </div>
      </div>
    );
  }

  if (error && !isAdmin) {
    return (
      <div className="create-post-page">
        <div className="create-post-container">
          <div className="create-post-error" style={{ marginTop: '100px', textAlign: 'center' }}>
            {error}，2秒后自动跳转...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-post-page">
      <div className="create-post-container">
        <div className="create-post-header">
          <h1 className="create-post-title">编辑委托</h1>
          <button 
            className="create-post-back"
            onClick={() => navigateSite('events.html')}
          >
            返回
          </button>
        </div>

        {error && <div className="create-post-error">{error}</div>}

        <form className="create-post-form" onSubmit={handleSubmit}>
          <div className="create-post-field">
            <label className="create-post-label">标题</label>
            <input
              type="text"
              className="create-post-input"
              placeholder="输入委托标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="create-post-field">
            <label className="create-post-label">分类</label>
            <select
              className="create-post-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="create-post-field">
            <label className="create-post-label">封面图片 URL（选填）</label>
            <input
              type="text"
              className="create-post-input"
              placeholder="https://..."
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
            />
          </div>

          <div className="create-post-field">
            <label className="create-post-label">正文</label>
            <textarea
              className="create-post-textarea"
              placeholder="描述你的委托内容..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
            />
          </div>

          <div className="create-post-actions">
            <button
              type="submit"
              className="create-post-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
