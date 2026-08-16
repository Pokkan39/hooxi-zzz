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

export default function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const [coverImage, setCoverImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    // 检查登录态（实际应从全局状态获取）
    const user = localStorage.getItem('user');
    if (!user) {
      setIsLoggedIn(false);
      setTimeout(() => {
        navigateSite('events.html');
      }, 2000);
    }
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="create-post-page">
        <div className="create-post-container">
          <div className="create-post-error" style={{ marginTop: '100px', textAlign: 'center' }}>
            请先登录，2秒后自动跳转...
          </div>
        </div>
      </div>
    );
  }

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
      // 模拟提交（实际应调用后端 API）
      const postData = {
        id: Date.now().toString(),
        title: title.trim(),
        body: body.trim(),
        category,
        coverImage: coverImage || 'https://via.placeholder.com/400x250/1a1a1a/bfff09?text=HOOXI',
        author: JSON.parse(localStorage.getItem('user') || '{}').username || '匿名用户',
        createdAt: new Date().toISOString(),
        views: 0
      };

      // 存储到 localStorage（实际应发送到后端）
      const existingPosts = JSON.parse(localStorage.getItem('userPosts') || '[]');
      existingPosts.unshift(postData);
      localStorage.setItem('userPosts', JSON.stringify(existingPosts));

      // 成功后跳转，不使用阻塞 alert
      navigateSite('events.html');
    } catch (err) {
      setError('发布失败，请重试');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-post-page">
      <div className="create-post-container">
        <header className="create-post-header">
          <h1 className="create-post-title">发布委托</h1>
          <button 
            type="button" 
            className="create-post-back"
            onClick={() => navigateSite('events.html')}
          >
            返回
          </button>
        </header>

        <form className="create-post-form" onSubmit={handleSubmit}>
          {error && <div className="create-post-error">{error}</div>}

          <div className="create-post-field">
            <label htmlFor="title">标题</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入委托标题"
              maxLength={100}
              disabled={isSubmitting}
            />
          </div>

          <div className="create-post-field">
            <label htmlFor="category">分类</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="create-post-field">
            <label htmlFor="cover">封面图片URL（可选）</label>
            <input
              id="cover"
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              disabled={isSubmitting}
            />
          </div>

          <div className="create-post-field">
            <label htmlFor="body">正文</label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="输入委托详情..."
              rows={12}
              maxLength={5000}
              disabled={isSubmitting}
            />
            <div className="create-post-char-count">
              {body.length} / 5000
            </div>
          </div>

          <div className="create-post-actions">
            <button
              type="button"
              className="create-post-btn create-post-btn--secondary"
              onClick={() => navigateSite('events.html')}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="create-post-btn create-post-btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '发布中...' : '发布委托'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
