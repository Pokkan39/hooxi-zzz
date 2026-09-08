import React from 'react';
import { createRoot } from 'react-dom/client';
import './data.js';
import PostPage from './pages/PostPage.jsx';
import './index.css';
import { mountReactApp } from './site-runtime.js';

mountReactApp(createRoot, <PostPage />);
